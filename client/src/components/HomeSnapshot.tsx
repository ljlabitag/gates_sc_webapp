import { ConferenceActions, ConferenceDescription, type CountdownItem } from "./ConferenceHeroInfo";
import { Eyebrow, TextLink } from "./ui";

// The Home page's section under the hero, in two parts:
//  - EventSnapshot: what the conference is, how to act on it, and the
//    countdown as the focal point.
//  - KeyDatesTimeline: the next dates as a vertical timeline.
// Both are presentational; Home owns the data and the countdown ticking.

/* Tailwind scans for literal class names, so these can't be built by interpolation. */
const accentByColor = {
  blue: "bg-gates-blue",
  teal: "bg-gates-teal",
  orange: "bg-gates-orange",
  plum: "bg-gates-plum",
} as const;

const BRAND_GRADIENT = "bg-[linear-gradient(110deg,#1a1aea_0%,#984077_34%,#118e8e_67%,#fd9404_100%)]";

export interface KeyDateEntry {
  color: keyof typeof accentByColor;
  /** The moment the entry is anchored to — drives the calendar block. */
  when: Date;
  /** Full date label, e.g. "November 9, 2026". */
  date: string;
  detail: string;
  title: string;
  to: string;
  linkLabel: string;
}

/**
 * The countdown card is md+ only. On phones the hero carousel keeps the
 * countdown and buttons inside the poster slide (see ConferenceHeroSlide in
 * pages/Home.tsx), so this panel is just the description there.
 */
export function EventSnapshot({
  countdownItems,
  dateLine,
}: {
  countdownItems: CountdownItem[];
  /** e.g. "November 10, 2026 · 8:00 AM onwards" */
  dateLine: string;
}) {
  return (
    <div className="relative overflow-hidden rounded-[28px] border border-white/12 bg-white/[0.035] p-6 sm:p-8 lg:p-10 grid gap-8 lg:gap-12 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] items-center shadow-[0_24px_70px_rgba(0,0,0,0.28)]">
      <span aria-hidden="true" className={`absolute inset-x-0 top-0 h-1 ${BRAND_GRADIENT}`} />
      <div
        aria-hidden="true"
        className="absolute -top-24 -right-24 w-[420px] h-[420px] rounded-full opacity-60 pointer-events-none bg-[radial-gradient(circle,rgba(26,26,234,0.22),transparent_65%)]"
      />

      <div className="relative flex flex-col gap-5 items-start text-left">
        <Eyebrow>ABOUT THE CONFERENCE</Eyebrow>
        <ConferenceDescription className="max-w-[560px] text-white/78" />
        <div className="hidden md:block pt-1">
          <ConferenceActions detailsHref="/conference#programme" />
        </div>
      </div>

      <div
        role="group"
        aria-label="Countdown to the conference"
        className="relative hidden md:flex flex-col gap-5 rounded-2xl border border-white/14 bg-black/35 p-6 lg:p-7"
      >
        <div className="text-center font-heading text-[11px] font-semibold uppercase tracking-[0.16em] text-white/55">
          Conference starts in
        </div>
        <div className="grid grid-cols-4 divide-x divide-white/10">
          {countdownItems.map((item) => (
            <div key={item.label} className="px-1 text-center">
              <div className="font-mono tabular-nums text-[clamp(30px,3.4vw,46px)] font-semibold leading-none">
                {item.value}
              </div>
              <div className="mt-2.5 font-heading text-[10px] font-semibold tracking-[0.14em] text-white/45">
                {item.label}
              </div>
            </div>
          ))}
        </div>
        <div className="border-t border-white/10 pt-4 text-center font-mono text-[12px] tracking-[0.08em] text-white/60">
          {dateLine}
        </div>
      </div>
    </div>
  );
}

const manila = (when: Date, options: Intl.DateTimeFormatOptions) =>
  when.toLocaleDateString("en-US", { ...options, timeZone: "Asia/Manila" });

export function KeyDatesTimeline({ entries }: { entries: readonly KeyDateEntry[] }) {
  return (
    <ol className="list-none m-0 p-0 mx-auto max-w-[860px] flex flex-col gap-4">
      {entries.map((entry, index) => {
        const isNext = index === 0;
        const isLast = index === entries.length - 1;
        return (
          <li
            key={entry.title}
            className="relative grid grid-cols-[64px_minmax(0,1fr)] sm:grid-cols-[84px_minmax(0,1fr)] gap-4 sm:gap-5 items-stretch"
          >
            {/* Calendar block, joined to the next one by a thin rail. */}
            <div
              className={`rounded-2xl border flex flex-col items-center justify-center py-3 text-center ${
                isNext ? "border-white/28 bg-white/10" : "border-white/12 bg-white/[0.04]"
              }`}
            >
              <span className="font-heading text-[11px] font-semibold tracking-[0.16em] text-white/60">
                {manila(entry.when, { month: "short" }).toUpperCase()}
              </span>
              <span className="mt-1 font-display text-[28px] sm:text-[34px] font-extrabold leading-none">
                {manila(entry.when, { day: "numeric" })}
              </span>
            </div>
            {!isLast && <span aria-hidden="true" className="absolute left-8 sm:left-[42px] -bottom-4 h-4 w-px bg-white/18" />}

            <div
              className={`glass-panel program-card relative overflow-hidden py-5 pl-6 pr-5 sm:pl-7 sm:pr-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-6 ${
                isNext ? "home-next-date glass-panel-strong" : ""
              }`}
            >
              <span aria-hidden="true" className={`absolute inset-y-0 left-0 w-1 ${accentByColor[entry.color]}`} />
              <div className="min-w-0 flex flex-col gap-1.5">
                {isNext && (
                  <span className="self-start rounded-full border border-gates-orange/25 bg-gates-orange/10 px-2.5 py-1 font-heading text-[9px] font-semibold uppercase tracking-[0.08em] text-orange-200">
                    Next up
                  </span>
                )}
                <h3 className="text-[17px] font-semibold m-0 leading-snug">{entry.title}</h3>
                <div className="font-mono text-[12px] tracking-[0.04em] text-white/55">
                  {entry.date}
                  <span className="mx-2 text-white/25" aria-hidden="true">
                    &middot;
                  </span>
                  <span className="uppercase tracking-[0.08em] text-white/45">{entry.detail}</span>
                </div>
              </div>
              <div className="shrink-0">
                <TextLink to={entry.to}>{entry.linkLabel} &rarr;</TextLink>
              </div>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
