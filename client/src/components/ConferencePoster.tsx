import desktop640 from "../assets/hero/conference-hero-desktop-640.webp";
import desktop1024 from "../assets/hero/conference-hero-desktop-1024.webp";
import desktop1600 from "../assets/hero/conference-hero-desktop-1600.webp";
import desktop2400 from "../assets/hero/conference-hero-desktop-2400.webp";
import desktop3200 from "../assets/hero/conference-hero-desktop-3200.webp";
import mobile540 from "../assets/hero/conference-hero-mobile-540.webp";
import mobile810 from "../assets/hero/conference-hero-mobile-810.webp";
import mobile1080 from "../assets/hero/conference-hero-mobile-1080.webp";
import mobile1620 from "../assets/hero/conference-hero-mobile-1620.webp";
import { CONFERENCE } from "../data/conference";

/**
 * The IEC-produced conference hero artwork. The title, theme, date and venue
 * are baked into the image, so it must always scale as a whole — never
 * cropped (no object-fit: cover) — and the real text lives in `alt` and in
 * each page's own sr-only <h1> instead.
 *
 * IEC supplied two designs: a 16:9 landscape one and a 4:5 portrait one
 * reflowed for phones, so the baked-in text stays readable on small screens.
 * Phones (under 768px) get the portrait; everything wider gets the landscape.
 * Each is exported at several widths so a phone never downloads the desktop
 * file. The originals (10000px / 5062px wide, 11-15MB) are kept out of the
 * repo — see .gitignore; to update the artwork, re-export from them.
 *
 * Keep the `md` breakpoints below in step with the <source> media query and
 * with .conference-poster in index.css: all three mean "768px".
 */
export default function ConferencePoster({ priority = false }: { priority?: boolean }) {
  return (
    <picture>
      <source
        media="(max-width: 767px)"
        srcSet={`${mobile540} 540w, ${mobile810} 810w, ${mobile1080} 1080w, ${mobile1620} 1620w`}
        sizes="100vw"
        width={1620}
        height={2025}
      />
      <img
        src={desktop1600}
        srcSet={`${desktop640} 640w, ${desktop1024} 1024w, ${desktop1600} 1600w, ${desktop2400} 2400w, ${desktop3200} 3200w`}
        sizes="(min-width: 1600px) 1600px, 100vw"
        width={3200}
        height={1800}
        alt={`${CONFERENCE.edition} — ${CONFERENCE.theme}. ${CONFERENCE.dateLabel}, ${CONFERENCE.venueLabel}.`}
        // Only the poster that's visible on first paint should jump the queue;
        // anything else (e.g. a hidden carousel slide) can wait.
        loading={priority ? "eager" : "lazy"}
        fetchPriority={priority ? "high" : "auto"}
        decoding="async"
        // Reserve the right shape for whichever image will load, so the page
        // doesn't jump when it arrives.
        className="conference-poster block w-full h-auto mx-auto aspect-[4/5] md:aspect-[16/9]"
      />
    </picture>
  );
}
