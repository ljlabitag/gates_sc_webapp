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
import HeroPoster, { type PosterImages } from "./HeroPoster";

const IMAGES: PosterImages = {
  desktopSrc: desktop1600,
  desktopSrcSet: `${desktop640} 640w, ${desktop1024} 1024w, ${desktop1600} 1600w, ${desktop2400} 2400w, ${desktop3200} 3200w`,
  mobileSrcSet: `${mobile540} 540w, ${mobile810} 810w, ${mobile1080} 1080w, ${mobile1620} 1620w`,
  mobileSize: { width: 1620, height: 2025 },
};

/** The IEC-produced conference hero artwork (Conference and Home pages). */
export default function ConferencePoster({ priority = false }: { priority?: boolean }) {
  return (
    <HeroPoster
      images={IMAGES}
      priority={priority}
      alt={`${CONFERENCE.edition} — ${CONFERENCE.theme}. ${CONFERENCE.dateLabel}, ${CONFERENCE.venueLabel}.`}
    />
  );
}
