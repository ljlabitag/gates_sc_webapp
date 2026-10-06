/**
 * A full-bleed hero poster from IEC, shared by the pages that use one
 * (Conference, Home, About). The title and tagline are baked into the artwork,
 * so it must always scale as a whole — never cropped (no object-fit: cover) —
 * and the real text lives in `alt` and in each page's own sr-only <h1>.
 *
 * IEC supplies two designs per poster: a 16:9 landscape one and a 4:5 portrait
 * one reflowed for phones, so baked-in text stays readable on small screens.
 * Phones (under 768px) get the portrait; everything wider gets the landscape.
 * Each is exported at several widths so a phone never downloads the desktop
 * file. The oversized originals are kept out of the repo (see .gitignore); to
 * update artwork, re-export from them.
 *
 * Keep the `md` breakpoints below in step with the <source> media query and
 * with .hero-poster in index.css: all three mean "768px".
 */
export interface PosterImages {
  /** Fallback landscape image (a mid-size export). */
  desktopSrc: string;
  /** Landscape exports as "url 640w, url 1024w, …". */
  desktopSrcSet: string;
  /** Portrait exports for phones, same format. */
  mobileSrcSet: string;
  /** Intrinsic size of the portrait exports' source, for layout before load. */
  mobileSize?: { width: number; height: number };
}

export default function HeroPoster({
  images,
  alt,
  priority = false,
}: {
  images: PosterImages;
  alt: string;
  priority?: boolean;
}) {
  const mobile = images.mobileSize ?? { width: 1620, height: 2025 };
  return (
    <picture>
      <source
        media="(max-width: 767px)"
        srcSet={images.mobileSrcSet}
        sizes="100vw"
        width={mobile.width}
        height={mobile.height}
      />
      <img
        src={images.desktopSrc}
        srcSet={images.desktopSrcSet}
        sizes="(min-width: 1600px) 1600px, 100vw"
        width={3200}
        height={1800}
        alt={alt}
        // Only the poster that's visible on first paint should jump the queue;
        // anything else (e.g. a hidden carousel slide) can wait.
        loading={priority ? "eager" : "lazy"}
        fetchPriority={priority ? "high" : "auto"}
        decoding="async"
        // Reserve the right shape for whichever image will load, so the page
        // doesn't jump when it arrives.
        className="hero-poster block w-full h-auto mx-auto aspect-[4/5] md:aspect-[16/9]"
      />
    </picture>
  );
}
