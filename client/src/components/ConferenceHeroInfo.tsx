import { PrimaryButton } from "./ui";
import { CONFERENCE } from "../data/conference";

// The live text that accompanies the conference poster — a short description,
// the countdown, and the two calls to action. They used to sit inside the
// hero; now the hero is the poster alone and these form the first section
// beneath it (Conference page) or are split between a slide and a strip
// (Home — see pages/Home.tsx for why).

export interface CountdownItem {
  value: string;
  label: string;
}

export function ConferenceDescription({ className = "max-w-[700px]" }: { className?: string }) {
  return (
    <p className={`text-[17px] sm:text-lg leading-[1.6] text-white/70 m-0 ${className}`}>
      The {CONFERENCE.edition} brings together stakeholders from DOST attached agencies and regional offices, national
      government agencies, and development partners to learn about the latest developments of the GATES Program and
      engage stakeholders in charting its next phase.
    </p>
  );
}

export function ConferenceCountdown({ items, className = "" }: { items: CountdownItem[]; className?: string }) {
  return (
    <div
      role="group"
      aria-label="Countdown to the conference"
      className={`grid grid-cols-4 gap-2 sm:gap-3 w-full max-w-[420px] ${className}`}
    >
      {items.map((item) => (
        <div key={item.label} className="glass-panel rounded-2xl px-2 sm:px-4 py-3.5 text-center">
          <div className="font-mono tabular-nums text-[22px] sm:text-[26px] font-semibold">{item.value}</div>
          <div className="font-heading text-[9px] sm:text-[10px] text-white/50 mt-1 tracking-[0.08em]">
            {item.label}
          </div>
        </div>
      ))}
    </div>
  );
}

/** `detailsHref` differs by page: an on-page anchor, or a link across pages. */
export function ConferenceActions({
  detailsHref,
  detailsLabel = "Conference Details",
  className = "",
}: {
  detailsHref: string;
  /** What the second button says; pages that scroll to a specific section can name it. */
  detailsLabel?: string;
  className?: string;
}) {
  return (
    <div className={`flex flex-col min-[420px]:flex-row gap-3 w-full min-[420px]:w-auto ${className}`}>
      <PrimaryButton to="/registration">Register Now</PrimaryButton>
      <a
        href={detailsHref}
        className="glass-panel px-[26px] py-3.5 rounded-full text-white/90 font-semibold text-[15px] no-underline text-center"
      >
        {detailsLabel}
      </a>
    </div>
  );
}
