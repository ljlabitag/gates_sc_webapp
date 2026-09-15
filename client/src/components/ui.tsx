import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import type { Project } from "../data/projects";

export function Eyebrow({ children }: { children: ReactNode }) {
  return <div className="font-mono text-[11px] sm:text-xs leading-relaxed tracking-[0.1em] sm:tracking-[0.12em] text-white/55">{children}</div>;
}

export function SectionHead({
  eyebrow,
  title,
  titleId,
  intro,
}: {
  eyebrow: ReactNode;
  title: ReactNode;
  /** Wire to the parent section's `aria-labelledby` so the region is named. */
  titleId?: string;
  intro?: ReactNode;
}) {
  return (
    <div className="text-center flex flex-col gap-2.5 items-center mb-8 sm:mb-10">
      <Eyebrow>{eyebrow}</Eyebrow>
      <h2 id={titleId} className="text-[clamp(26px,3.2vw,38px)] font-bold m-0 tracking-tight">
        {title}
      </h2>
      {intro && <p className="text-[15px] leading-[1.65] text-white/60 m-0 max-w-[680px]">{intro}</p>}
    </div>
  );
}

const dotColors = {
  blue: "bg-gates-blue",
  orange: "bg-gates-orange",
  plum: "bg-gates-plum",
  teal: "bg-gates-teal",
} as const;

export type DotColor = keyof typeof dotColors;

export function IconDot({ color }: { color: DotColor }) {
  return <div aria-hidden="true" className={`w-[34px] h-[34px] rounded-[10px] mb-[14px] ${dotColors[color]}`} />;
}

// Tailwind v4 auto-generates a CSS custom property per @theme color token
// (--color-gates-blue etc., defined in index.css) — reused directly here
// rather than duplicating the hex values, so IconPin always matches
// whatever IconDot's bg-gates-* classes resolve to.
const dotColorVars = {
  blue: "var(--color-gates-blue)",
  orange: "var(--color-gates-orange)",
  plum: "var(--color-gates-plum)",
  teal: "var(--color-gates-teal)",
} as const;

/**
 * Location-pin marker (classic map-marker teardrop) — a drop-in swap for
 * IconDot's plain colored square, same color API and same footprint
 * (mb-[14px] under it). Standard "place" glyph shape rather than a custom
 * one — deliberately not reinventing a well-recognized icon, and it fits a
 * geospatial program's branding better than a corkboard pushpin did.
 */
export function IconPin({ color }: { color: DotColor }) {
  const fill = dotColorVars[color];
  return (
    <svg width="28" height="36" viewBox="0 0 24 32" className="mb-[14px]" aria-hidden="true">
      <ellipse cx="12" cy="30" rx="5" ry="1.5" fill="black" opacity="0.2" />
      <path d="M12 0C6.48 0 2 4.48 2 10c0 7.5 10 20 10 20s10-12.5 10-20c0-5.52-4.48-10-10-10z" fill={fill} />
      <circle cx="12" cy="10" r="4" fill="white" />
    </svg>
  );
}

export function GlassCard({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`glass-panel p-6 sm:p-7 ${className}`}>{children}</div>;
}

export function PhotoPlaceholder({ label }: { label: string }) {
  return (
    <div className="photo-placeholder aspect-[4/3] rounded-2xl border border-white/12 flex items-center justify-center font-mono text-[11px] text-white/40 text-center p-1.5">
      {label}
      {/* TODO: replace with a real photo from client/src/assets/photos/ (see ASSETS.md) */}
    </div>
  );
}

export function TimelineRow({
  time,
  title,
  desc,
  dotClassName = "bg-gates-plum",
}: {
  time?: string;
  title: string;
  desc: string;
  dotClassName?: string;
}) {
  return (
    <div className="flex gap-4 sm:gap-5 pb-5 sm:pb-6 border-l-2 border-white/14 ml-[9px] pl-5 sm:pl-7 relative">
      <div
        className={`absolute -left-[11px] top-[2px] w-[18px] h-[18px] rounded-full border-[3px] border-gates-bg ${dotClassName}`}
      />
      <div className="glass-panel program-card px-5 sm:px-6 py-4 sm:py-5 flex-1">
        {time && (
          <div className="inline-flex rounded-full bg-white/7 border border-white/8 px-2.5 py-1 font-mono text-[10px] text-white/58 mb-2 tracking-[0.04em]">
            {time}
          </div>
        )}
        <div className="text-base sm:text-lg font-semibold mb-1">{title}</div>
        {desc && <div className="text-sm text-white/60 leading-relaxed">{desc}</div>}
      </div>
    </div>
  );
}

export function TextLink({ to, external, children }: { to: string; external?: boolean; children: ReactNode }) {
  const className = "text-gates-link no-underline text-sm font-semibold hover:brightness-110";
  if (external) {
    return (
      <a href={to} target="_blank" rel="noopener noreferrer" className={className}>
        {children}
      </a>
    );
  }
  return (
    <Link to={to} className={className}>
      {children}
    </Link>
  );
}

export function PrimaryButton({ to, children }: { to: string; children: ReactNode }) {
  return (
    <Link
      to={to}
      className="btn-primary px-[26px] py-3.5 rounded-full text-white font-bold text-[15px] no-underline inline-block text-center"
    >
      {children}
    </Link>
  );
}

export function SecondaryButton({ to, children }: { to: string; children: ReactNode }) {
  return (
    <Link
      to={to}
      className="glass-panel px-[26px] py-3.5 rounded-full text-white/90 font-semibold text-[15px] no-underline inline-block text-center"
    >
      {children}
    </Link>
  );
}

/* ------------------------------------------------------------------ *
 * Shared layout + content primitives
 * ------------------------------------------------------------------ */

/** Height of the sticky top Nav (py-3.5 + 40px logo + 1px border). */
export const NAV_H = 69;
/** Nav + SectionNav, used as scroll-margin so anchor targets clear both bars. */
export const STICKY_OFFSET = 69 + 45;

/** Section-level decorative background variants — see .page-section-bg-* in index.css. */
export type PageSectionBackground = "grid-mono" | "grid-color" | "horizon" | "swirl" | "road-network";

/**
 * Standard page section. `id` + `labelledBy` make it a named landmark and an
 * anchor target that isn't hidden under the two sticky bars.
 *
 * `background` opts into a full-bleed decorative texture behind the section
 * (subtle by design — content still needs to read clearly over it). Omit it
 * for the plain page background, same as before this existed; only some
 * sections on a page should carry one, alternating with plain ones, or a
 * page reads as visually noisy rather than varied.
 */
export function PageSection({
  id,
  labelledBy,
  width = "default",
  className = "",
  background,
  children,
}: {
  id?: string;
  labelledBy?: string;
  width?: "default" | "wide" | "narrow";
  className?: string;
  background?: PageSectionBackground;
  children: ReactNode;
}) {
  const maxW = width === "wide" ? "max-w-[1120px]" : width === "narrow" ? "max-w-[820px]" : "max-w-[1000px]";
  return (
    <section
      id={id}
      aria-labelledby={labelledBy}
      style={{ scrollMarginTop: `${STICKY_OFFSET}px` }}
      className={`relative ${background ? "overflow-hidden" : ""}`}
    >
      {background && (
        <div className={`page-section-bg page-section-bg-${background} absolute inset-0 z-0`} aria-hidden="true" />
      )}
      <div className={`relative z-10 py-10 sm:py-14 lg:py-16 px-5 sm:px-8 ${maxW} mx-auto ${className}`}>
        {children}
      </div>
    </section>
  );
}

/** Sticky in-page anchor bar. Horizontally scrollable on narrow screens. */
export function SectionNav({ items }: { items: { id: string; label: string }[] }) {
  return (
    <nav
      aria-label="On this page"
      style={{ top: `${NAV_H}px` }}
      className="sticky z-40 glass-nav border-b border-white/8"
    >
      <ul className="section-nav-scroll flex gap-1.5 overflow-x-auto overscroll-x-contain list-none m-0 px-5 sm:px-8 py-2 max-w-[1120px] mx-auto">
        {items.map((item) => (
          <li key={item.id} className="shrink-0">
            <a
              href={`#${item.id}`}
              className="block px-3 py-1.5 rounded-full font-mono text-[11px] uppercase tracking-[0.08em] text-white/58 no-underline border border-transparent transition-colors hover:text-white/92 hover:bg-white/8 hover:border-white/14 focus-visible:text-white/92 focus-visible:bg-white/8"
            >
              {item.label}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}

/** Small caps label used above a value inside cards. */
export function MetaLabel({ children }: { children: ReactNode }) {
  return (
    <span className="block font-mono text-[10px] uppercase tracking-[0.12em] text-white/42 mb-1">{children}</span>
  );
}

/** Single headline figure with a caption. */
export function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div className="glass-panel program-card px-5 py-4">
      <div className="font-mono text-[26px] font-semibold leading-none">{value}</div>
      <div className="text-[12px] leading-[1.4] text-white/55 mt-2">{label}</div>
    </div>
  );
}

/**
 * Compact pill with a colour cue — used for strategic goals and domains.
 * `icon` swaps the plain colour dot for a small badge image (e.g. the
 * priority-domain icons); omit it to keep the original dot-only look.
 */
export function Chip({ color, icon, children }: { color: DotColor; icon?: string; children: ReactNode }) {
  return (
    <div className="glass-panel program-card flex items-center gap-3 px-4 py-3 rounded-2xl">
      {icon ? (
        <img src={icon} alt="" aria-hidden="true" className="shrink-0 w-9 h-9 rounded-full" />
      ) : (
        <span aria-hidden="true" className={`shrink-0 w-2.5 h-2.5 rounded-full ${dotColors[color]}`} />
      )}
      <span className="text-sm leading-[1.35] text-white/78">{children}</span>
    </div>
  );
}

/** Numbered glass card — used for the six program objectives. */
export function NumberedCard({
  n,
  title,
  color = "blue",
  children,
}: {
  n: number | string;
  title: ReactNode;
  color?: DotColor;
  children: ReactNode;
}) {
  return (
    <div className="glass-panel program-card p-6 sm:p-7 h-full">
      <div className="flex items-center gap-3 mb-3">
        <span
          aria-hidden="true"
          className={`shrink-0 grid place-items-center w-[30px] h-[30px] rounded-[10px] font-mono text-[13px] font-semibold text-white ${dotColors[color]}`}
        >
          {n}
        </span>
        <h3 className="text-[17px] font-semibold m-0 leading-tight">{title}</h3>
      </div>
      <p className="text-sm leading-[1.6] text-white/62 m-0">{children}</p>
    </div>
  );
}

/** Full detail card for a GATES component project. */
export function ProjectCard({
  project,
  className = "",
  /** Expand the key-activities disclosure by default (used when the card stands alone). */
  activitiesOpen = false,
}: {
  project: Project;
  className?: string;
  activitiesOpen?: boolean;
}) {
  const { number, color, name, fullTitle, lead, objective, activities } = project;
  return (
    <article
      className={`glass-panel program-card relative overflow-hidden p-6 sm:p-8 h-full flex flex-col gap-5 ${className}`}
    >
      <span aria-hidden="true" className={`absolute inset-x-0 top-0 h-1 ${dotColors[color]}`} />
      <div className="flex items-start gap-4">
        <span
          aria-hidden="true"
          className={`shrink-0 grid place-items-center w-11 h-11 rounded-[14px] font-mono text-lg font-bold text-white ${dotColors[color]}`}
        >
          {number}
        </span>
        <div>
          <div className="font-mono text-[10px] uppercase tracking-[0.12em] text-white/45">Project {number}</div>
          <h3 className="text-[21px] font-semibold m-0 leading-tight">{name}</h3>
        </div>
      </div>

      <p className="text-[13px] leading-[1.5] text-white/55 m-0">{fullTitle}</p>

      <div className="border-t border-white/10 pt-4">
        <MetaLabel>Lead agency</MetaLabel>
        <p className="text-sm text-white/82 m-0 leading-[1.45]">{lead}</p>
      </div>

      <div>
        <MetaLabel>Objective</MetaLabel>
        <p className="text-sm leading-[1.6] text-white/65 m-0">{objective}</p>
      </div>

      <details open={activitiesOpen} className="group border-t border-white/10 pt-4 mt-auto">
        <summary className="flex items-center justify-between gap-3 cursor-pointer list-none rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30">
          <span className="font-heading text-xs font-semibold uppercase tracking-[0.08em] text-white/72">
            View {activities.length} key activities
          </span>
          <span
            aria-hidden="true"
            className="grid place-items-center w-7 h-7 rounded-full bg-white/7 text-white/60 transition-transform group-open:rotate-180"
          >
            ↓
          </span>
        </summary>
        <ul className="list-none m-0 pt-4 p-0 flex flex-col gap-2">
          {activities.map((activity) => (
            <li key={activity} className="flex gap-2.5 text-sm leading-[1.55] text-white/65">
              <span aria-hidden="true" className={`shrink-0 mt-[7px] w-1.5 h-1.5 rounded-full ${dotColors[color]}`} />
              <span>{activity}</span>
            </li>
          ))}
        </ul>
      </details>
    </article>
  );
}

/** Emphasised panel for a single standout point (e.g. the GATES Hub). */
export function Callout({
  eyebrow,
  title,
  children,
  color = "teal",
}: {
  eyebrow: ReactNode;
  title: ReactNode;
  children: ReactNode;
  color?: DotColor;
}) {
  return (
    <div className="glass-panel glass-panel-strong p-6 sm:p-9 flex flex-col gap-3">
      <div className="flex items-center gap-3">
        <span aria-hidden="true" className={`shrink-0 w-[34px] h-[34px] rounded-[10px] ${dotColors[color]}`} />
        <Eyebrow>{eyebrow}</Eyebrow>
      </div>
      <h3 className="text-[clamp(20px,2.4vw,26px)] font-bold m-0 tracking-tight">{title}</h3>
      <p className="text-[15px] leading-[1.65] text-white/68 m-0 max-w-[720px]">{children}</p>
    </div>
  );
}
