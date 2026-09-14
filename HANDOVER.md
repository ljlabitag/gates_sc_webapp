# Handover — GATES SC Webapp

Written 2026-08-19, end of the session that did the full Cloudflare rewrite; updated through
2026-09-07. Read this before doing anything else in this repo — it'll save re-deriving context
that's already settled.

## Git history and branching

The entire Express→Cloudflare rewrite plus every content update through 2026-09-07 is now
committed to `main` as a sequence of logical commits (backend replacement, worker foundation,
each API feature, client wiring, security/performance pass, content updates, the early-access
gate, this doc) — `git log --oneline` on `main` tells the real story, don't assume it's still
one undifferentiated blob of uncommitted changes.

A `dev` branch exists off `main` for ongoing work, with its own Cloudflare environment (see
**Environments** below) so future changes get tested on a separate URL/database/bucket before
touching the live site. `main` is production: only merge into it once a change has been verified
on staging.

## What this project is

Public site + hackathon submission portal for the GATES Program 2nd Stakeholder Conference.
Was Express + Prisma + Postgres; is now **entirely Cloudflare**: Workers (Hono) + D1 (Drizzle) +
R2, one Worker serving both the static SPA and the API. `server/` (the old Express app) has been
deleted — everything it did now lives in `worker/`.

Two documents this whole build was driven by, in the parent folder (`../`, i.e.
`GATES SC Website/`, one level up from this repo):
- `GATES-implementation-brief.md` — the spec. §0 lists what was blocked pending human decisions;
  everything there except venue and cash-prize amounts is now resolved (see below).
- `GATES-operationalization-plan.md` — the reasoning behind the architecture choices (why
  Cloudflare, why Hono/Drizzle over Express/Prisma, the Phase 1/Phase 2 COARE migration plan).

Both are historical context now — the actual implementation (this repo) is ahead of what they
describe in places (e.g. the content dates below supersede the brief's placeholders).

## Live deployment

- **URL**: https://gates-sc-webapp.dost-gates.workers.dev (health-checked working as of writing)
- **Cloudflare account**: `ljlabitagdev@gmail.com`, account ID `c5f38af076958ae8289a040392373bec`
- **D1 database**: `gates-sc-webapp`, ID `61092e00-c9b5-4b62-8683-efd19e4d9c1f`
- **R2 bucket**: `gates-sc-webapp`
- The account has a **payment card on file**. Workers/D1 are hard-capped on the free tier (no
  overage billing risk); **R2 is genuinely metered and could bill** — see the cost-safeguard
  memory files (below) before provisioning anything new.
- `wrangler login` is already authenticated on this machine.

## Environments — production vs. staging

Added 2026-09-07. Staging is a **fully separate** Worker/D1/R2, not a copy of production data —
configured under `[env.staging]` in `wrangler.toml`, deployed with
`npm run worker:deploy:staging`.

- **Staging URL**: https://gates-sc-webapp-staging.dost-gates.workers.dev (health-checked working)
- **Staging D1**: `gates-sc-webapp-staging`, ID `fc2f89c8-f7f1-441d-bb8a-ed91bc537587` — migrations
  applied (`npm run db:migrate:staging -w worker`)
- **Staging R2**: `gates-sc-webapp-staging` — same `abort-multipart-days: 1` lifecycle safeguard
  as production, applied directly with `wrangler r2 bucket lifecycle add`
- **Staging secrets: all set**, including `MINIO_ACCESS_KEY_ID`/`MINIO_SECRET_ACCESS_KEY` (see
  **Proposal file backups** below) — confirmed via `wrangler secret list --env staging`.
  **Production is missing the two MinIO secrets** as of this writing; everything else was already
  set from the original Cloudflare setup. The MinIO backup silently no-ops (logs, doesn't throw)
  until they're added, so this isn't blocking, but the backup won't actually run in production
  until `wrangler secret put MINIO_ACCESS_KEY_ID` / `MINIO_SECRET_ACCESS_KEY` (no `--env` flag)
  are run.
- Workflow going forward: branch off `dev` → `npm run worker:deploy:staging` to verify on the
  staging URL → merge to `main` via PR → `npm run worker:deploy` for production. `main` should
  only ever contain what's actually live.

### Deploy / dev commands
```
npm run dev              # worker (wrangler dev, :8787) + client (Vite, :5173) concurrently
npm run worker:deploy    # builds client, deploys the Worker (static assets + API)
npm run db:generate -w worker        # after changing worker/src/db/schema.ts
npm run db:migrate:local -w worker
npm run db:migrate:remote -w worker  # applies to the REAL deployed D1 — no undo but Time Travel
```

### Secrets already set (names only — values were never typed into this conversation)
`R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `BREVO_API_KEY`, `SECRETARIAT_EMAIL`, `ADMIN_USER`,
`ADMIN_PASSWORD`, `SESSION_SECRET`, `MINIO_ACCESS_KEY_ID`, `MINIO_SECRET_ACCESS_KEY` (staging
only — see above). All via `wrangler secret put <NAME>` — the user ran these themselves in their
own terminal each time, by design, so secret values never passed through the chat. Keep doing it
that way for any new secret.

## Proposal file backups — R2, email attachment, MinIO

Added 2026-09-14. A submitted proposal now lands in up to three places, only one of which is the
real source of truth:

1. **R2** (`worker/src/routes/hackathonSubmissions.ts`, `objectKey` column) — the actual store.
   Collision-safe (UUID-based key), referenced by every admin download link. If you need to trust
   exactly one copy, this is it.
2. **Email attachment** on the secretariat notification (`worker/src/lib/mailer.ts`,
   `sendSecretariatNotification`) — only when the file is ≤3MB (`ATTACHMENT_MAX_BYTES` in
   `hackathonSubmissions.ts`). Brevo hard-caps attachments at 4MB/file, 20MB/email total
   (confirmed against Brevo's own docs, not assumed) — 3MB leaves headroom for base64's ~33%
   size inflation. Above that threshold, the email just sends without an attachment, same as
   before this existed — never blocks or fails the submission.
3. **MinIO** (`worker/src/storage/s3.ts`, `backupToMinio`) — a publicly reachable instance on
   P4's shared internal infrastructure (`https://infra-s3-api.gates-staging.work`, bucket
   `p4-internal`), gets the **full file regardless of size** (no Brevo-style cap). Lands directly
   under `MINIO_KEY_PREFIX` using the participant's own filename — `GATES GeoHack 2026/` in
   production, `GATES GeoHack 2026/staging/` in staging (so test backups don't mix with real
   ones in that shared bucket) — **by explicit request, not a placeholder**: no subfolder, no
   UUID. Trade-off that was raised and accepted: this has no built-in uniqueness, so two teams
   submitting the same filename (or one resubmitting under the same name) will silently overwrite
   each other in MinIO. R2 and D1 remain the collision-safe source of truth regardless — this is
   purely a convenience backup layer, not the record of what was actually submitted.
   `forcePathStyle: true` was a guess about this MinIO deployment's addressing style, confirmed
   correct by an actual test write (not assumed) — worth re-checking only if PUTs to MinIO start
   failing after some future MinIO-side change.

All three attempts (confirmation email, secretariat email, MinIO backup) are independent
fire-and-forget tasks wrapped in `waitUntil` — a failure in any one is logged and never blocks
the submission response or affects the other two.

## What's built — brief's "Order of work" (§11), all 12 items done

1. Worker skeleton (Hono + static assets, `_redirects`/`not_found_handling` for SPA deep links)
2. D1 + R2 bindings proven end to end
3. Drizzle schema + migrations — `registrations`, `hackathon_submissions`, `audit_log`,
   `rate_limit_hits` (see below) tables
4. `POST /uploads/presign` — S3-compatible adapter (`@aws-sdk/client-s3` + presigner), works
   against R2 now, MinIO later per the ops plan, just an env var swap
5. `POST /hackathon-submissions` — validation, consent, magic-byte PDF check (not just
   extension), try/catch around the DB write (the old Express bug this was meant to fix: a DB
   error used to hang the browser with no response)
6. Brevo email (confirmation + secretariat notification) — **interim sender**, see below
7. Admin auth — signed httpOnly cookie session (not the old sessionStorage Basic-auth), fails
   closed when unset (the old bug: unset `ADMIN_USER`/`PASSWORD` defaulted to `""` and matched
   a blank `Authorization: Basic` header), constant-time credential compare, CSV export,
   short-TTL signed R2 download links, full audit logging
8. `/privacy` page + three real consent checkboxes on the hackathon form (processing consent
   required, member/endorsing-head attestation required, documentation consent optional —
   deliberately not forced, since coerced consent isn't legally valid consent)
9. Registration page replaced with a static "by invitation" notice (voucher/registration module
   is explicitly out of scope until after the proposal deadline — see brief §13)
10. Security headers + CSP — `_headers` for static assets, **plus a separate Worker middleware
    for `/api/*`** since `_headers` doesn't cover Worker-generated responses at all (a real gap
    that would've left every `/api/admin/*` PII response with zero security headers)
11. Performance pass — code-split `/admin`, self-hosted fonts (found Barlow Condensed was loaded
    but never actually used anywhere — dropped it instead of self-hosting dead weight), WebP
    images, OG/Twitter tags, robots.txt + sitemap.xml, deleted all GitHub-Pages-era dead code
12. Content dates — see below, this has been updated **twice** as newer mechanics documents
    arrived; check for a v2.1+ before trusting anything date-related without re-verifying

## Bugs found by testing, not by inspection — worth knowing the pattern held

- **Cloudflare's native Workers `[[ratelimits]]` binding does not work.** Verified directly: 30
  rapid requests against a configured limit of 20 all returned `success: true`, no error. Rate
  limiting on `/uploads/presign`, `/hackathon-submissions`, and admin login is now a hand-rolled
  D1-backed implementation (`worker/src/lib/rateLimit.ts`) — confirmed actually enforcing via the
  same kind of burst test. If you're ever tempted to "simplify" this back to the native binding,
  re-test it first; it may still be broken.
- **Fire-and-forget email sends need `executionCtx.waitUntil()`.** Without it, Cloudflare can
  (and did, in testing) kill the in-flight `fetch()` to Brevo the instant the response returns —
  "don't await" alone isn't enough on Workers. Both email calls in
  `worker/src/routes/hackathonSubmissions.ts` are wrapped in `waitUntil`.
- **R2 buckets need an explicit CORS policy for the direct-to-R2 upload to work at all**, and this
  was missed for months of this project's life — a real participant hit it on 2026-09-14, one day
  before the deadline (screenshot showed "Failed to fetch" right at the Submit step, after
  filling the whole form). Root cause: the browser's PUT to the presigned R2 URL is cross-origin
  (site origin → `*.r2.cloudflarestorage.com`), and with no CORS rule configured, the browser's
  preflight `OPTIONS` request gets no `Access-Control-Allow-*` headers back and silently blocks
  the actual PUT — `fetch()` throws with no useful detail, R2 itself never even logs a rejected
  request, so nothing about it is visible from the Worker or `wrangler tail`. Fixed by applying
  `worker/r2-cors.json` to both the production and staging buckets via
  `wrangler r2 bucket cors set <bucket> --file worker/r2-cors.json`. **This config lives outside
  `wrangler.toml`** (R2 CORS isn't a `wrangler.toml`-managed setting) — if either bucket is ever
  recreated, or a new environment/bucket is added, this must be reapplied by hand; nothing
  automatically keeps it in sync. Verified the fix with a raw `OPTIONS` preflight (`curl -X
  OPTIONS` with `Origin`/`Access-Control-Request-Method` headers) before trusting it, not just a
  same-origin curl PUT — a plain `curl PUT` without an `Origin` header would have looked fine even
  with CORS still broken, since curl doesn't enforce CORS the way a browser does.

General lesson from all of these: this session's default has been to **verify claims against the
live system**, not trust that config/code "should" work. Keep doing that — it's caught real,
otherwise-invisible production failures every time.

## Content status — hackathon name, dates, template

Per brief §0, these were blocked pending confirmation. All resolved now, sourced from real
documents supplied mid-session (not in this repo — they were read from the user's Downloads
folder and are not committed anywhere; if a newer version shows up, re-extract and re-apply
rather than assuming these are final):

- **Name**: "GATES GeoHack 2026" (confirmed, was a placeholder)
- **Theme**: "Charting Spatial Futures" (was already correct)
- **Timeline** (currently in `client/src/data/hackathon.ts` / `conference.ts`) — from
  *"Official Mechanics for the GATES Program Hackathon 2026_v2.0_20260819"*:
  - Call opens Aug 27 → deadline Sep 15, 11:59 PM → screening Sep 16–21 → finalists announced
    Sep 22 → confirm by Sep 29 / locked Sep 30 → orientation (online) Oct 7 → development
    Oct 8–Nov 8 → check-ins Oct 20 & Nov 3 → technical judging **Nov 9 (Mon)** → conference,
    final pitch, awarding **Nov 10 (Tue)**
  - This is the **second** timeline revision this session (the first, from a v0.2 doc, put
    everything in Aug–Oct with Sun/Mon judging+conference; v2.0 pushed a month later and
    landed on a clean Mon/Tue pair instead — genuinely better, not just different)
- **Proposal template**: the real Annex A doc is live at
  `client/public/templates/GATESGeoHack2026_Proposal_Template.docx` (kept as `.docx`, not
  converted to PDF — teams fill it in and export their own PDF for submission), now on **v3.0**
  (supplied 2026-08-27, superseding v2). Reading v2 caught real bugs, not just stale copy: page
  limit was 5, should be **8**; problem-statement word limit was 300, should be **400**; solution
  word limit was 500, should be **700**; and critically, **the Worker was hard-capping uploads at
  10MB while the template says 100MB** — legitimate proposals with real diagrams would have been
  silently rejected. All fixed in `client/src/data/hackathon.ts` (`proposalMaxPages`,
  `proposalMaxSizeMB`, `proposalFilenamePattern`) and `worker/src/index.ts` (`MAX_FILE_SIZE`). v3
  kept the same limits and filename pattern as v2 — it only added a step-by-step submission
  walkthrough, an eligibility self-check, and a scoring table — so the swap to v3 was a straight
  file overwrite with no code changes.
- **Call-for-participants date**: slipped from August 24 to **August 27, 2026** (confirmed
  verbally 2026-08-26, ahead of any revised mechanics doc). The submission window's start moved
  with it; the September 15 deadline and everything after did not.
- **Eligibility wording**: reworded to be explicitly inclusive of non-technical DOST staff —
  "Technical staff of DOST attached agencies" → "DOST attached agencies staff" (and the same
  pattern for regional offices / PSTOs). Was an explicit correction; don't reintroduce "Technical".
- **Objective copy**: now says solutions may "address operational challenges and pain points or
  explore an uncharted territory" (no quotes around "territory" — quotes were tried once and
  explicitly removed). The four sub-objectives were also replaced wholesale per the mechanics —
  don't assume the old "surface real pain points" phrasing is still accurate.
- **Prizes**: cash amounts confirmed 2026-09-14 via the official "Map. Innovate. Win." prize
  announcement graphic (DOST GATES social channels) — 1st ₱30,000, 2nd ₱20,000, 3rd ₱10,000, each
  plus a trophy, medals, and certificates for every team member. `PRIZE_TIERS` in
  `client/src/data/hackathon.ts` holds the structured amounts; `PRIZES` now holds just the
  "remaining finalist teams get a certificate + consolation prize" line. Rendered on the
  Hackathon page as three colored tier cards (blue/orange/teal, matching the graphic and the
  site's existing accent palette) instead of the old plain bullet list — the previous "specific
  amounts will be announced closer to the finals" footnote is gone, since it's no longer true.
- **Still open**: venue (still "Metro Manila — venue to be announced" everywhere).

## Early-access gate — most of the site is temporarily unreachable

As of 2026-08-27, `client/src/App.tsx` routes everything except `/hackathon`, `/privacy`, and
`/admin` through a catch-all `<Navigate to="/hackathon" replace />` — Home, Program, Conference,
and Registration are **not deleted**, just unrouted, because those pages aren't final yet and the
brief wanted early access limited to the hackathon call while the rest is still being reviewed.
Nav links and the Register button still render (they point at the old paths) but resolve to
`/hackathon` the instant they're clicked, by design. **Revert by restoring their `<Route>` entries
in `App.tsx`** once those pages are approved to go live — don't "fix" this by editing Nav.tsx,
the gate is intentionally at the router level so it covers direct URLs and bookmarks too.

## Domain situation

- `workers.dev` subdomain was renamed from the account-default `ljlabitagdev` to `dost-gates`
  (an account-wide dashboard change the user made, not something scriptable via wrangler) — the
  live URL is `gates-sc-webapp.dost-gates.workers.dev`. No further action needed there.
- **No custom domain yet.** The real target is a `dost.gov.ph` subdomain, but `dost.gov.ph`'s
  DNS is managed solely by DOST IT — the user has no self-service access (confirmed directly,
  don't assume otherwise). Same blocker as the email domain below.
- **Email**: `MAIL_FROM` is currently the interim `ljlabitag.dostgates@gmail.com`, verified in
  Brevo as a single sender. The real target `dostgates@notify.dost.gov.ph` is blocked on DOST IT
  adding DNS records — the exact record list (with a deliberately-corrected DMARC entry scoped
  to `_dmarc.notify` rather than the root, so it can't collide with DOST's live
  `_dmarc.dost.gov.ph` policy) was given to the user to send to IT. When those records land:
  update `MAIL_FROM` in `wrangler.toml` to the real address — nothing else needs to change.
- If/when a custom domain does get set up, there's a full checklist of every place the current
  domain is hardcoded (OG tags in `index.html`, `sitemap.xml`, `robots.txt`'s `Sitemap:` line,
  README) — grep for `dost-gates.workers.dev` and update every hit, then redeploy. Already done
  once this session (when the subdomain was renamed), so the pattern is proven.

## Not done / explicitly out of scope

- Registration/voucher module (brief §13 — deferred until after the proposal deadline)
- Phase 2 COARE migration (ops plan — a September+ item, not started)
- Cloudflare Web Analytics, UptimeRobot — both need the user's own dashboard/account action,
  not something scriptable from here
- CPU-time instrumentation baseline (brief §12 acceptance checklist) — not measured yet

## Persistent memory

Two auto-memory files exist from this session (load automatically in future sessions, no action
needed): a standing instruction to always build in spend safeguards when provisioning billable
cloud resources, and the specifics of this account's Cloudflare billing exposure (R2 is the real
risk; Workers/D1 are hard-capped, not billed).

## Testing pattern used throughout

For any change touching the submission flow, the standard regression test is: presign → PUT a
real small PDF (`%PDF-1.4` header is enough to pass the magic-byte check) → submit metadata →
confirm `201` → clean up the test row/object via `wrangler d1 execute ... DELETE` and
`wrangler r2 object delete`. Used dozens of times through 2026-09-06 against the **real**
production Worker and D1/R2 (not local dev), since there was no separate staging environment yet
— every one of those was a live-data test, always cleaned up afterward. As of 2026-09-07, prefer
running this same test against staging (`gates-sc-webapp-staging`) instead, once its secrets are
set — no need to touch production data or clean up after production anymore for routine testing.
