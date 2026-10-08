import desktop640 from "../assets/hero/program-hero-desktop-640.webp";
import desktop1024 from "../assets/hero/program-hero-desktop-1024.webp";
import desktop1600 from "../assets/hero/program-hero-desktop-1600.webp";
import desktop2400 from "../assets/hero/program-hero-desktop-2400.webp";
import desktop3200 from "../assets/hero/program-hero-desktop-3200.webp";
import mobile540 from "../assets/hero/program-hero-mobile-540.webp";
import mobile810 from "../assets/hero/program-hero-mobile-810.webp";
import mobile1080 from "../assets/hero/program-hero-mobile-1080.webp";
import HeroPoster, { type PosterImages } from "./HeroPoster";

// The portrait master is 1151x1440 (4:5), so its largest export is 1080px
// wide — still sharp on 3x phones.
const IMAGES: PosterImages = {
  desktopSrc: desktop1600,
  desktopSrcSet: `${desktop640} 640w, ${desktop1024} 1024w, ${desktop1600} 1600w, ${desktop2400} 2400w, ${desktop3200} 3200w`,
  mobileSrcSet: `${mobile540} 540w, ${mobile810} 810w, ${mobile1080} 1080w`,
  mobileSize: { width: 1151, height: 1440 },
};

/** The IEC-produced GATES Program cover artwork (About page hero). */
export default function ProgramPoster({ priority = false }: { priority?: boolean }) {
  return (
    <HeroPoster
      images={IMAGES}
      priority={priority}
      alt="GATES Program — Geospatial Analytics and Technology Solutions, Department of Science and Technology. Charting a future-ready nation with spatial intelligence."
    />
  );
}
