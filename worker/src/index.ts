import { Hono } from "hono";
import { presignUpload } from "./storage/s3";
import { hackathonSubmissionsRoute } from "./routes/hackathonSubmissions";
import { adminRoute } from "./routes/admin";
import { checkRateLimit } from "./lib/rateLimit";

export type Env = {
  DB: D1Database;
  BUCKET: R2Bucket;
  ASSETS: Fetcher;
  R2_ENDPOINT: string;
  R2_BUCKET_NAME: string;
  R2_ACCESS_KEY_ID: string;
  R2_SECRET_ACCESS_KEY: string;
  PRIVACY_NOTICE_VERSION: string;
  BREVO_API_KEY: string;
  MAIL_FROM: string;
  // Optional: sendSecretariatNotification skips (and logs) rather than
  // throwing when this isn't set.
  SECRETARIAT_EMAIL?: string;
  ADMIN_USER: string;
  ADMIN_PASSWORD: string;
  SESSION_SECRET: string;
};

// Shared with the admin routes/middleware, which also need to read/write the
// authenticated actor's identity via Hono's context Variables.
export type AppEnv = { Bindings: Env; Variables: { actor: string } };

const app = new Hono<{ Bindings: Env }>();

// client/public/_headers only covers static asset responses (it's read by
// Cloudflare's asset-serving layer) — it never touches these /api/* routes,
// which the Worker answers directly. Without this, every response here,
// including /api/admin/* ones carrying PII, would ship with none of the
// security headers the rest of the site has. CSP is skipped here since these
// are JSON responses, not documents that execute script or load styles.
app.use("/api/*", async (c, next) => {
  await next();
  c.header("X-Content-Type-Options", "nosniff");
  c.header("Referrer-Policy", "strict-origin-when-cross-origin");
  c.header("Cache-Control", "no-store");
});

app.get("/api/health", async (c) => {
  await c.env.DB.prepare("SELECT 1").first();
  return c.json({ ok: true });
});

// Matches the real Annex A template's stated limit ("under 100 MB") — this
// was 10MB before the template was supplied, which would have silently
// rejected legitimate proposals the template itself says are acceptable.
// Comfortably within R2's 10GB free tier even at full size for every
// expected submission (~30-50 teams).
const MAX_FILE_SIZE = 100 * 1024 * 1024;

// Request the upload target before submitting form metadata: browser gets a
// presigned URL, PUTs the file straight to R2, then submits metadata with the
// resulting objectKey. An abandoned submission leaves an orphaned file
// (harmless — the abort-multipart lifecycle rule and future retention purge
// clean it up) rather than a DB row that looks like a real submission with no
// proposal attached. It also keeps the 100MB file off the Worker's request
// body entirely.
//
// Extension/content-type here are a cheap first filter, not the real check —
// magic-byte validation happens once the file actually exists in R2, at
// POST /hackathon-submissions time (§5 security must-fix: never trust the
// client, and extension alone is spoofable).
app.post("/api/uploads/presign", async (c) => {
  const ip = c.req.header("CF-Connecting-IP") ?? "unknown";
  const allowed = await checkRateLimit(c.env.DB, {
    scope: "presign",
    key: ip,
    limit: 20,
    windowMs: 60_000,
  });
  if (!allowed) {
    return c.json({ error: "Too many upload requests. Try again in a minute." }, 429);
  }

  const body = await c.req.json().catch(() => null);
  if (
    !body ||
    typeof body.fileName !== "string" ||
    typeof body.contentType !== "string" ||
    typeof body.fileSize !== "number"
  ) {
    return c.json({ error: "fileName, contentType, and fileSize are required." }, 400);
  }

  if (body.contentType !== "application/pdf" || !body.fileName.toLowerCase().endsWith(".pdf")) {
    return c.json({ error: "Only PDF files are accepted." }, 400);
  }
  if (!(body.fileSize > 0) || body.fileSize > MAX_FILE_SIZE) {
    return c.json({ error: "File must be under 100MB." }, 400);
  }

  const objectKey = `hackathon-submissions/${crypto.randomUUID()}.pdf`;
  const uploadUrl = await presignUpload(c.env, { objectKey, contentType: body.contentType });
  return c.json({ objectKey, uploadUrl });
});

app.route("/api/hackathon-submissions", hackathonSubmissionsRoute);
app.route("/api/admin", adminRoute);

// Everything that isn't an API route falls through to static assets.
// The ASSETS binding applies wrangler.toml's `not_found_handling =
// "single-page-application"` itself, so unmatched paths like /hackathon
// resolve to index.html instead of a 404.
app.get("*", (c) => c.env.ASSETS.fetch(c.req.raw));

export default app;
