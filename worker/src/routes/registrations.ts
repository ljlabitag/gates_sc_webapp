import { Hono } from "hono";
import { eq } from "drizzle-orm";
import type { Env } from "../index";
import { getDb } from "../db/client";
import { registrations } from "../db/schema";
import { sendRegistrationConfirmation } from "../lib/mailer";
import { qrPng } from "../lib/qr";
import { checkRateLimit } from "../lib/rateLimit";

export const registrationsRoute = new Hono<{ Bindings: Env }>();

// Mirror client/src/data/registration.ts — the two packages don't share code,
// so keep these in sync by hand if the options or limits ever change.
const DIETARY_OPTIONS = ["Vegetarian", "Halal", "No pork"];
const ASSISTANCE_OPTIONS = ["Senior citizen", "Person with disability (PWD)", "Pregnant"];
const LIMITS = {
  name: 60,
  mobile: 25,
  agency: 160,
  organization: 160,
  designation: 120,
  foodAllergies: 200,
  assistanceNeeded: 200,
};

const EMAIL_RE = /^[^@\s]+@[^@\s.]+(\.[^@\s.]+)+$/;
const EMAIL_MAX_LENGTH = 254;

// Deliberately lenient: this is a contact number, not an identifier, and
// attendees include development partners with non-PH numbers. It only has to
// catch obvious junk — allowed characters and a plausible digit count (a PH
// mobile is 11 digits as 09XX…, 12 as +63 9XX…; E.164 tops out at 15).
const MOBILE_RE = /^\+?[0-9][0-9\s\-()]*$/;

// Registration data is kept 90 days after the conference (brief §6, proposed
// and still pending approval). Mirrors CONFERENCE_DATE in
// client/src/data/conference.ts. The dietary and assistance columns have a
// shorter proposed horizon (14 days) that a single retentionUntil can't
// express — the scheduled purge job that acts on these (not built yet) is
// where that distinction has to live.
const CONFERENCE_DATE_MS = Date.parse("2026-11-10T09:00:00+08:00");
const REGISTRATION_RETENTION_MS = 90 * 24 * 60 * 60 * 1000;

function text(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

// Optional checklist field: absent is fine, but if present it must be an
// array drawn from the fixed list — anything else is a hand-built request,
// not this site's form. Returns the canonical (list-ordered, "; "-joined)
// value, or null when nothing was ticked.
function checklist(value: unknown, allowed: string[]): { ok: true; value: string | null } | { ok: false } {
  const raw: unknown = value ?? [];
  if (!Array.isArray(raw) || !raw.every((v) => typeof v === "string" && allowed.includes(v))) {
    return { ok: false };
  }
  const chosen = allowed.filter((option) => raw.includes(option));
  return { ok: true, value: chosen.join("; ") || null };
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

  const firstName = text(body.firstName);
  const lastName = text(body.lastName);
  // Accept "D" or "D." — stored as the bare uppercase letter.
  const rawInitial = text(body.middleInitial)?.replace(/\.$/, "") ?? null;
  const email = text(body.email);
  const mobile = text(body.mobile);
  const agency = text(body.agency);
  const organization = text(body.organization);
  const designation = text(body.designation);
  const foodAllergies = text(body.foodAllergies);
  const assistanceNeeded = text(body.assistanceNeeded);

  if (!firstName) {
    return c.json({ error: "Please enter your first name." }, 400);
  }
  if (!lastName) {
    return c.json({ error: "Please enter your last name." }, 400);
  }
  if (rawInitial && !/^\p{L}$/u.test(rawInitial)) {
    return c.json({ error: "Middle initial should be a single letter." }, 400);
  }
  if (!email) {
    return c.json({ error: "Please enter your email address." }, 400);
  }
  if (!EMAIL_RE.test(email) || email.length > EMAIL_MAX_LENGTH) {
    return c.json({ error: "Please enter a valid email address." }, 400);
  }
  if (!mobile) {
    return c.json({ error: "Please enter your mobile number." }, 400);
  }
  const mobileDigits = mobile.replace(/\D/g, "").length;
  if (!MOBILE_RE.test(mobile) || mobile.length > LIMITS.mobile || mobileDigits < 10 || mobileDigits > 15) {
    return c.json({ error: "Please enter a valid mobile number." }, 400);
  }
  if (!agency) {
    return c.json({ error: "Please enter your agency or office." }, 400);
  }
  if (!designation) {
    return c.json({ error: "Please enter your designation or position." }, 400);
  }
  if (
    firstName.length > LIMITS.name ||
    lastName.length > LIMITS.name ||
    agency.length > LIMITS.agency ||
    (organization?.length ?? 0) > LIMITS.organization ||
    designation.length > LIMITS.designation
  ) {
    return c.json({ error: "One of the fields you entered is too long." }, 400);
  }

  const dietary = checklist(body.dietaryPreferences, DIETARY_OPTIONS);
  if (!dietary.ok) {
    return c.json({ error: "Please choose dietary preferences from the list provided." }, 400);
  }
  const assistance = checklist(body.specialAssistance, ASSISTANCE_OPTIONS);
  if (!assistance.ok) {
    return c.json({ error: "Please choose special assistance options from the list provided." }, 400);
  }
  if ((foodAllergies?.length ?? 0) > LIMITS.foodAllergies) {
    return c.json(
      { error: `Please keep the food allergy note under ${LIMITS.foodAllergies} characters.` },
      400,
    );
  }
  if ((assistanceNeeded?.length ?? 0) > LIMITS.assistanceNeeded) {
    return c.json(
      { error: `Please keep the assistance note under ${LIMITS.assistanceNeeded} characters.` },
      400,
    );
  }

  if (body.consent !== true) {
    return c.json({ error: "You must consent to data processing to register." }, 400);
  }
  if (typeof body.documentationConsent !== "boolean") {
    return c.json({ error: "Please indicate your photo/video documentation preference." }, 400);
  }

  const middleInitial = rawInitial ? rawInitial.toLocaleUpperCase() : null;
  const name = [firstName, middleInitial ? `${middleInitial}.` : null, lastName].filter(Boolean).join(" ");

  const now = Date.now();
  const id = crypto.randomUUID();
  const db = getDb(c.env.DB);

  try {
    await db.insert(registrations).values({
      id,
      // Reserved for the deferred voucher module's events table — stays null
      // until that lands, so adding it later is additive.
      eventId: null,
      name,
      firstName,
      middleInitial,
      lastName,
      email,
      mobile,
      agency,
      organization,
      designation,
      dietaryPreferences: dietary.value,
      foodAllergies,
      specialAssistance: assistance.value,
      assistanceNeeded,
      consentedAt: now,
      privacyNoticeVersion: c.env.PRIVACY_NOTICE_VERSION,
      documentationConsent: body.documentationConsent,
      retentionUntil: CONFERENCE_DATE_MS + REGISTRATION_RETENTION_MS,
      createdAt: now,
    });
  } catch (err) {
    console.error("Failed to save registration:", err);
    return c.json({ error: "Something went wrong saving your registration. Please try again." }, 500);
  }

  // Fire-and-forget under waitUntil, same as the hackathon route: a mail
  // failure must never fail or delay the registration, but an unawaited
  // promise can be torn down the instant the response returns.
  c.executionCtx.waitUntil(
    sendRegistrationConfirmation(c.env, email, { id, name }).catch((err) =>
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
