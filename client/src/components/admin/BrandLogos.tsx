import dostLogo from "../../assets/logos/dost-logo-horizontal.webp";
import gatesLogo from "../../assets/logos/gates-lockup-horizontal.webp";

/** DOST + GATES Program logos, as on the public site, for the staff pages. */
export default function BrandLogos({ className = "", compact = false }: { className?: string; compact?: boolean }) {
  return (
    <div className={`flex items-center ${compact ? "gap-3" : "gap-4 sm:gap-5"} ${className}`}>
      <img
        src={dostLogo}
        alt="Department of Science and Technology"
        className={compact ? "h-6 w-auto" : "h-7 sm:h-9 w-auto"}
      />
      <span aria-hidden="true" className={`w-px bg-white/20 ${compact ? "h-7" : "h-8 sm:h-10"}`} />
      <img src={gatesLogo} alt="GATES Program" className={compact ? "h-8 w-auto" : "h-9 sm:h-12 w-auto"} />
    </div>
  );
}
