# Asset Checklist

Real GATES and DOST logos and the site icons are now in place. What's still outstanding is
event photography and the real proposal template — see **Still needed** at the end.

Where a slot is still a placeholder, dropping the real file in at the exact path/filename
listed is all that's required.

## Logos — `client/src/assets/logos/`

### Lockups — use the `-lockup-` / `-logo-` files, not the raw exports
The designer's raw exports carry large transparent margins and are 2–2.4 MB each. Because the
nav and footer render on every page, importing them directly meant **~4.2 MB of logo on every
page load**. The files actually imported are content-cropped, downscaled derivatives:

| Imported file | Size | Used in | Made from |
|---|---|---|---|
| `gates-lockup-horizontal.png` | 900×356, 154 KB | `Nav` | `Horizontal with Outline & Glow.png` (2.4 MB) |
| `gates-lockup-vertical.png` | 400×512, 120 KB | `Footer` | `Vertical Outline with Glow.png` (1.8 MB) |
| `dost-logo-vertical.png` | 375×512, 60 KB | `Footer` | `DOST Logo (Inverse).png` |
| `dost-logo-horizontal.png` | 900×144, 73 KB | *(spare)* | `DOST LOGO (HORIZONTAL) INVERSE.png` |

Cropping to content matters beyond file size: the raw GATES and DOST exports had *different*
amounts of transparent padding, so setting both to the same CSS height left them optically
mismatched. Cropped, equal height balances them correctly — both are portrait lockups of
near-identical ratio.

To regenerate after a rebrand: crop to the alpha bounding box, add a 1% margin, and scale so
the long edge is 512px (vertical lockups) or 900px (horizontal). The four raw exports can be
removed from this folder once you're happy — they belong in the design repo.

### `dost-logo.svg` — optional upgrade, PNG is in place
An SVG version of the DOST mark would scale crisply and drop the 60 KB, but the inverse PNG is
wired up and working, so this is no longer blocking.

### Site icons — generated, do not hand-edit
`favicon.ico`, `favicon-16x16.png`, `favicon-32x32.png`, `apple-touch-icon.png`,
`icon-192.png`, and `icon-512.png` in `client/public/` are all derived from the logomark by
[`client/scripts/generate-icons.py`](client/scripts/generate-icons.py). If the mark changes,
drop in the new `gates-logomark.png` and re-run `python client/scripts/generate-icons.py`.

The mark sits on the brand near-black rounded tile rather than on transparency. It's an
*outline* star, so at 16–32px there's very little ink and its pale teal and orange strokes
wash out against light browser chrome; the tile gives a consistent silhouette on both light
and dark chrome without altering the mark. At 16px it is inherently a small coloured sparkle —
if a crisper tiny icon is ever needed, that requires a purpose-drawn simplified mark from the
designer, not a different downscale.

The old `favicon.svg` (a purple lightning bolt, not a GATES asset) and `icons.svg` are no
longer referenced anywhere and can be deleted.

### `gates-logomark.png` — in use
The primary square logomark, downscaled to 1400×1400 with transparency preserved and
imported by [`ProjectShowcase`](client/src/components/ProjectShowcase.tsx) on the Program
page. The master file supplied by comms is 3346×3346 (~2.3 MB) — keep that in the design
repo, not here, and regenerate this one from it if the mark ever changes.

**An SVG version of this mark would be a real upgrade.** Because the current asset is
raster, individual sails cannot be recoloured; the showcase highlights a sail by layering a
full-brightness copy over a dimmed one, masked to a 90° `conic-gradient` wedge. With an SVG
whose four sails are separate groups, each sail could be styled directly and the hit areas
could follow the true sail outlines instead of square quadrants.

## Recap photos — `client/src/assets/photos/`
4:3 aspect ratio, ~1200×900px recommended.

The 2025 event was the GATES Stakeholder Conference and Midyear Assessment (Oct 16–17, 2025) —
keynotes and technical sessions, then a regional-office alignment meeting. **There was no
hackathon and no exhibit floor in 2025**; the 2026 event runs the *first* GATES Hackathon, and
replaces an exhibit with the Geospatial Gallery. Earlier placeholder names implied otherwise.

| File | Used in |
|---|---|
| `2025-keynote.jpg` | Home recap row, Conference recap gallery |
| `2025-plenary-session.jpg` | Home recap row, Conference recap gallery |
| `2025-mapping-shared-commitment.jpg` | Home recap row, Conference recap gallery |
| `2025-open-forum.jpg` | Conference recap gallery |

## Hero / background — `client/src/assets/hero/`
Reserved for a real background/texture image if one replaces the current CSS-only
orb + perspective-grid-floor hero treatment on the Home page. Not required — the CSS
treatment is a valid final look on its own.

## Proposal template
`client/public/templates/gates-proposal-template.pdf` — currently a real, valid but
placeholder-content PDF (clearly labeled as such inside the file). Linked directly from the
Hackathon page's "Download Proposal Template" button. Replace by overwriting the same file
with the final document (same filename, so the link keeps working).

## Not yet wired (needs a decision, not just a file)
- `client/public/templates/gates-proposal-template.pdf` must be replaced with the real Annex A
  template from the hackathon mechanics (max 5 pages, PDF, filename
  `GATESHack2026_Proposal_[TeamName].pdf`). The page already states those requirements.
- The hackathon name is still a placeholder. `data/hackathon.ts` uses "GATES Hackathon 2026";
  the mechanics shortlist "GATES GeoHack 2026" and "GATES Geo-vation Challenge 2026" with the
  final choice pending. One constant to change.

**Resolved:** the submission form now collects the team leader's email, so hackathon
confirmation emails send properly once `SMTP_*` is configured — the old limitation noted in
`server/src/lib/mailer.ts` is gone.
