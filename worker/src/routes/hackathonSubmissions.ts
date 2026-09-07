import { Hono } from "hono";
import type { Env } from "../index";
import { getDb } from "../db/client";
import { hackathonSubmissions } from "../db/schema";
import { sendHackathonConfirmation, sendSecretariatNotification } from "../lib/mailer";
import { checkRateLimit } from "../lib/rateLimit";

export const hackathonSubmissionsRoute = new Hono<{ Bindings: Env }>();

// The six GATES priority innovation domains, per Section 2 of the mechanics.
// Mirrors client/src/data/hackathon.ts — the two packages don't share code,
// so keep this list in sync by hand if the domains ever change.
const DOMAINS = [
  "Health, Nutrition, Education, and Social Services",
  "Disaster Risk Reduction and Management",
  "Environmental Monitoring",
  "Project and Knowledge Management",
  "Geospatial Infrastructure Development",
  "Natural Resources Assessment",
];

const EMAIL_RE = /^[^@\s]+@[^@\s.]+(\.[^@\s.]+)+$/;

// %PDF magic bytes. Extension and content-type are checked at presign time,
// but both are client-supplied and spoofable — this is the real check
// (brief §5 security must-fix: validate by magic bytes, not extension alone).
const PDF_MAGIC = [0x25, 0x50, 0x44, 0x46];

function text(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

// Retention periods are proposed but not yet approved (brief §6) — rather
// than compute a date tied to unconfirmed program milestones (finalists
// announced, conference date), default conservatively to the longer of the
// two possible outcomes (the finalist case: 1 year) so nothing is
// under-retained. Revisit once §6 is approved and the scheduled purge job
// that actually acts on this column is built.
const DEFAULT_RETENTION_MS = 365 * 24 * 60 * 60 * 1000;

hackathonSubmissionsRoute.post("/", async (c) => {
  const ip = c.req.header("CF-Connecting-IP") ?? "unknown";
  const allowed = await checkRateLimit(c.env.DB, {
    scope: "hackathon-submissions",
    key: ip,
    limit: 20,
    windowMs: 60_000,
  });
  if (!allowed) {
    return c.json({ error: "Too many submission attempts. Try again in a minute." }, 429);
  }

  const body = await c.req.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return c.json({ error: "Invalid request body." }, 400);
  }

  const team = text(body.team);
  const title = text(body.title);
  const leaderName = text(body.leaderName);
  const leaderEmail = text(body.leaderEmail);
  const domain = text(body.domain);
  const objectKey = text(body.objectKey);

  if (!team || !title) {
    return c.json({ error: "Please enter a team name and project title." }, 400);
  }
  if (!leaderName || !leaderEmail) {
    return c.json({ error: "Please enter the team leader's name and email address." }, 400);
  }
  if (!EMAIL_RE.test(leaderEmail)) {
    return c.json({ error: "Please enter a valid team leader email address." }, 400);
  }
  if (domain && !DOMAINS.includes(domain)) {
    return c.json({ error: "Please choose one of the six priority innovation domains." }, 400);
  }
  if (body.consent !== true) {
    return c.json({ error: "You must consent to data processing to submit a proposal." }, 400);
  }
  if (body.memberConsentAttested !== true) {
    return c.json(
      { error: "Please confirm each named member and endorsing head has been informed." },
      400,
    );
  }
  if (typeof body.documentationConsent !== "boolean") {
    return c.json({ error: "Please indicate your photo/video documentation preference." }, 400);
  }
  if (!objectKey) {
    return c.json({ error: "Please upload your proposal PDF before submitting." }, 400);
  }

  // Verify the file is actually there, and is actually a PDF, before this
  // submission can be trusted — reading just the first 4 bytes keeps this
  // check cheap regardless of the file's real size.
  const object = await c.env.BUCKET.get(objectKey, { range: { offset: 0, length: 4 } });
  if (!object) {
    return c.json(
      { error: "The uploaded file could not be found. Please upload your proposal again." },
      400,
    );
  }
  const head = new Uint8Array(await object.arrayBuffer());
  const isPdf = PDF_MAGIC.every((byte, i) => head[i] === byte);
  if (!isPdf) {
    return c.json({ error: "The uploaded file doesn't look like a valid PDF." }, 400);
  }

  const now = Date.now();
  const id = crypto.randomUUID();
  const db = getDb(c.env.DB);

  try {
    await db.insert(hackathonSubmissions).values({
      id,
      team,
      title,
      domain,
      agency: text(body.agency),
      leaderName,
      leaderPosition: text(body.leaderPosition),
      leaderEmail,
      leaderMobile: text(body.leaderMobile),
      members: text(body.members),
      endorsingHead: text(body.endorsingHead),
      objectKey,
      fileName: text(body.fileName),
      fileSize: typeof body.fileSize === "number" ? body.fileSize : null,
      mimeType: typeof body.mimeType === "string" ? body.mimeType : null,
      // Reaching here means the file was already verified above, so this is
      // always "complete" — "pending" is reserved for a future async
      // verification pipeline, not reachable through this code path today.
      status: "complete",
      consentedAt: now,
      privacyNoticeVersion: c.env.PRIVACY_NOTICE_VERSION,
      documentationConsent: body.documentationConsent,
      memberConsentAttested: true,
      retentionUntil: now + DEFAULT_RETENTION_MS,
      createdAt: now,
    });
  } catch (err) {
    // The old Express code had a DB call inside multer's async callback with
    // no error handler — a DB error hung the browser with no response ever
    // sent. This is the fix: catch it, return an actual error.
    console.error("Failed to save hackathon submission:", err);
    return c.json({ error: "Something went wrong saving your submission. Please try again." }, 500);
  }

  // Fire-and-forget: a mail failure must never fail the submission or delay
  // the response, so these are deliberately not awaited. They're still
  // registered with waitUntil, though — an unawaited promise on Workers can
  // get torn down the instant the response is returned, since nothing else
  // is keeping the isolate alive for it. waitUntil tells the runtime "let
  // this finish anyway," without making the request wait on it.
  c.executionCtx.waitUntil(
    sendHackathonConfirmation(c.env, leaderEmail, { id, team, title, leaderName, domain }).catch(
      (err) => console.error("Failed to send hackathon confirmation email:", err),
    ),
  );
  c.executionCtx.waitUntil(
    sendSecretariatNotification(c.env, {
      id,
      team,
      title,
      domain,
      agency: text(body.agency),
      leaderName,
      leaderEmail,
      leaderMobile: text(body.leaderMobile),
      members: text(body.members),
      endorsingHead: text(body.endorsingHead),
      fileName: text(body.fileName),
      fileSize: typeof body.fileSize === "number" ? body.fileSize : null,
      createdAt: now,
    }).catch((err) => console.error("Failed to send secretariat notification:", err)),
  );

  return c.json({ id }, 201);
});
