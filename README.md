# GATES Stakeholder Conference Website

Public information hub + registration/hackathon portal for the GATES Program 2nd Stakeholder
Conference (Oct 16, 2026). Recreated from the design references in
[`design_handoff_gates_conference/`](design_handoff_gates_conference/) as a production app.

- **`client/`** — Vite + React + TypeScript + Tailwind CSS (v4) + React Router
- **`server/`** — Express + TypeScript + Prisma, against a local PostgreSQL database

The visual design is not final — see [`ASSETS.md`](ASSETS.md) for exactly which files to drop
in (logos, event photos, proposal template) once they're ready, and where.

## Prerequisites
- Node.js 20+
- A local PostgreSQL server running (e.g. via Homebrew: `brew services start postgresql@14`)

## Setup
```bash
createdb gates_conference          # create the local database once

cp server/.env.example server/.env # then edit DATABASE_URL / ADMIN_USER / ADMIN_PASSWORD as needed

npm install                        # installs client + server workspaces
npm run db:migrate                 # applies the Prisma schema
npm run dev                        # runs client (http://localhost:5173) + server (http://localhost:4000)
```

The Vite dev server proxies `/api/*` requests to the Express server, so the client always calls
same-origin `/api/...` paths in code.

## Admin view
Visit `/admin` on the running client (e.g. http://localhost:5173/admin). It's protected by HTTP
Basic Auth — the browser will prompt for the `ADMIN_USER` / `ADMIN_PASSWORD` set in
`server/.env`. From there you can view registrations and hackathon submissions and export each
as CSV.

## Email confirmations
Registration and hackathon-submission confirmation emails are stubbed: with no `SMTP_HOST` set
in `server/.env`, they're logged to the server console instead of sent. Fill in the `SMTP_*`
variables to send real emails — no code changes needed (see `server/src/lib/mailer.ts`).

## Deploying a review preview — GitHub Pages

A static build of `client/` only, published by
[`.github/workflows/deploy-pages.yml`](.github/workflows/deploy-pages.yml) on every push to
`main`. No server, no database; the two forms deliberately don't submit.

**The URL is public.** There is no private or password-protected GitHub Pages on Free, Pro or
Team — only Enterprise Cloud. Search engines are asked to stay away via the robots meta tag,
but anyone with the link can view it.

### Steps
1. **Fix the git repo first** — a sandbox left a stale lock. Nothing is committed yet, so:
   ```bash
   cd sc2026_webapp
   rm -rf .git && git init
   ```
2. **Commit and push** to a new GitHub repo (public or private — Pages works from either):
   ```bash
   git add -A
   git commit -m "GATES conference site"
   git branch -M main
   git remote add origin https://github.com/<you>/<repo>.git
   git push -u origin main
   ```
3. **Turn on Pages**: repo → **Settings → Pages → Build and deployment → Source: GitHub
   Actions**. That's the only click needed; the workflow does the rest.
4. **Watch the Actions tab.** First run takes ~1 minute. The URL appears on the workflow's
   `deploy` job and under Settings → Pages, as
   `https://<you>.github.io/<repo>/`.

Pushing to `main` redeploys. You can also trigger it manually from Actions → *Deploy preview to
GitHub Pages* → **Run workflow**.

### Two things that make this work
- **Sub-path.** Project sites live at `/<repo>/`, not the domain root. The workflow passes
  `--base=/<repo>/` (derived from the repo name) and `App.tsx` reads it back via
  `import.meta.env.BASE_URL` as the router `basename`. Without both, every asset and route
  404s.
- **Deep links.** GitHub Pages has no rewrite rules, so `/<repo>/program` would 404 on refresh
  or when someone opens a shared link. [`public/404.html`](client/public/404.html) encodes the
  path into a query string and `index.html` decodes it before the app mounts.

### Before this goes public for real
Remove the robots meta tag in `client/index.html` and the `VITE_PREVIEW` variable in the
workflow — and settle the open content items: the hackathon name is still the placeholder from
the mechanics, the theme is unconfirmed, the venue is TBA, and
`client/public/templates/gates-proposal-template.pdf` is a dummy file.

## Alternative: Cloudflare Pages (if you later want it protected)

The review deployment is a **static build of `client/` only** — no server, no database. The
pages, content and animations are all reviewable; the two forms deliberately don't submit.

Recommended host: **Cloudflare Pages + Cloudflare Access**, because Access gives free
password protection for up to 50 users. Netlify's equivalent needs Pro (~$19/user/mo) and
Vercel's is a paid add-on.

### 1. Push to a git remote
```bash
git add -A
git commit -m "GATES conference site"
git remote add origin <your-repo-url>
git push -u origin main
```

### 2. Create the Pages project
In the Cloudflare dashboard: **Workers & Pages → Create → Pages → Connect to Git**, then set

| Setting | Value |
|---|---|
| Build command | `npm install && npm run build` |
| Build output directory | `client/dist` |
| Root directory | `client` |
| Environment variable | `VITE_PREVIEW` = `true` |

`VITE_PREVIEW=true` is what shows the "preview build" banner and stops the forms from
attempting a POST that would fail. **Omit it for any deployment that has the API behind it.**

### 3. Lock it down
On the Pages project: **Settings → General → Access Policy → Enable**, then add a policy
allowing either specific emails or `Emails ending in @dost.gov.ph`. Reviewers get a one-time
PIN by email.

Search engines are already excluded by `<meta name="robots">` in `client/index.html` and the
`X-Robots-Tag` header in `client/public/_headers`.

### Before this goes public
Remove the robots meta tag, `client/public/_headers`, and the `VITE_PREVIEW` variable — and
settle the open content items: the hackathon name is still the placeholder from the mechanics,
the conference theme is unconfirmed, the venue is TBA, and
`client/public/templates/gates-proposal-template.pdf` is still a dummy file.

### Deploying the full app later
The full stack needs a Node host plus PostgreSQL (Render and Railway both work). Three things
are not wired up yet:
- `server/src/index.ts` serves only `/api/*`. It would need to serve `client/dist` **and** add
  a catch-all route returning `index.html`, or React Router paths will 404 on refresh.
- `CLIENT_ORIGIN` must be set to the deployed client origin for CORS (moot if one service
  serves both).
- Uploads write to local disk, which is ephemeral on most platform tiers — that needs a
  persistent volume or object storage before real submissions are accepted.

## Notes
- The hackathon submission form mirrors Annex A of the GATES Hackathon 2026 mechanics (team
  leader contact, all four members, agency, endorsing head, and the priority innovation
  domain). **If you are pulling these changes into an existing database, run
  `npm run db:migrate` before `npm run dev`** — the schema gained the Annex A columns and
  dropped the unused `track` column, so Prisma will prompt about that drop if the column holds
  any data.
- Uploaded hackathon proposal files are stored on local disk under `server/uploads/hackathon/`
  (gitignored) and are only downloadable through the authenticated admin API.
