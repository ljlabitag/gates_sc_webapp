// Fixed-window rate limiter backed by D1. Cloudflare's native Workers Rate
// Limiting binding (the `ratelimits` config in wrangler.toml) turned out not
// to enforce anything in testing — 30 rapid requests against a limit of 20
// all returned success:true, with no error or plan-gating message to explain
// why. Rather than ship a security control that silently doesn't work, this
// reimplements it directly against D1, which has already proven reliable.
//
// bucketKey is `${scope}:${key}:${windowStart}`, unique per caller per
// window, so the INSERT ... ON CONFLICT below is an atomic increment even
// under concurrent requests — no read-then-write race.
export async function checkRateLimit(
  db: D1Database,
  opts: { scope: string; key: string; limit: number; windowMs: number },
): Promise<boolean> {
  const windowStart = Math.floor(Date.now() / opts.windowMs) * opts.windowMs;
  const bucketKey = `${opts.scope}:${opts.key}:${windowStart}`;

  const result = await db
    .prepare(
      `INSERT INTO rate_limit_hits (bucket_key, window_start, count)
       VALUES (?, ?, 1)
       ON CONFLICT(bucket_key) DO UPDATE SET count = count + 1
       RETURNING count`,
    )
    .bind(bucketKey, windowStart)
    .first<{ count: number }>();

  // Opportunistic cleanup of expired windows — cheap at this traffic volume
  // (a few hundred requests total per the ops plan), so a dedicated purge
  // job isn't worth it. Never blocks the actual rate-limit decision above.
  db.prepare(`DELETE FROM rate_limit_hits WHERE window_start < ?`)
    .bind(windowStart - opts.windowMs)
    .run()
    .catch(() => {});

  return (result?.count ?? 0) <= opts.limit;
}
