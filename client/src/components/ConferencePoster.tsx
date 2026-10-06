import poster640 from "../assets/hero/sc-hero-640.webp";
import poster1024 from "../assets/hero/sc-hero-1024.webp";
import poster1600 from "../assets/hero/sc-hero-1600.webp";
import { CONFERENCE } from "../data/conference";

/**
 * The IEC-produced conference hero artwork. The title, theme, date and venue
 * are baked into the image, so it must always scale as a whole — never
 * cropped (no object-fit: cover) — and the real text lives in `alt` and in
 * each page's own sr-only <h1> instead.
 *
 * The master is 1600x900, so it is capped at that width (see
 * .conference-poster in index.css): stretching it further would only blur it.
 * Dropping a larger master (e.g. 3200x1800) into assets/hero and adding it to
 * the srcSet below is all it takes to sharpen it on high-density screens.
 */
export default function ConferencePoster({ priority = false }: { priority?: boolean }) {
  return (
    <img
      src={poster1600}
      srcSet={`${poster640} 640w, ${poster1024} 1024w, ${poster1600} 1600w`}
      sizes="(min-width: 1600px) 1600px, 100vw"
      width={1600}
      height={900}
      alt={`${CONFERENCE.edition} — ${CONFERENCE.theme}. ${CONFERENCE.dateLabel}, ${CONFERENCE.venueLabel}.`}
      // Only the poster that's visible on first paint should jump the queue;
      // anything else (e.g. a hidden carousel slide) can wait.
      loading={priority ? "eager" : "lazy"}
      fetchPriority={priority ? "high" : "auto"}
      decoding="async"
      className="conference-poster block w-full h-auto mx-auto"
    />
  );
}
