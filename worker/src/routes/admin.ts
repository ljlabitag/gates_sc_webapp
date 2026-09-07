import { Hono } from "hono";
import { setSignedCookie, deleteCookie } from "hono/cookie";
import { desc, eq, isNull } from "drizzle-orm";
import type { AppEnv } from "../index";
import { getDb } from "../db/client";
import { registrations, hackathonSubmissions } from "../db/schema";
import { timingSafeEqual } from "../lib/auth";
import { toCsv } from "../lib/csv";
import { logAudit } from "../lib/auditLog";
import { presignDownload } from "../storage/s3";
import { adminAuth, SESSION_COOKIE } from "../middleware/adminAuth";
import { checkRateLimit } from "../lib/rateLimit";

export const adminRoute = new Hono<AppEnv>();

const SESSION_MAX_AGE_SECONDS = 60 * 60 * 12; // 12 hours

adminRoute.post("/login", async (c) => {
  const ip = c.req.header("CF-Connecting-IP") ?? "unknown";
  const allowed = await checkRateLimit(c.env.DB, {
    scope: "admin-login",
    key: ip,
    limit: 10,
    windowMs: 60_000,
  });
  if (!allowed) {
    return c.json({ error: "Too many login attempts. Try again in a minute." }, 429);
  }

  // Fail closed: unset credentials must never authenticate anything. This is
  // the exact bug the brief flags in the old middleware — unset
  // ADMIN_USER/ADMIN_PASSWORD defaulted to "" via `process.env.X || ""`,
  // which then matched a blank Basic-auth header. Reject outright instead.
  if (!c.env.ADMIN_USER || !c.env.ADMIN_PASSWORD) {
    return c.json({ error: "Admin login is not configured." }, 401);
  }

  const body = await c.req.json().catch(() => null);
  if (!body || typeof body.username !== "string" || typeof body.password !== "string") {
    return c.json({ error: "Username and password are required." }, 400);
  }

  const [userOk, passOk] = await Promise.all([
    timingSafeEqual(body.username, c.env.ADMIN_USER),
    timingSafeEqual(body.password, c.env.ADMIN_PASSWORD),
  ]);
  if (!userOk || !passOk) {
    return c.json({ error: "Invalid credentials." }, 401);
  }

  // Signed, httpOnly, secure, sameSite session cookie — replaces the old
  // reversible base64 Basic-auth credentials sitting in sessionStorage,
  // which were an XSS away from full compromise (brief §5.3). Stateless: the
  // browser's own Max-Age enforces expiry, and the signature (checked in
  // adminAuth) proves the value wasn't forged — no server-side session store
  // needed for a single shared admin credential.
  await setSignedCookie(c, SESSION_COOKIE, c.env.ADMIN_USER, c.env.SESSION_SECRET, {
    httpOnly: true,
    secure: true,
    sameSite: "Strict",
    path: "/",
    maxAge: SESSION_MAX_AGE_SECONDS,
  });
  return c.json({ ok: true });
});

adminRoute.post("/logout", (c) => {
  deleteCookie(c, SESSION_COOKIE, { path: "/" });
  return c.json({ ok: true });
});

adminRoute.get("/registrations", adminAuth, async (c) => {
  const db = getDb(c.env.DB);
  const rows = await db
    .select()
    .from(registrations)
    .where(isNull(registrations.deletedAt))
    .orderBy(desc(registrations.createdAt));
  await logAudit(c.env.DB, { actor: c.get("actor"), action: "view", resource: "registrations" });
  return c.json(rows);
});

const REGISTRATION_COLUMNS = [
  "id",
  "eventId",
  "name",
  "email",
  "organization",
  "dietaryAccessibility",
  "consentedAt",
  "privacyNoticeVersion",
  "documentationConsent",
  "retentionUntil",
  "createdAt",
] as const;

adminRoute.get("/registrations/export", adminAuth, async (c) => {
  const db = getDb(c.env.DB);
  const rows = await db
    .select()
    .from(registrations)
    .where(isNull(registrations.deletedAt))
    .orderBy(desc(registrations.createdAt));
  const csv = toCsv(rows, [...REGISTRATION_COLUMNS]);
  await logAudit(c.env.DB, { actor: c.get("actor"), action: "export", resource: "registrations" });
  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="gates-registrations.csv"',
    },
  });
});

adminRoute.get("/hackathon-submissions", adminAuth, async (c) => {
  const db = getDb(c.env.DB);
  const rows = await db
    .select()
    .from(hackathonSubmissions)
    .where(isNull(hackathonSubmissions.deletedAt))
    .orderBy(desc(hackathonSubmissions.createdAt));
  await logAudit(c.env.DB, { actor: c.get("actor"), action: "view", resource: "hackathon_submissions" });
  return c.json(rows);
});

const HACKATHON_SUBMISSION_COLUMNS = [
  "id",
  "team",
  "title",
  "domain",
  "agency",
  "leaderName",
  "leaderPosition",
  "leaderEmail",
  "leaderMobile",
  "members",
  "endorsingHead",
  "fileName",
  "fileSize",
  "mimeType",
  "status",
  "consentedAt",
  "privacyNoticeVersion",
  "documentationConsent",
  "memberConsentAttested",
  "retentionUntil",
  "createdAt",
] as const;

adminRoute.get("/hackathon-submissions/export", adminAuth, async (c) => {
  const db = getDb(c.env.DB);
  const rows = await db
    .select()
    .from(hackathonSubmissions)
    .where(isNull(hackathonSubmissions.deletedAt))
    .orderBy(desc(hackathonSubmissions.createdAt));
  const csv = toCsv(rows, [...HACKATHON_SUBMISSION_COLUMNS]);
  await logAudit(c.env.DB, { actor: c.get("actor"), action: "export", resource: "hackathon_submissions" });
  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="gates-hackathon-submissions.csv"',
    },
  });
});

// Redirects to a short-TTL signed R2 URL rather than proxying the file or
// exposing a permanent link (brief §6) — retrieval stays authenticated (the
// redirect itself requires the admin session) and auditable, and a copied
// link goes stale in 5 minutes instead of forever.
adminRoute.get("/hackathon-submissions/:id/file", adminAuth, async (c) => {
  const id = c.req.param("id");
  if (!id) {
    return c.json({ error: "File not found." }, 404);
  }
  const db = getDb(c.env.DB);
  const [submission] = await db
    .select()
    .from(hackathonSubmissions)
    .where(eq(hackathonSubmissions.id, id))
    .limit(1);

  if (!submission?.objectKey) {
    return c.json({ error: "File not found." }, 404);
  }

  const url = await presignDownload(c.env, {
    objectKey: submission.objectKey,
    fileName: submission.fileName,
  });
  await logAudit(c.env.DB, {
    actor: c.get("actor"),
    action: "download",
    resource: "hackathon_submissions",
    resourceId: id,
  });
  return c.redirect(url, 302);
});
