import { Hono } from "hono";
import type { Env } from "../index";
import { getDb } from "../db/client";
import { hackathonSubmissions } from "../db/schema";
import { sendHackathonConfirmation, sendSecretariatNotification, type MailAttachment } from "../lib/mailer";
import { checkRateLimit } from "../lib/rateLimit";
import { backupToMinio } from "../storage/s3";

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

// Brevo caps attachments at 4MB per file (confirmed against Brevo's docs).
// Base64 inflates the encoded size by roughly a third, so this stays well
// under that even after encoding. Most proposals are nowhere near the 100MB
// upload cap in practice, but when one is, the secretariat email just falls
// back to metadata + the admin-record link, same as before attachments
// existed — it never blocks or fails the submission itself.
const ATTACHMENT_MAX_BYTES = 3 * 1024 * 1024;

// Re-fetches the full file from R2 for the secretariat email attachment.
// Deliberately not the same read as the magic-byte check above (that one is
// range-limited to 4 bytes) — this happens inside the fire-and-forget email
// task below, so it never delays the submission response.
async function buildAttachment(
  env: Env,
  objectKey: string,
  fileName: string | null,
  fileSize: number | null,
): Promise<MailAttachment | null> {
  if (!fileSize || fileSize > ATTACHMENT_MAX_BYTES) return null;
  try {
    const object = await env.BUCKET.get(objectKey);
    if (!object) return null;
    return { name: fileName ?? "proposal.pdf", content: await object.arrayBuffer() };
  } catch (err) {
    console.error("Failed to fetch proposal file for email attachment:", err);
    return null;
  }
}

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
  const submittedFileName = text(body.fileName);
  const submittedFileSize = typeof body.fileSize === "number" ? body.fileSize : null;
  c.executionCtx.waitUntil(
    buildAttachment(c.env, objectKey, submittedFileName, submittedFileSize)
      .then((attachment) =>
        sendSecretariatNotification(
          c.env,
          {
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
            fileName: submittedFileName,
            fileSize: submittedFileSize,
            createdAt: now,
          },
          attachment,
        ),
      )
      .catch((err) => console.error("Failed to send secretariat notification:", err)),
  );

  // Independent of the email attachment above — MinIO gets the full file
  // regardless of size (no Brevo-style cap applies to it), so this always
  // does its own fetch from R2 rather than reusing buildAttachment's
  // size-limited one.
  const submittedMimeType = typeof body.mimeType === "string" ? body.mimeType : "application/pdf";
  // Falls back to the R2 object's own basename in the rare case a direct API
  // call omits fileName — the actual site always sends it (client/src/lib/api.ts
  // sets it from the browser File object), so this fallback shouldn't fire
  // in practice.
  const minioFileName = submittedFileName ?? objectKey.split("/").pop() ?? `${id}.pdf`;
  c.executionCtx.waitUntil(
    c.env.BUCKET.get(objectKey)
      .then((r2Object) => {
        if (!r2Object) throw new Error(`objectKey not found in R2: ${objectKey}`);
        return r2Object.arrayBuffer();
      })
      .then((fileBody) => backupToMinio(c.env, { fileName: minioFileName, contentType: submittedMimeType, body: fileBody }))
      .catch((err) => console.error("Failed to back up proposal file to MinIO:", err)),
  );

  return c.json({ id }, 201);
});
