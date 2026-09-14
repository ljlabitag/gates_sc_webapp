import { S3Client, PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import type { Env } from "../index";

// Plain S3 API rather than the native R2 binding: presigning is inherently an
// S3-protocol signing operation the native binding doesn't expose, and this
// adapter also talks to the in-network MinIO replica later (Phase 2) — same
// code, different env vars, per the operationalization plan.
const UPLOAD_PRESIGN_TTL_SECONDS = 15 * 60;
// Admin downloads are short-TTL by design (brief §6): a link that stays live
// for 15 minutes in a shared inbox is a bearer token, not an access control.
const DOWNLOAD_PRESIGN_TTL_SECONDS = 5 * 60;

function getS3Client(env: Env) {
  return new S3Client({
    region: "auto",
    endpoint: env.R2_ENDPOINT,
    credentials: {
      accessKeyId: env.R2_ACCESS_KEY_ID,
      secretAccessKey: env.R2_SECRET_ACCESS_KEY,
    },
  });
}

export async function presignUpload(env: Env, params: { objectKey: string; contentType: string }) {
  const client = getS3Client(env);
  const command = new PutObjectCommand({
    Bucket: env.R2_BUCKET_NAME,
    Key: params.objectKey,
    ContentType: params.contentType,
  });
  return getSignedUrl(client, command, { expiresIn: UPLOAD_PRESIGN_TTL_SECONDS });
}

export async function presignDownload(env: Env, params: { objectKey: string; fileName?: string | null }) {
  const client = getS3Client(env);
  const command = new GetObjectCommand({
    Bucket: env.R2_BUCKET_NAME,
    Key: params.objectKey,
    ...(params.fileName
      ? { ResponseContentDisposition: `attachment; filename="${params.fileName}"` }
      : {}),
  });
  return getSignedUrl(client, command, { expiresIn: DOWNLOAD_PRESIGN_TTL_SECONDS });
}

// MinIO's own S3-compatible endpoint. A separate client (not getS3Client
// above) since this is a different service with its own credentials — R2
// stays the primary store either way, this is purely an extra backup copy.
// forcePathStyle is the practical difference from R2: R2's client relies on
// virtual-hosted-style addressing (bucket as a subdomain of R2_ENDPOINT),
// but infra-s3-api.gates-staging.work has no per-bucket subdomain, so the
// bucket has to go in the path instead — the standard MinIO deployment
// shape. Verify this against the real instance once credentials exist; if
// path-style turns out to be wrong, this is the flag to flip.
function getMinioClient(env: Env) {
  return new S3Client({
    region: "auto",
    endpoint: env.MINIO_ENDPOINT,
    forcePathStyle: true,
    credentials: {
      accessKeyId: env.MINIO_ACCESS_KEY_ID!,
      secretAccessKey: env.MINIO_SECRET_ACCESS_KEY!,
    },
  });
}

// Best-effort backup copy to MinIO, called from the same fire-and-forget
// path as the email attachment (see hackathonSubmissions.ts) — never awaited
// by the request handler, and a failure here must never surface to the
// participant or block their submission. Skips (and logs) rather than
// throwing when the access key hasn't been created yet, same pattern as
// SECRETARIAT_EMAIL being unset.
//
// Lands directly under MINIO_KEY_PREFIX using the participant's own
// filename — no "hackathon-submissions/"-style subfolder and no R2 UUID, by
// request. Trade-off worth knowing: unlike the UUID-based R2 key, this has
// no built-in uniqueness — two teams submitting the same filename (or one
// team resubmitting under the same name) will silently overwrite each other
// in MinIO. R2 and D1 stay the real, collision-safe source of truth either
// way; this is purely a convenience backup layer.
export async function backupToMinio(
  env: Env,
  params: { fileName: string; contentType: string; body: ArrayBuffer },
): Promise<void> {
  if (!env.MINIO_ACCESS_KEY_ID || !env.MINIO_SECRET_ACCESS_KEY) {
    console.log("[minio] access key not set — skipping backup");
    return;
  }
  const client = getMinioClient(env);
  const key = `${env.MINIO_KEY_PREFIX}${params.fileName}`;
  await client.send(
    new PutObjectCommand({
      Bucket: env.MINIO_BUCKET_NAME,
      Key: key,
      Body: new Uint8Array(params.body),
      ContentType: params.contentType,
    }),
  );
  console.log(`[minio] backed up ${params.fileName} to ${env.MINIO_BUCKET_NAME}/${key}`);
}
