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
