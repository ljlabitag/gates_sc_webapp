import { Hono, type Context } from "hono";
import { and, eq, isNull, sql } from "drizzle-orm";
import type { Env } from "../index";
import { getDb } from "../db/client";
import { registrations } from "../db/schema";
import { sendRegistrationConfirmation } from "../lib/mailer";
import { checkRateLimit } from "../lib/rateLimit";
import { qrPng } from "../lib/qr";
import { parseRegistrationFields } from "../lib/registrationFields";
import { turnstileEnabled, verifyTurnstile } from "../lib/turnstile";

export const registrationsRoute = new Hono<{ Bindings: Env }>();

// Registration data is kept 90 days after the conference (brief §6, proposed
// and still pending approval). Mirrors CONFERENCE_DATE in
// client/src/data/conference.ts. The dietary and assistance columns have a
// shorter proposed horizon (14 days) that a single retentionUntil can't
// express — the scheduled purge job that acts on these (not built yet) is
// where that distinction has to live.
const CONFERENCE_DATE_MS = Date.parse("2026-11-10T09:00:00+08:00");
const REGISTRATION_RETENTION_MS = 90 * 24 * 60 * 60 * 1000;

// A repeat submission re-sends the original confirmation, but only this many
// times per hour per address — otherwise the form could be used to mail-bomb
// a registered person from the official sender.
const RESEND_LIMIT_PER_HOUR = 2;

// Tells the form whether to show the bot check, and with which public site
// key. Served at runtime rather than baked into the build because staging and
// production share one client build but have different Turnstile keys.
registrationsRoute.get("/config", (c) => {
  const siteKey = turnstileEnabled(c.env) ? (c.env.TURNSTILE_SITE_KEY ?? null) : null;
  return c.json({ turnstileSiteKey: siteKey });
});

// One registration per email address. A repeat submission doesn't create a
// second record (and a second QR code): it re-sends the original
// confirmation, so someone who lost the email can recover it, and keeps the
// details they first gave — changes go through the secretariat.
async function respondAlreadyRegistered(c: Context<{ Bindings: Env }>, email: string) {
  const db = getDb(c.env.DB);
  const [existing] = await db
    .select({ id: registrations.id, name: registrations.name, email: registrations.email })
    .from(registrations)
    .where(and(sql`lower(${registrations.email}) = ${email}`, isNull(registrations.deletedAt)))
    .limit(1);
  if (!existing) return null;

  const mayResend = await checkRateLimit(c.env.DB, {
    scope: "registration-resend",
    key: email,
    limit: RESEND_LIMIT_PER_HOUR,
    windowMs: 60 * 60 * 1000,
  });
  if (mayResend) {
    c.executionCtx.waitUntil(
      sendRegistrationConfirmation(c.env, existing.email, { id: existing.id, name: existing.name }).catch((err) =>
        console.error("Failed to re-send registration confirmation email:", err),
      ),
    );
  }
  // Deliberately omits the existing registration's id: that id *is* the
  // check-in QR, so returning it would hand it to anyone who knows an email.
  return { alreadyRegistered: true as const, resent: mayResend };
}

// Registration is by emailed link rather than a per-invitee code (the voucher
// module is deferred), so this endpoint is deliberately open and uncapped —
// any seat limit or invitation gate would be added later without changing
// this request shape.
registrationsRoute.post("/", async (c) => {
  const ip = c.req.header("CF-Connecting-IP") ?? "unknown";
  const allowed = await checkRateLimit(c.env.DB, {
    scope: "registrations",
    key: ip,
    limit: 20,
    windowMs: 60_000,
  });
  if (!allowed) {
    return c.json({ error: "Too many registration attempts. Try again in a minute." }, 429);
  }

  const body = await c.req.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return c.json({ error: "Invalid request body." }, 400);
  }

  const parsed = parseRegistrationFields(body);
  if (!parsed.ok) {
    return c.json({ error: parsed.error }, 400);
  }
  const fields = parsed.value;

  if (body.consent !== true) {
    return c.json({ error: "You must consent to data processing to register." }, 400);
  }
  if (typeof body.documentationConsent !== "boolean") {
    return c.json({ error: "Please indicate your photo/video documentation preference." }, 400);
  }

  // After the cheap checks, so a mistyped form doesn't cost a verification
  // call; before any database work, so bots never reach it.
  if (turnstileEnabled(c.env)) {
    const token = typeof body.turnstileToken === "string" ? body.turnstileToken : "";
    if (!token) {
      return c.json({ error: "Please complete the verification and try again." }, 400);
    }
    if (!(await verifyTurnstile(c.env, token, ip))) {
      return c.json({ error: "We couldn't verify you're not a bot. Please try again." }, 400);
    }
  }

  const duplicate = await respondAlreadyRegistered(c, fields.email);
  if (duplicate) return c.json(duplicate, 200);

  const now = Date.now();
  const id = crypto.randomUUID();
  const db = getDb(c.env.DB);

  try {
    await db.insert(registrations).values({
      id,
      // Reserved for the deferred voucher module's events table — stays null
      // until that lands, so adding it later is additive.
      eventId: null,
      ...fields,
      consentedAt: now,
      privacyNoticeVersion: c.env.PRIVACY_NOTICE_VERSION,
      documentationConsent: body.documentationConsent,
      retentionUntil: CONFERENCE_DATE_MS + REGISTRATION_RETENTION_MS,
      createdAt: now,
    });
  } catch (err) {
    // Two submissions for the same address racing past the check above: the
    // unique index lets exactly one in, and the loser gets the same
    // already-registered answer as any other repeat.
    if (String(err).includes("UNIQUE")) {
      const raced = await respondAlreadyRegistered(c, fields.email);
      if (raced) return c.json(raced, 200);
    }
    console.error("Failed to save registration:", err);
    return c.json({ error: "Something went wrong saving your registration. Please try again." }, 500);
  }

  // Fire-and-forget under waitUntil, same as the hackathon route: a mail
  // failure must never fail or delay the registration, but an unawaited
  // promise can be torn down the instant the response returns.
  c.executionCtx.waitUntil(
    sendRegistrationConfirmation(c.env, fields.email, { id, name: fields.name }).catch((err) =>
      console.error("Failed to send registration confirmation email:", err),
    ),
  );

  return c.json({ id }, 201);
});

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

// The check-in QR shown in the confirmation email. Email clients can't render
// SVG or data: images reliably, so the email links to this PNG instead. The QR
// encodes just the registration id (a random UUID, so the URL isn't guessable
// and carries no personal data); an unknown id 404s rather than turning this
// into a QR generator for arbitrary input.
registrationsRoute.get("/:id/qr.png", async (c) => {
  const id = c.req.param("id");
  if (!UUID_RE.test(id)) return c.notFound();

  const db = getDb(c.env.DB);
  const [row] = await db.select({ id: registrations.id }).from(registrations).where(eq(registrations.id, id)).limit(1);
  if (!row) return c.notFound();

  return new Response(await qrPng(id), {
    headers: {
      "Content-Type": "image/png",
      // The image for a given id never changes.
      "Cache-Control": "public, max-age=86400, immutable",
    },
  });
});
