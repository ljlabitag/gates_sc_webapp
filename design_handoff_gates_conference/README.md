# Handoff: GATES Stakeholder Conference Website

## Overview
A public website for the **GATES Program 2nd Stakeholder Conference** (October 16, 2026). It serves as an information hub for conference events and handles two functional flows: **attendee registration** and **hackathon proposal submission**. Audience is mixed internal + external stakeholders. Tone: energetic, tech-forward.

The GATES (Geospatial Analytics and Technology Solutions) Program harmonizes geospatial information, tools, and applications into one integrated, interoperable platform — maximizing data, technology, and people investments through co-creation and collaboration.

## About the Design Files
The files in this bundle are **design references authored in HTML** (a streaming component format). They are prototypes showing the intended look and behavior — **not production code to copy directly**. Your task is to **recreate these designs in a production codebase** using its established patterns and libraries. If no codebase exists yet, use **Next.js (App Router) + TypeScript + Tailwind CSS** with a real backend for the two form flows.

Ignore the `.dc.html` wrapper mechanics (custom `<x-dc>`, `<dc-import>`, `renderVals()`); read them only to extract layout, styles, copy, and behavior. All styling in the prototypes is inline — the exact values are listed below under Design Tokens.

## Fidelity
**High-fidelity.** Final brand colors, typography, spacing, and interactions are set. Recreate the UI closely, substituting placeholder imagery with real assets (conference photos, official GATES/DOST logos).

## Screens / Views

Shared across all pages: a **sticky glass top nav** and a **centered glass footer**.

### Nav (`GATES-Nav.dc.html`)
- Sticky, `z-index: 50`, `padding: 14px 32px`, `background: rgba(8,9,11,.55)`, `backdrop-filter: blur(20px) saturate(180%)`, bottom border `1px solid rgba(255,255,255,.08)`.
- Left: "GATES" wordmark (700, 19px). Center: pill links Home / Program / Conference / Hackathon — active link has `background: rgba(255,255,255,.1)` + border `rgba(255,255,255,.16)`, inactive is transparent with `color: rgba(255,255,255,.62)`. Right: "Register" pill button, `background: #1a1aea`, text `#08090b`.

### Footer (all pages)
- Top border `1px solid rgba(255,255,255,.08)`, centered column: "GATES" (700, 18px), row of links (Home/Program/Conference/Hackathon/Register, `rgba(255,255,255,.6)`), and `© 2026 GATES Program · contact@gates-program.org` (`rgba(255,255,255,.35)`, 12px).

### 1. Home (`GATES-Home.dc.html`)
- **Purpose**: Landing hub; drives registration and hackathon submission.
- **Hero**: full-bleed, `padding: 96px 32px 88px`, centered content max-width 760px. Contains 3 blurred "orbs" (blue `#1a1aea` top-left, plum `#984077` bottom-right, orange `#fd9404` center, `filter: blur(110–130px)`, opacity .28–.6, gentle float keyframes) and a **perspective grid floor** at the bottom (48% height, `background-image` two blue-tinted 1px line gradients at `rgba(111,116,255,.28)` on a 44px grid, `transform: perspective(420px) rotateX(58deg)` origin bottom, masked with `linear-gradient(to top, rgba(0,0,0,.85), transparent)`).
  - Eyebrow (mono, 12px, `.55`): "STAKEHOLDER CONFERENCE · OCT 16, 2026"
  - H1 "GATES Stakeholder Conference" — Barlow Condensed 800, uppercase, `clamp(44px,7vw,80px)`, glow `text-shadow: 0 0 26px rgba(152,64,119,.5), 0 0 50px rgba(26,26,234,.45)`.
  - Subtitle: "A day of keynotes, exhibits, and the GATES Hackathon — bringing together the geospatial data community to co-create what's next." (18px, `.65`)
  - **Live countdown** to `2026-10-16 09:00`: four glass boxes (DAYS / HRS / MIN / SEC), mono values 26px, updates every second.
  - CTA row: primary "Register Now" (gradient button → /registration), secondary "Submit Hackathon Entry" (glass button → /hackathon).
- **Events at a Glance — bento grid** (`grid-template-columns: repeat(4,1fr)`, gap 16px): Keynotes (span 2, blue dot), Exhibit (span 1, orange dot), Awarding (span 1, plum dot), Hackathon (span 4 full-width feature card, teal dot, with "See pre-event activities →" link). Each card: glass panel, 34px rounded icon dot in the accent color, 19px/600 title, 14px `.6` body.
- **About the Program** split grid (`1fr 1fr`, gap 48px): left text block (eyebrow, H2 "The GATES Program", mission paragraph, "Learn about the Program →" link); right a decorative glass panel containing an 8-column grid of small squares (`rgba(255,255,255,.06)`, four highlighted `#1a1aea`).
- **2025 Conference Recap**: 3 photo placeholders (`aspect-ratio: 4/3`, diagonal striped fill, mono label), "View the full recap →" link.

### 2. Program (`GATES-Program.dc.html`)
- **Purpose**: Explain the GATES Program.
- Hero: eyebrow "THE PROGRAM", H1 "The GATES Program", subtitle (first sentence of mission).
- Body paragraph (full mission statement): "…maximizes resources — data, technology, and people — and adds value to these investments by creating an environment for co-creation and collaboration: an environment where data is shared, multi-sectoral use cases and applications are developed, capacities are strengthened, and efforts are sustained."
- **Pillars** grid (3 cols): Data (blue), Technology (orange), People (plum) — glass cards with icon dot, title, short body.
- **How it works** grid (2×2): Co-creation & collaboration / Shared data environment / Capacity strengthening / Sustained efforts.
- CTA section: H2 "See it in action at the 2026 Conference" + primary button → /conference.

### 3. Conference (`GATES-Conference.dc.html`)
- **Purpose**: Agenda + venue + previous-event recap.
- Hero: eyebrow "OCT 16, 2026 · VENUE TBD", H1 "2026 GATES Stakeholder Conference", primary "Register Now" button.
- **Agenda vertical timeline**: 4 rows connected by a 2px left rule with plum dots (`#984077`, 18px, 3px `#08090b` border). Items: Morning — Keynotes; Midday — Exhibit; Afternoon — Hackathon Finals; Late afternoon — Awarding. Each row is a glass card (mono time label, 18px title, 14px `.6` desc).
- **Venue** glass card: "Location to be announced" placeholder.
- **2025 Recap**: 4-col photo placeholder gallery + blurb + external link "View 2025 recap on Facebook →" (`https://www.facebook.com/share/p/1D6LxisvYK/`, target=_blank).

### 4. Registration (`GATES-Registration.dc.html`)
- **Purpose**: Collect attendee registrations.
- Hero: eyebrow "OCT 16, 2026", H1 "Register to Attend", subtitle.
- Split grid (`1.5fr 1fr`): **form glass card** + **sticky info card** (Date: Oct 16, 2026; Venue: TBD; Includes: Keynotes · exhibit access · awarding ceremony).
- **Form fields**: Name (text), Email (email), Organization / Role (text), Dietary / accessibility needs (textarea, optional).
- Inputs: `padding: 12px 14px`, `border-radius: 10px`, border `rgba(255,255,255,.16)`, `background: rgba(255,255,255,.05)`, white text.
- **Validation**: name required, email required + regex `^[^@\s]+@[^@\s]+\.[^@\s]+$`. On error show `Please enter your name and a valid email.` in red (`oklch(72% 0.19 25)` ≈ `#e5484d`).
- **Success state** replaces the form with a glass confirmation card: "You're registered, {name}!" + "A confirmation has been saved for {email}…" + "Back to Home →".

### 5. Hackathon (`GATES-Hackathon.dc.html`)
- **Purpose**: Pre-event info + proposal submission.
- Hero: eyebrow "HACKATHON", H1 "Build with GATES", subtitle "Pre-event activities lead into finals and awarding on Oct 16, 2026."
- **Pre-event activities timeline** (plum dots): Orientation webinar / Mentoring sessions / Proposal submission deadline.
- **Submit your entry**: "↓ Download Proposal Template" glass button (wire to a real template file), then a **submission form**: Team name (required), Project title (required), Track / category (optional), Upload completed proposal template (`<input type=file accept=".pdf,.doc,.docx">`).
- Primary button gradient here is **orange→plum** `linear-gradient(135deg,#fd9404,#984077)`.
- **Validation**: team + title required; error `Please enter a team name and project title.`
- **Success state**: "Entry received, {team}!" + "\"{title}\" has been submitted…" + "Back to Home →".

## Interactions & Behavior
- **Navigation**: standard page routing between the 5 pages; nav highlights the active page.
- **Countdown**: `setInterval` 1s, computes diff to `new Date(2026,9,16,9,0,0)`, zero-padded, cleared on unmount.
- **Forms**: controlled inputs; submit → validate → persist → swap to success card. Currently prototypes persist to `localStorage` (`gates_registrations`, `gates_hackathon_submissions`) — **replace with a real backend** (see below).
- **Orbs**: `@keyframes orbFloat` / `orbFloat2` — translate + scale, 16–20s, ease-in-out, infinite.
- **Hover/focus**: add subtle brightness/border-lift on buttons and cards; give inputs a visible focus ring in brand blue.
- **Responsive**: multi-column grids (bento, split, pillars, 4-col gallery) should collapse to 1–2 columns on tablet/mobile; nav links should wrap or become a menu.

## State Management
- **Countdown**: `{d,h,m,s}` timer state on Home.
- **Registration form**: `{name,email,org,needs}`, `submitted`, `error`.
- **Hackathon form**: `{team,title,track,fileName}` (+ actual `File`), `submitted`, `error`.
- **Data**: POST endpoints for registration and hackathon submission; file upload to storage; return success/validation errors.

## Backend Requirements (must build — prototypes are client-only)
1. **Registration API** — persist Name, Email, Organization/Role, Dietary/accessibility needs + timestamp (Postgres/Supabase or equivalent). Server-side validation. Confirmation email.
2. **Hackathon submission API** — persist Team, Project title, Track, + **file upload** (proposal .pdf/.doc/.docx) to object storage; store file URL + metadata. Confirmation email.
3. **Proposal template** — host the real template file and wire the download button.
4. **Admin** — simple authenticated list/export (CSV) of registrations and submissions.

## Design Tokens
**Colors**
- Blue `#1a1aea` (primary) · Teal `#118E8E` · Orange `#fd9404` · Plum `#984077`
- Background `#08090b` · Text `rgba(255,255,255,.94)` / `.62` / `.40`
- Link (on dark) `#6f74ff` · Error `#e5484d`
- Glass fill `rgba(255,255,255,.055)` (stronger `.07–.09`) · Glass border `rgba(255,255,255,.12)` · Divider `rgba(255,255,255,.08)`

**Gradients** — Primary `linear-gradient(135deg,#1a1aea,#984077)` · Hackathon `linear-gradient(135deg,#fd9404,#984077)`

**Typography**
- Display/H1–H2: **Barlow Condensed** 800, uppercase, letter-spacing ~.01em, glow text-shadow.
- Body/UI: `system-ui, -apple-system, "Helvetica Neue", Arial, sans-serif`.
- Labels/eyebrows/countdown: `ui-monospace, SFMono-Regular, Menlo, monospace`, 10–12px, letter-spacing .06–.12em.
- Sizes: H1 `clamp(44px,7vw,80px)` (home) / `clamp(36px,5.5vw,60px)` (subpages); H2 `clamp(24px,3vw,34px)`; body 14–18px.

**Radius** — buttons/pills `999px`; cards/panels `20px`; inputs `10px`; icon dots `10px`.
**Effects** — `backdrop-filter: blur(20px) saturate(160%)`; button glow `0 4px 20px rgba(152,64,119,.45)`; H1 glow `0 0 26px rgba(152,64,119,.5), 0 0 50px rgba(26,26,234,.45)`.
**Spacing** — section padding ~72px vertical / 32px horizontal; content max-widths 900–1120px; grid gaps 14–48px.

## Assets
All imagery in the prototypes is **placeholder** (diagonal-striped boxes with mono labels): 2025 recap photos, exhibit/keynote/awarding shots. Replace with:
- Real 2025 conference photos.
- Official **GATES Program** logo (4-point star mark) and **DOST (Department of Science and Technology)** logo — see the brand poster the client provided. Use official brand files, not recreations.
- Real proposal template document for the download button.
Fonts: Barlow Condensed via Google Fonts (or self-hosted). No icon library is required (icon dots are plain colored rounded squares); introduce one if the codebase already uses it.

## Files
- `GATES-Home.dc.html` — Home / hub
- `GATES-Program.dc.html` — Program
- `GATES-Conference.dc.html` — Conference + 2025 recap
- `GATES-Registration.dc.html` — Registration form
- `GATES-Hackathon.dc.html` — Hackathon + submission form
- `GATES-Nav.dc.html` — shared nav component
- `GATES Wireframes.dc.html` — early low-fi wireframes (layout intent only)
