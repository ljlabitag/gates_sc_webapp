# GATES Stakeholder Conference Website

Public information hub + hackathon submission portal for the GATES Program 2nd Stakeholder
Conference. Runs entirely on Cloudflare: static assets, API, database, and object storage in one
Worker, one deployment.

- **`client/`** — Vite + React + TypeScript + Tailwind CSS (v4) + React Router
- **`worker/`** — Hono API on Cloudflare Workers, Drizzle ORM against D1 (SQLite), R2 for
  proposal file storage

The visual design is not final — see [`ASSETS.md`](ASSETS.md) for exactly which files to drop
in (logos, event photos, proposal template) once they're ready, and where.

## Prerequisites
- Node.js 20+
- A Cloudflare account, authenticated locally via `npx wrangler login`
- The `DB` (D1) and `BUCKET` (R2) resources referenced in [`wrangler.toml`](wrangler.toml)
  already created — see that file's comments for the `wrangler d1 create` / `wrangler r2 bucket
  create` commands

## Setup
```bash
npm install                 # installs client + worker workspaces

npm run dev                 # runs the Worker (wrangler dev, :8787) + client (Vite, :5173)
```
Visit `http://localhost:5173`. Vite proxies `/api/*` to the Worker (see
[`client/vite.config.ts`](client/vite.config.ts)), so the client always calls same-origin
`/api/...` paths in code, matching production.

### Database migrations
Schema lives in [`worker/src/db/schema.ts`](worker/src/db/schema.ts). After changing it:
```bash
npm run db:generate -w worker        # generates a migration file under drizzle/migrations
npm run db:migrate:local -w worker   # applies it to your local D1 simulation
npm run db:migrate:remote -w worker  # applies it to the real, deployed D1 database
```

### Secrets
Set via `wrangler secret put <NAME>` (run from the repo root), never committed:
`R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `BREVO_API_KEY`, `SECRETARIAT_EMAIL`, `ADMIN_USER`,
`ADMIN_PASSWORD`, `SESSION_SECRET`. Non-secret config (endpoints, the privacy notice version,
the mail-from address) lives directly in `wrangler.toml` under `[vars]`.

## Admin view
Visit `/admin`. It's protected by a signed, httpOnly session cookie — log in with the
`ADMIN_USER` / `ADMIN_PASSWORD` secrets above. From there you can view registrations and
hackathon submissions, export each as CSV, and download proposal files via short-TTL signed R2
links. Every view, export, and download is written to the `audit_log` table (an RA 10173
access-logging requirement).

## Email
Participant confirmations and the secretariat notification (on every hackathon submission) send
through the Brevo HTTP API — see [`worker/src/lib/mailer.ts`](worker/src/lib/mailer.ts). Sends
are logged; a failure is logged and alerted on but never blocks a submission response.

## Branching and environments
`main` is production; day-to-day work happens on `dev` (or short-lived feature branches off it),
merged into `main` via PR only after being verified on staging. Staging is a fully separate
Cloudflare Worker/D1/R2 — not a copy of production's data — configured under `[env.staging]` in
`wrangler.toml`.

## Deploying
```bash
npm run worker:deploy            # production: builds the client, deploys the Worker
npm run worker:deploy:staging    # staging: same, but to the separate staging environment
```
Cloudflare Workers static assets serve `client/dist` directly, and `wrangler.toml`'s
`not_found_handling = "single-page-application"` handles React Router deep links (`/program`,
`/hackathon`, etc.) without needing a separate rewrite rule. Staging's URL is
https://gates-sc-webapp-staging.dost-gates.workers.dev — check it works there before merging
`dev` into `main`.

Staging needs its own secrets (`wrangler secret put <NAME> --env staging`, same names as
production above) — they are not shared with production and haven't been set yet, so
presign/submission/admin flows will error on staging until that's done. D1 migrations go through
`npm run db:migrate:staging -w worker` (mirrors `db:migrate:remote` but targets the staging DB).

## Notes
- The hackathon submission form mirrors Annex A of the GATES GeoHack 2026 mechanics (team
  leader contact, all four members, agency, and the priority innovation domain). The endorsing
  head's name is intentionally **not** collected on the public form — see the implementation
  brief §6 on data minimization — it's collected later, at finalist confirmation.
- Uploaded hackathon proposal files go straight from the browser to R2 via a presigned URL (see
  `POST /api/uploads/presign`); they never pass through the Worker's own request body. Only
  downloadable through the authenticated admin API, via short-TTL signed URLs — never a
  permanent link.
