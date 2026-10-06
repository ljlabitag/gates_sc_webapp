import { Hono } from "hono";
import { setSignedCookie, deleteCookie } from "hono/cookie";
import { and, desc, eq, isNull, ne, sql } from "drizzle-orm";
import type { AppEnv } from "../index";
import { getDb } from "../db/client";
import { registrations, hackathonSubmissions } from "../db/schema";
import { timingSafeEqual } from "../lib/auth";
import { toCsv } from "../lib/csv";
import { logAudit } from "../lib/auditLog";
import { parseRegistrationFields } from "../lib/registrationFields";
import { sendRegistrationConfirmation } from "../lib/mailer";
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

// Admin corrections to a registration — the access/correction/erasure rights
// the privacy notice promises have to be actionable by someone, and this is
// that someone. Each action is audit-logged (who, what, when) like reads are.
// Only the registrant's own details are editable; consent records and
// retention dates are a statement they made and are left untouched.
adminRoute.patch("/registrations/:id", adminAuth, async (c) => {
  const id = c.req.param("id");
  if (!id) return c.notFound();
  const body = await c.req.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return c.json({ error: "Invalid request body." }, 400);
  }
  const parsed = parseRegistrationFields(body);
  if (!parsed.ok) {
    return c.json({ error: parsed.error }, 400);
  }
  const fields = parsed.value;

  const db = getDb(c.env.DB);
  const [existing] = await db
    .select({ id: registrations.id })
    .from(registrations)
    .where(and(eq(registrations.id, id), isNull(registrations.deletedAt)))
    .limit(1);
  if (!existing) {
    return c.json({ error: "Registration not found." }, 404);
  }

  const emailTaken = await db
    .select({ id: registrations.id })
    .from(registrations)
    .where(
      and(sql`lower(${registrations.email}) = ${fields.email}`, isNull(registrations.deletedAt), ne(registrations.id, id)),
    )
    .limit(1);
  if (emailTaken.length > 0) {
    return c.json({ error: "Another registration already uses that email address." }, 409);
  }

  try {
    await db.update(registrations).set(fields).where(eq(registrations.id, id));
  } catch (err) {
    if (String(err).includes("UNIQUE")) {
      return c.json({ error: "Another registration already uses that email address." }, 409);
    }
    console.error("Failed to update registration:", err);
    return c.json({ error: "Could not save the changes." }, 500);
  }
  await logAudit(c.env.DB, { actor: c.get("actor"), action: "update", resource: "registrations", resourceId: id });

  const [row] = await db.select().from(registrations).where(eq(registrations.id, id)).limit(1);
  return c.json(row);
});

// Re-sends the original confirmation (same registration id, so same QR) to
// the address on file. Awaited, unlike the public form's fire-and-forget: an
// admin pressing the button should find out if the mail provider refused it.
adminRoute.post("/registrations/:id/resend", adminAuth, async (c) => {
  const id = c.req.param("id");
  if (!id) return c.notFound();
  const db = getDb(c.env.DB);
  const [row] = await db
    .select({ id: registrations.id, name: registrations.name, email: registrations.email })
    .from(registrations)
    .where(and(eq(registrations.id, id), isNull(registrations.deletedAt)))
    .limit(1);
  if (!row) {
    return c.json({ error: "Registration not found." }, 404);
  }
  try {
    await sendRegistrationConfirmation(c.env, row.email, { id: row.id, name: row.name });
  } catch (err) {
    console.error("Admin re-send of registration confirmation failed:", err);
    return c.json({ error: "The email provider rejected the message. Check the logs and try again." }, 502);
  }
  await logAudit(c.env.DB, { actor: c.get("actor"), action: "resend", resource: "registrations", resourceId: id });
  return c.json({ ok: true, email: row.email });
});

// Permanent erasure, not a soft delete: a soft-deleted row would keep every
// piece of personal data, which is the opposite of an erasure request. What
// survives is the audit entry — the registration id, who deleted it and when,
// with no personal data in it.
adminRoute.delete("/registrations/:id", adminAuth, async (c) => {
  const id = c.req.param("id");
  if (!id) return c.notFound();
  const db = getDb(c.env.DB);
  const deleted = await db.delete(registrations).where(eq(registrations.id, id)).returning({ id: registrations.id });
  if (deleted.length === 0) {
    return c.json({ error: "Registration not found." }, 404);
  }
  await logAudit(c.env.DB, { actor: c.get("actor"), action: "delete", resource: "registrations", resourceId: id });
  return c.json({ ok: true });
});

// --- Venue check-in -------------------------------------------------------
// Staff scan each registrant's QR code (which encodes their registration id)
// at the door. Check-in is idempotent and race-safe: the UPDATE only matches
// a row that hasn't been checked in yet, so two stations scanning the same
// code at once can't both "win" — one gets checked_in, the other
// already_checked_in with the first scan's time.
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
const STATION_MAX_LENGTH = 40;

// What a staff screen at a public door may show about someone: enough to
// match the name to the person, and deliberately no dietary or assistance
// details (health-adjacent data stays out of the list-at-the-door view).
const attendeeColumns = {
  id: registrations.id,
  name: registrations.name,
  nickname: registrations.nickname,
  agency: registrations.agency,
  division: registrations.division,
  designation: registrations.designation,
  checkedInAt: registrations.checkedInAt,
  checkedInBy: registrations.checkedInBy,
};

adminRoute.post("/checkin", adminAuth, async (c) => {
  const body = await c.req.json().catch(() => null);
  const id = typeof body?.id === "string" ? body.id.trim().toLowerCase() : "";
  if (!UUID_RE.test(id)) {
    return c.json({ status: "invalid", error: "That doesn't look like a registration QR code." }, 400);
  }
  const station = typeof body?.station === "string" ? body.station.trim().slice(0, STATION_MAX_LENGTH) : "";
  const by = station || c.get("actor");

  const db = getDb(c.env.DB);
  const now = Date.now();
  const [fresh] = await db
    .update(registrations)
    .set({ checkedInAt: now, checkedInBy: by })
    .where(and(eq(registrations.id, id), isNull(registrations.deletedAt), isNull(registrations.checkedInAt)))
    .returning(attendeeColumns);
  if (fresh) {
    await logAudit(c.env.DB, { actor: c.get("actor"), action: "checkin", resource: "registrations", resourceId: id });
    return c.json({ status: "checked_in", attendee: fresh });
  }

  const [existing] = await db
    .select(attendeeColumns)
    .from(registrations)
    .where(and(eq(registrations.id, id), isNull(registrations.deletedAt)))
    .limit(1);
  if (!existing) {
    return c.json({ status: "not_found", error: "No registration matches this QR code." }, 404);
  }
  return c.json({ status: "already_checked_in", attendee: existing });
});

// Undo a mistaken check-in (wrong person scanned, test scan, etc.).
adminRoute.delete("/checkin/:id", adminAuth, async (c) => {
  const id = c.req.param("id");
  if (!id) return c.notFound();
  const db = getDb(c.env.DB);
  const cleared = await db
    .update(registrations)
    .set({ checkedInAt: null, checkedInBy: null })
    .where(and(eq(registrations.id, id), isNull(registrations.deletedAt)))
    .returning({ id: registrations.id });
  if (cleared.length === 0) {
    return c.json({ error: "Registration not found." }, 404);
  }
  await logAudit(c.env.DB, { actor: c.get("actor"), action: "checkin_undo", resource: "registrations", resourceId: id });
  return c.json({ ok: true });
});

// Fallback for people who can't show their QR code: find by name, nickname,
// email or agency. Returns at most a handful of rows — this is a lookup at
// the door, not a way to browse the list.
adminRoute.get("/checkin/search", adminAuth, async (c) => {
  const q = (c.req.query("q") ?? "").trim().toLowerCase();
  if (q.length < 2) return c.json([]);
  // "!" is the LIKE escape character: backslashes inside a template literal are a trap.
  const like = `%${q.replace(/[!%_]/g, (m) => "!" + m)}%`;
  const db = getDb(c.env.DB);
  const rows = await db
    .select({ ...attendeeColumns, email: registrations.email })
    .from(registrations)
    .where(
      and(
        isNull(registrations.deletedAt),
        sql`(lower(${registrations.name}) like ${like} escape '!'
          or lower(coalesce(${registrations.nickname}, '')) like ${like} escape '!'
          or lower(${registrations.email}) like ${like} escape '!'
          or lower(coalesce(${registrations.agency}, '')) like ${like} escape '!')`,
      ),
    )
    .orderBy(registrations.name)
    .limit(8);
  await logAudit(c.env.DB, { actor: c.get("actor"), action: "view", resource: "registrations" });
  return c.json(rows);
});

adminRoute.get("/checkin/stats", adminAuth, async (c) => {
  const db = getDb(c.env.DB);
  const [row] = await db
    .select({
      registered: sql<number>`count(*)`,
      checkedIn: sql<number>`count(${registrations.checkedInAt})`,
    })
    .from(registrations)
    .where(isNull(registrations.deletedAt));
  return c.json({ registered: row?.registered ?? 0, checkedIn: row?.checkedIn ?? 0 });
});

const REGISTRATION_COLUMNS = [
  "id",
  "eventId",
  "name",
  "lastName",
  "firstName",
  "middleInitial",
  "nickname",
  "email",
  "mobile",
  "agency",
  "division",
  "designation",
  "dietaryPreferences",
  "foodAllergies",
  "specialAssistance",
  "assistanceNeeded",
  "consentedAt",
  "privacyNoticeVersion",
  "documentationConsent",
  "retentionUntil",
  "checkedInAt",
  "checkedInBy",
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
