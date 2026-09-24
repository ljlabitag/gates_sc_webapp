import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Nav from "../components/Nav";
import Footer from "../components/Footer";
import gatesVerticalLogo from "../assets/logos/gates-lockup-vertical.webp";
import recapOpenForum from "../assets/photos/2025-open-forum.jpg";
import handLeft from "../assets/hero/hand-left.webp";
import handRight from "../assets/hero/hand-right.webp";
import keyboard from "../assets/hero/keyboard.webp";
import {
  componentIcons,
  Eyebrow,
  IconCalendar,
  IconDot,
  PageSection,
  PrimaryButton,
  SecondaryButton,
  SectionHead,
  Stat,
  TextLink,
} from "../components/ui";
import { useCountdown } from "../hooks/useCountdown";
import { usePageMeta } from "../hooks/usePageMeta";
import { AGENDA, COMPONENTS, CONFERENCE, CONFERENCE_DATE, HACKATHON_DAY_DATE, RECAP_2025 } from "../data/conference";
import { FINALISTS_ANNOUNCED_DATE, HACKATHON, SUBMISSION_DEADLINE_DATE } from "../data/hackathon";

/* Tailwind scans for literal class names, so these can't be built by interpolation. */
const accentByColor = {
  blue: "bg-gates-blue",
  teal: "bg-gates-teal",
  orange: "bg-gates-orange",
  plum: "bg-gates-plum",
} as const;

/* "11:59 PM on September 20, 2026" -> ["11:59 PM", "September 20, 2026"] — split
   from HACKATHON's own combined label rather than duplicating the date/time
   as separate literals, so KEY_DATES can't drift from the mechanics doc. */
const [hackathonDeadlineTime, hackathonDeadlineDate] = HACKATHON.submissionDeadlineLabel.split(" on ");
/* AGENDA[0] is Registration, "8:00 – 8:30 AM" — its start time is when the
   conference day actually opens. The range shares one trailing AM/PM across
   both ends (economical, not per-side), so the start time needs it borrowed
   from the end before it reads correctly on its own. */
const [agendaStart, agendaEnd] = AGENDA[0].time.split(" – ");
const endMeridiem = agendaEnd.match(/AM|PM/)?.[0];
const conferenceOpensTime = /AM|PM/.test(agendaStart) || !endMeridiem ? agendaStart : `${agendaStart} ${endMeridiem}`;

/**
 * Every date a visitor might need to act on or watch for, in chronological
 * order, each carrying the real Date it's anchored to (SUBMISSION_DEADLINE_
 * DATE etc. — see data/hackathon.ts and data/conference.ts) so Home can pick
 * out whichever ones are still ahead of "now" rather than a fixed, eventually-
 * stale trio. `date`/`detail` label text is likewise derived from HACKATHON/
 * CONFERENCE/AGENDA rather than hardcoded, so nothing here can drift from the
 * mechanics doc if the timeline moves again — it already has, more than once
 * (see hackathon.ts's own header comment).
 */
const MILESTONES = [
  {
    color: "orange",
    when: SUBMISSION_DEADLINE_DATE,
    date: hackathonDeadlineDate,
    detail: hackathonDeadlineTime,
    title: "Hackathon proposals due",
    to: "/hackathon",
    linkLabel: "Read the mechanics",
  },
  {
    color: "plum",
    when: FINALISTS_ANNOUNCED_DATE,
    date: HACKATHON.finalistsAnnouncedLabel,
    detail: `${HACKATHON.maxFinalistTeams} finalist teams`,
    title: "Hackathon finalists announced",
    to: "/hackathon",
    linkLabel: "Read the mechanics",
  },
  {
    color: "teal",
    when: HACKATHON_DAY_DATE,
    date: CONFERENCE.hackathonDayLabel.replace(/^\w+, /, ""),
    detail: "Finalists only",
    title: "Hackathon final coaching and technical judging",
    to: "/hackathon",
    linkLabel: "See the timeline",
  },
  {
    color: "blue",
    when: CONFERENCE_DATE,
    date: CONFERENCE.conferenceProperLabel.replace(/^\w+, /, ""),
    detail: `${conferenceOpensTime} onwards`,
    title: "Stakeholder conference proper",
    to: "/conference",
    linkLabel: "See the programme",
  },
] as const;

const HERO_SLIDE_LABELS = ["Conference", "Hackathon"] as const;
const HERO_AUTOPLAY_MS = 5000;

/**
 * Conference page's own hero content, reproduced here as one carousel slide
 * (see Home's hero below) — same copy/countdown/CTAs, just re-tagged so the
 * page still has exactly one <h1> regardless of which slide starts active.
 * "View the Programme" points at the Conference page's own #programme
 * anchor instead of a same-page one, since that section doesn't exist here.
 */
function ConferenceHeroSlide({
  active,
  countdownItems,
}: {
  active: boolean;
  countdownItems: { value: string; label: string }[];
}) {
  return (
    <div
      className={`absolute inset-0 flex items-center justify-center transition-opacity duration-700 ease-in-out ${
        active ? "opacity-100" : "opacity-0 pointer-events-none"
      }`}
      aria-hidden={!active}
    >
      <div className="hero-brand-gradient absolute inset-0" aria-hidden="true" />
      <div className="conference-hero-road-bg absolute inset-0 z-0" aria-hidden="true" />
      <div className="conference-hero-grid-bg absolute inset-0 z-0" aria-hidden="true" />
      {/* w-full: this div's parent (the slide wrapper above) is itself a
          flex row centering its content, so without an explicit width this
          child would shrink-to-fit its content instead of filling out to
          max-w-1150 — collapsing the @container query context to a few px
          and, with it, the cqw-sized theme text below. */}
      <div className="relative z-10 w-full max-w-[1150px] mx-auto px-5 sm:px-8 py-10 sm:py-14 text-center flex flex-col items-center @container">
        <h2 className="conference-hero-badge inline-flex items-center m-0 px-5 py-2 sm:px-6 sm:py-2.5 rounded-full text-white font-heading font-bold text-base sm:text-xl tracking-[0.01em]">
          2<sup className="text-[0.65em] font-semibold">nd</sup>&nbsp;GATES Program Stakeholder Conference
        </h2>
        {/* Same cqw approach as Conference.tsx's own hero (see that file for
            the full reasoning) — vw-based sizing outgrew this slide's own
            column before the viewport did, same bug, same fix. */}
        <p className="font-display text-[clamp(19px,6.3cqw,60px)] font-extrabold m-0 mt-6 sm:mt-7 tracking-[0.01em] uppercase text-glow leading-[1.05] whitespace-nowrap">
          {CONFERENCE.theme}
        </p>
        <div className="mt-5 sm:mt-6 font-mono text-xs sm:text-sm leading-relaxed tracking-[0.1em] sm:tracking-[0.12em] text-white/65">
          {CONFERENCE.dateLabel} &middot; {CONFERENCE.venueLabel}
        </div>
        <p className="text-[16px] sm:text-lg leading-[1.6] text-white/70 m-0 mt-3 sm:mt-4 max-w-[640px]">
          The {CONFERENCE.edition} brings together stakeholders from DOST attached agencies and regional offices,
          national government agencies, and development partners to learn about the latest developments of the
          GATES Program and engage stakeholders in charting its next phase.
        </p>

        <div
          role="group"
          aria-label="Countdown to the conference"
          className="grid grid-cols-4 gap-2 sm:gap-3 mt-7 sm:mt-8 w-full max-w-[420px]"
        >
          {countdownItems.map((item) => (
            <div key={item.label} className="glass-panel rounded-2xl px-2 sm:px-4 py-3.5 text-center">
              <div className="font-mono tabular-nums text-[22px] sm:text-[26px] font-semibold">{item.value}</div>
              <div className="font-heading text-[9px] sm:text-[10px] text-white/50 mt-1 tracking-[0.08em]">
                {item.label}
              </div>
            </div>
          ))}
        </div>

        <div className="flex flex-col min-[420px]:flex-row gap-3 mt-5 sm:mt-6 w-full min-[420px]:w-auto">
          <PrimaryButton to="/registration">Registration Info</PrimaryButton>
          <a
            href="/conference#programme"
            className="glass-panel px-[26px] py-3.5 rounded-full text-white/90 font-semibold text-[15px] no-underline text-center"
          >
            View the Programme
          </a>
        </div>
      </div>
    </div>
  );
}

/**
 * Hackathon page's own hero content, reproduced as the carousel's second
 * slide — same copy/illustration/stats/CTAs. "Submit a Proposal" points at
 * the Hackathon page's own #submit anchor instead of a same-page one.
 */
function HackathonHeroSlide({ active }: { active: boolean }) {
  return (
    <div
      className={`absolute inset-0 flex items-center justify-center transition-opacity duration-700 ease-in-out ${
        active ? "opacity-100" : "opacity-0 pointer-events-none"
      }`}
      aria-hidden={!active}
    >
      <div className="hackathon-hero-bg absolute inset-0" aria-hidden="true" />
      <div className="road-network-bg absolute inset-0 z-0" aria-hidden="true" />
      {/* w-full for the same reason as ConferenceHeroSlide's own content div
          — the slide wrapper is a flex row, so this would otherwise shrink
          to its content instead of filling out to max-w-880. */}
      <div className="relative z-10 w-full max-w-[880px] mx-auto px-5 sm:px-8 py-10 sm:py-14 text-center flex flex-col gap-[18px] items-center">
        <Eyebrow>AUGUST 24&ndash;NOVEMBER 10, 2026 &middot; OPEN CALL TO FINALS</Eyebrow>
        <h2 className="font-display text-[clamp(30px,5vw,54px)] font-extrabold m-0 tracking-[0.01em] uppercase text-glow-orange">
          {HACKATHON.name}
        </h2>
        <p className="font-heading text-xs font-bold tracking-[0.14em] uppercase text-white/60 m-0">
          {HACKATHON.theme}
        </p>
        <p className="text-[16px] sm:text-lg leading-[1.6] text-white/70 m-0 max-w-[640px]">
          Build geospatial solutions on the GATES Lakehouse that fix real operational pain points across the DOST
          system &mdash; then pitch them at the {CONFERENCE.edition}.
        </p>

        <div className="relative w-full" aria-hidden="true">
          <div className="hackathon-hero-hand hackathon-hero-hand-left hidden lg:block absolute z-[2] pointer-events-none select-none">
            <img src={handLeft} alt="" className="block w-full h-auto" />
            <div
              className="hackathon-hero-hand-shade absolute inset-0"
              style={{ WebkitMaskImage: `url(${handLeft})`, maskImage: `url(${handLeft})` }}
            />
          </div>
          <img
            src={keyboard}
            alt=""
            className="hackathon-hero-keyboard hidden lg:block mx-auto pointer-events-none select-none"
          />
          <div className="hackathon-hero-hand hackathon-hero-hand-right hidden lg:block absolute z-[2] pointer-events-none select-none">
            <img src={handRight} alt="" className="block w-full h-auto" />
            <div
              className="hackathon-hero-hand-shade absolute inset-0"
              style={{ WebkitMaskImage: `url(${handRight})`, maskImage: `url(${handRight})` }}
            />
          </div>
        </div>

        <div className="hackathon-hero-facts relative z-[3] grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 mt-1 w-full max-w-[680px]">
          {[
            {
              value: HACKATHON.callForParticipantsLabel.replace("August", "Aug").replace(", 2026", ""),
              label: "Call opens",
            },
            { value: HACKATHON.submissionDeadlineShort.replace("September", "Sep"), label: "Proposals due · 11:59 PM" },
            { value: `${HACKATHON.maxFinalistTeams}`, label: "Finalist teams" },
            { value: `${HACKATHON.teamSize}`, label: "Members per team" },
          ].map((fact) => (
            <div key={fact.label} className="hackathon-hero-fact glass-panel px-3 sm:px-4 py-4 text-center">
              <div className="font-heading text-[19px] sm:text-[22px] font-bold leading-none text-white/92">
                {fact.value}
              </div>
              <div className="text-[10px] sm:text-[11px] leading-[1.35] text-white/52 mt-2">{fact.label}</div>
            </div>
          ))}
        </div>

        <div className="relative z-[3] flex flex-col min-[420px]:flex-row gap-3 mt-1 w-full min-[420px]:w-auto">
          <a
            href="/hackathon#submit"
            className="btn-hackathon px-[26px] py-3.5 rounded-full text-white font-bold text-[15px] no-underline text-center"
          >
            Submit a Proposal
          </a>
          <PrimaryButton to="/conference">See the Conference</PrimaryButton>
        </div>
      </div>
    </div>
  );
}

export default function Home() {
  usePageMeta(
    `${CONFERENCE.edition} — November 10, 2026`,
    "The 2nd GATES Program Stakeholder Conference, November 10, 2026 in Metro Manila. Keynotes, the Use Case Development Showcase, the Geospatial Gallery, and the first GATES GeoHack 2026.",
  );

  const { d, h, m, s } = useCountdown(CONFERENCE_DATE);
  const countdownItems = [
    { value: d, label: "DAYS" },
    { value: h, label: "HRS" },
    { value: m, label: "MIN" },
    { value: s, label: "SEC" },
  ];

  // Recomputed on every render, which — thanks to useCountdown above
  // re-rendering Home every second — is effectively "live": once a
  // milestone's own date passes, it drops off and the next one takes its
  // "Next deadline" spot without needing a page reload. Falls back to just
  // the final milestone if the whole timeline is already behind us, so the
  // section never renders empty post-event.
  const upcomingMilestones = MILESTONES.filter((m) => m.when.getTime() >= Date.now());
  const KEY_DATES = upcomingMilestones.length > 0 ? upcomingMilestones.slice(0, 3) : MILESTONES.slice(-1);

  const [activeSlide, setActiveSlide] = useState(0);
  const [paused, setPaused] = useState(false);
  const [reduceMotion, setReduceMotion] = useState(false);
  const [autoplayTick, setAutoplayTick] = useState(0);

  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setReduceMotion(query.matches);
    sync();
    query.addEventListener("change", sync);
    return () => query.removeEventListener("change", sync);
  }, []);

  useEffect(() => {
    if (paused || reduceMotion) return;
    const id = window.setInterval(() => {
      setActiveSlide((i) => (i + 1) % HERO_SLIDE_LABELS.length);
    }, HERO_AUTOPLAY_MS);
    return () => window.clearInterval(id);
    // autoplayTick restarts the timer (without changing its cadence logic)
    // whenever a manual click already moved the slide, so autoplay doesn't
    // immediately override a visitor's own choice.
  }, [paused, reduceMotion, autoplayTick]);

  const goToSlide = useCallback((index: number) => {
    setActiveSlide(index);
    setAutoplayTick((t) => t + 1);
  }, []);

  return (
    <div className="home-page min-h-screen">
      <Nav />
      <h1 className="sr-only">{CONFERENCE.edition} — November 10, 2026</h1>

      {/* Hero — carousel of the Conference and Hackathon pages' own hero
          content (see ConferenceHeroSlide/HackathonHeroSlide above), auto-
          advancing but pausable via hover/focus and navigable via the dots/
          arrows below; skips autoplay entirely under prefers-reduced-motion. */}
      <header
        className="home-hero relative overflow-hidden border-b border-white/8 flex flex-col items-center"
        role="region"
        aria-roledescription="carousel"
        aria-label="Highlights"
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
        onFocus={() => setPaused(true)}
        onBlur={() => setPaused(false)}
      >
        <div className="home-hero-slides relative w-full">
          <ConferenceHeroSlide active={activeSlide === 0} countdownItems={countdownItems} />
          <HackathonHeroSlide active={activeSlide === 1} />

          <div className="absolute inset-x-0 bottom-4 sm:bottom-6 z-20 flex items-center justify-center gap-4">
            <button
              type="button"
              aria-label="Previous slide"
              onClick={() => goToSlide((activeSlide - 1 + HERO_SLIDE_LABELS.length) % HERO_SLIDE_LABELS.length)}
              className="glass-panel w-9 h-9 rounded-full grid place-items-center text-white/70 hover:text-white transition-colors"
            >
              <span aria-hidden="true">&lsaquo;</span>
            </button>
            <div role="tablist" aria-label="Hero slides" className="flex items-center gap-2.5">
              {HERO_SLIDE_LABELS.map((label, index) => (
                <button
                  key={label}
                  type="button"
                  role="tab"
                  aria-selected={activeSlide === index}
                  aria-label={`Show ${label} highlights`}
                  onClick={() => goToSlide(index)}
                  className={`h-2 rounded-full transition-all duration-300 ${
                    activeSlide === index ? "w-6 bg-white" : "w-2 bg-white/30 hover:bg-white/50"
                  }`}
                />
              ))}
            </div>
            <button
              type="button"
              aria-label="Next slide"
              onClick={() => goToSlide((activeSlide + 1) % HERO_SLIDE_LABELS.length)}
              className="glass-panel w-9 h-9 rounded-full grid place-items-center text-white/70 hover:text-white transition-colors"
            >
              <span aria-hidden="true">&rsaquo;</span>
            </button>
          </div>
        </div>
      </header>

      {/* Key dates — the soonest deadline is the most useful thing on this page */}
      <PageSection labelledBy="dates-title" width="wide" className="mt-8 sm:mt-12">
        <SectionHead eyebrow="KEY DATES" title="What's coming up" titleId="dates-title" />
        <ol className="grid grid-cols-1 md:grid-cols-3 gap-4 list-none m-0 p-0">
          {KEY_DATES.map((entry, index) => (
            <li
              key={entry.title}
              className={`glass-panel program-card relative overflow-hidden p-6 h-full flex flex-col gap-2 ${
                index === 0 ? "home-next-date glass-panel-strong" : ""
              }`}
            >
              <span aria-hidden="true" className={`absolute inset-x-0 top-0 h-1 ${accentByColor[entry.color]}`} />
              {index === 0 && (
                <span className="self-start rounded-full border border-gates-orange/25 bg-gates-orange/10 px-2.5 py-1 font-heading text-[9px] font-semibold uppercase tracking-[0.08em] text-orange-200 mb-1">
                  Next deadline
                </span>
              )}
              <div className="flex flex-col min-[420px]:flex-row min-[420px]:items-baseline min-[420px]:justify-between gap-1 min-[420px]:gap-3">
                <span className="font-mono text-[13px] text-white/80">{entry.date}</span>
                <span className="font-heading text-[10px] uppercase tracking-[0.1em] text-white/42">
                  {entry.detail}
                </span>
              </div>
              <h3 className="text-[16px] font-semibold m-0 leading-snug">{entry.title}</h3>
              <div className="mt-auto pt-2">
                <TextLink to={entry.to}>{entry.linkLabel} &rarr;</TextLink>
              </div>
            </li>
          ))}
        </ol>
      </PageSection>

      {/* Events at a glance */}
      <PageSection labelledBy="glance-title" width="wide" className="mt-8 sm:mt-12">
        <SectionHead eyebrow="EVENTS AT A GLANCE" title="What's happening" titleId="glance-title" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* The programme is the main event; the three components run alongside it. */}
          <div className="glass-panel program-card glass-panel-strong p-6 sm:p-7 sm:col-span-2 lg:col-span-3">
            <div className="flex flex-wrap justify-between items-end gap-4">
              <div>
                <IconCalendar color="blue" />
                <h3 className="text-[19px] font-semibold mb-2">Keynotes and presentations</h3>
                <p className="text-sm leading-[1.55] text-white/62 m-0 max-w-[560px]">
                  DOST leadership on the Department&apos;s geospatial and AI direction, followed by Program updates,
                  the data governance rationale, and the GATES Lakehouse.
                </p>
              </div>
              <TextLink to="/conference">See the programme &rarr;</TextLink>
            </div>
          </div>

          {COMPONENTS.map((component) => {
            const Icon = componentIcons[component.title] ?? IconDot;
            return (
              <div key={component.title} className="glass-panel program-card p-6 sm:p-7 flex flex-col">
                <Icon color={component.color} />
                <h3 className="text-[19px] font-semibold mb-2">{component.title}</h3>
                <p className="text-sm leading-[1.55] text-white/62 m-0">{component.short}</p>
                {"to" in component && component.to && (
                  <div className="mt-auto pt-4">
                    <TextLink to={component.to}>{component.linkLabel} &rarr;</TextLink>
                  </div>
                )}
                {!("to" in component) && (
                  <div className="mt-auto pt-4">
                    <TextLink to="/conference#components">Explore at the conference &rarr;</TextLink>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </PageSection>

      {/* About the Program */}
      <PageSection labelledBy="program-title" width="wide" className="mt-8 sm:mt-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-12 items-center">
          <div>
            <Eyebrow>ABOUT THE PROGRAM</Eyebrow>
            <h2 id="program-title" className="text-[clamp(26px,3.2vw,38px)] font-bold my-2.5 tracking-tight">
              The GATES Program
            </h2>
            <p className="text-base leading-[1.65] text-white/65 mb-4">
              The Geospatial Analytics and Technology Solutions (GATES) Program is one of eight transformative research
              and development initiatives of the Department of Science and Technology. It unifies the geospatial data
              developed by DOST and its attached agencies into a single, integrative, interoperable platform &mdash;
              making data more accessible, usable, and impactful.
            </p>
            <p className="text-base leading-[1.65] text-white/65 mb-5">
              Four component projects carry it: mapping and cleansing DOST&apos;s data, building the Data Lakehouse,
              turning that into geospatial analytics for planning and decision-making, and institutionalising the whole
              thing so it lasts.
            </p>
            <TextLink to="/program">Explore the Program and its four component projects &rarr;</TextLink>
          </div>

          {/* The interactive, per-sail project view lives on the Program page. */}
          <Link
            to="/program"
            aria-label="Explore the GATES Program and its four component projects"
            className="home-program-mark glass-panel justify-self-center w-full max-w-[300px] aspect-[25/32] grid place-items-center no-underline p-7 sm:p-9"
          >
            <img
              src={gatesVerticalLogo}
              alt="GATES Program"
              draggable={false}
              className="w-full h-full object-contain"
            />
          </Link>
        </div>
      </PageSection>

      {/* 2025 Recap */}
      <PageSection labelledBy="recap-title" width="wide" className="mt-8 sm:mt-12">
        <SectionHead
          eyebrow="LOOKING BACK"
          title={RECAP_2025.title}
          titleId="recap-title"
          intro={`October 16, 2025 · ${RECAP_2025.formatLabel} · ${RECAP_2025.theme}`}
        />

        <div className="grid grid-cols-1 lg:grid-cols-[0.9fr_1.1fr] gap-4 items-stretch">
          <div
            className="home-recap-feature glass-panel relative overflow-hidden p-6 sm:p-9 flex flex-col justify-end min-h-[280px] sm:min-h-[300px] bg-[#08090b] bg-cover bg-center"
            style={{ backgroundImage: `url(${recapOpenForum})` }}
          >
            {/* text-shadow on the wrapper (inherited by every child below)
                rather than relying on the ::after scrim alone — the photo's
                own bright/detailed areas can still cut through a gradient at
                any single point, but a shadow keeps each glyph readable
                regardless of what's directly behind it. */}
            <div
              className="relative z-10 @container"
              style={{ textShadow: "0 2px 10px rgba(0,0,0,0.85), 0 1px 3px rgba(0,0,0,0.9)" }}
            >
              <Eyebrow>2025 CONFERENCE THEME</Eyebrow>
              {/* Sized in cqw (% of this div's own width, via @container
                  above) rather than vw or a fixed px value — "#SpatialTogether"
                  is one unbroken word, so its rendered width scales linearly
                  with font-size; 7.55cqw is that string's own width-to-font-
                  size ratio for this typeface solved for 80%, so the text
                  tracks 80% of the card's actual width continuously instead
                  of at a few checked breakpoints. break-words stays on as a
                  fallback only — it shouldn't ever need to trigger. */}
              <div className="font-display text-[7.55cqw] font-extrabold uppercase leading-[1.05] tracking-[-0.025em] text-glow mt-3 w-4/5 break-words">
                {RECAP_2025.theme}
              </div>
              <p className="text-sm leading-[1.55] text-white/78 mt-4 mb-0 max-w-[440px]">
                {RECAP_2025.title.replace(" and Midyear Assessment", "")}
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-4">
            <div className="grid grid-cols-1 min-[420px]:grid-cols-3 gap-3">
              {RECAP_2025.stats.slice(0, 3).map((stat) => (
                <Stat key={stat.label} value={stat.value} label={stat.label} />
              ))}
            </div>
            <div className="glass-panel p-6 sm:p-7 flex-1">
              <h3 className="text-[17px] font-semibold mt-0 mb-3">Sessions from the first conference</h3>
              <ul className="list-none m-0 p-0 flex flex-col gap-2.5">
                {RECAP_2025.sessions.slice(0, 3).map((session) => (
                  <li key={session} className="flex gap-2.5 text-[13px] leading-[1.5] text-white/62">
                    <span aria-hidden="true" className="shrink-0 mt-[6px] w-1.5 h-1.5 rounded-full bg-gates-teal" />
                    <span>{session}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-5">
                <TextLink to="/conference#recap">View the full recap &rarr;</TextLink>
              </div>
            </div>
          </div>
        </div>
      </PageSection>

      {/* CTA */}
      <section className="hero-brand-gradient glass-panel relative overflow-hidden max-w-[1000px] mx-5 sm:mx-8 lg:mx-auto my-10 sm:my-16 px-6 sm:px-10 py-10 sm:py-14 text-center flex flex-col gap-[18px] items-center">
        <Eyebrow>SAVE THE DATE</Eyebrow>
        <h2 className="text-[clamp(24px,3vw,34px)] font-bold m-0 tracking-tight">
          See you on {CONFERENCE.conferenceProperLabel.replace(/^\w+, /, "")}
        </h2>
        <div className="flex flex-col min-[420px]:flex-row gap-3">
          <PrimaryButton to="/registration">Registration Info</PrimaryButton>
          <SecondaryButton to="/hackathon">Hackathon Info</SecondaryButton>
        </div>
      </section>

      <Footer />
    </div>
  );
}
