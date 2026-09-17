import { Link } from "react-router-dom";
import Nav from "../components/Nav";
import Footer from "../components/Footer";
import gatesVerticalLogo from "../assets/logos/gates-lockup-vertical.webp";
import recapKeynote from "../assets/photos/2025-keynote.jpg";
import {
  Eyebrow,
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
import { COMPONENTS, CONFERENCE, CONFERENCE_DATE, RECAP_2025 } from "../data/conference";
import { HACKATHON } from "../data/hackathon";

/* Tailwind scans for literal class names, so these can't be built by interpolation. */
const accentByColor = {
  blue: "bg-gates-blue",
  teal: "bg-gates-teal",
  orange: "bg-gates-orange",
  plum: "bg-gates-plum",
} as const;

/** The three dates a visitor actually needs to act on, soonest first. */
const KEY_DATES = [
  {
    color: "orange",
    date: "September 20, 2026",
    detail: "11:59 PM",
    title: "Hackathon proposals due",
    to: "/hackathon",
    linkLabel: "Read the mechanics",
  },
  {
    color: "teal",
    date: "November 9, 2026",
    detail: "Finalists only",
    title: "Hackathon final coaching and technical judging",
    to: "/hackathon",
    linkLabel: "See the timeline",
  },
  {
    color: "blue",
    date: "November 10, 2026",
    detail: "8:00 AM onwards",
    title: "Stakeholder conference proper",
    to: "/conference",
    linkLabel: "See the programme",
  },
] as const;

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

  return (
    <div className="home-page min-h-screen">
      <Nav />

      {/* Hero */}
      <header className="home-hero hero-brand-gradient relative overflow-hidden px-5 sm:px-8 py-14 sm:py-20 flex justify-center">
        <div aria-hidden="true">
          <div className="orb orb-1" />
          <div className="orb orb-2" />
          <div className="orb orb-3" />
          <div className="grid-floor absolute inset-x-0 bottom-0 h-[48%] z-0" />
        </div>

        <div className="relative z-10 max-w-[800px] text-center flex flex-col items-center gap-[18px]">
          <Eyebrow>
            November 10, 2026 &middot; {CONFERENCE.venueLabel}
          </Eyebrow>
          <h1 className="font-display text-[clamp(30px,6.6vw,78px)] font-extrabold leading-[0.98] m-0 tracking-[0.01em] uppercase text-glow">
            <span className="whitespace-nowrap">2nd GATES</span> Program Stakeholder Conference
          </h1>
          <p className="font-heading text-xs font-bold tracking-[0.14em] uppercase text-white/60 m-0">
            {CONFERENCE.theme}
          </p>
          <p className="text-[17px] sm:text-lg leading-[1.55] text-white/68 max-w-[620px] m-0">
            Keynotes, use case showcases, and the first GATES GeoHack 2026 &mdash; bringing the geospatial data community
            together to co-develop what comes next.
          </p>

          <div
            role="group"
            aria-label="Countdown to the conference"
            className="grid grid-cols-4 gap-2 sm:gap-3 mt-2 w-full max-w-[420px]"
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

          <div className="flex flex-col min-[420px]:flex-row gap-3 mt-2.5 w-full min-[420px]:w-auto">
            <PrimaryButton to="/registration">Registration Info</PrimaryButton>
            <SecondaryButton to="/hackathon">Join the Hackathon</SecondaryButton>
          </div>
        </div>
      </header>

      {/* Key dates — the soonest deadline is the most useful thing on this page */}
      <PageSection labelledBy="dates-title" width="wide">
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
      <PageSection labelledBy="glance-title" width="wide">
        <SectionHead eyebrow="EVENTS AT A GLANCE" title="What's happening" titleId="glance-title" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* The programme is the main event; the three components run alongside it. */}
          <div className="glass-panel program-card glass-panel-strong p-6 sm:p-7 sm:col-span-2 lg:col-span-3">
            <div className="flex flex-wrap justify-between items-end gap-4">
              <div>
                <IconDot color="blue" />
                <h3 className="text-[19px] font-semibold mb-2">Keynotes and programme</h3>
                <p className="text-sm leading-[1.55] text-white/62 m-0 max-w-[560px]">
                  DOST leadership on the Department&apos;s geospatial and AI direction, followed by Program updates,
                  the data governance rationale, and the GATES Lakehouse.
                </p>
              </div>
              <TextLink to="/conference">See the programme &rarr;</TextLink>
            </div>
          </div>

          {COMPONENTS.map((component) => (
            <div key={component.title} className="glass-panel program-card p-6 sm:p-7 flex flex-col">
              <IconDot color={component.color} />
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
          ))}
        </div>
      </PageSection>

      {/* About the Program */}
      <PageSection labelledBy="program-title" width="wide">
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
      <PageSection labelledBy="recap-title" width="wide">
        <SectionHead
          eyebrow="LOOKING BACK"
          title={RECAP_2025.title}
          titleId="recap-title"
          intro={`October 16, 2025 · ${RECAP_2025.formatLabel} · ${RECAP_2025.theme}`}
        />

        <div className="grid grid-cols-1 lg:grid-cols-[0.9fr_1.1fr] gap-4 items-stretch">
          <div
            className="home-recap-feature glass-panel relative overflow-hidden p-6 sm:p-9 flex flex-col justify-end min-h-[280px] sm:min-h-[300px] bg-[#08090b] bg-cover bg-center"
            style={{ backgroundImage: `url(${recapKeynote})` }}
          >
            <div className="relative z-10">
              <Eyebrow>2025 CONFERENCE THEME</Eyebrow>
              <div className="font-display text-[clamp(22px,3.1vw,42px)] font-extrabold uppercase leading-none tracking-[-0.025em] whitespace-nowrap text-glow mt-3">
                {RECAP_2025.theme}
              </div>
              <p className="text-sm leading-[1.55] text-white/62 mt-4 mb-0 max-w-[440px]">
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
          <SecondaryButton to="/hackathon">Proposals close {HACKATHON.submissionDeadlineShort}</SecondaryButton>
        </div>
      </section>

      <Footer />
    </div>
  );
}
