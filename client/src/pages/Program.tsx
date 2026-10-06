import type { CSSProperties } from "react";
import Nav from "../components/Nav";
import Footer from "../components/Footer";
import ProjectShowcase from "../components/ProjectShowcase";
import {
  Eyebrow,
  IconChip,
  IconGrowth,
  IconHeart,
  IconLayers,
  IconLeaf,
  IconPeople,
  IconShield,
  PageSection,
  PrimaryButton,
  SecondaryButton,
  SectionHead,
  SectionNav,
  STICKY_OFFSET,
} from "../components/ui";
import { usePageMeta } from "../hooks/usePageMeta";
import { DOST, GATES, SOCIALS } from "../data/org";
import { CONFERENCE } from "../data/conference";
import starImg from "../assets/identity/star.webp";
import sailsImg from "../assets/identity/sails.webp";
import compassImg from "../assets/identity/compass.webp";
import letterGImg from "../assets/identity/letter-G.webp";
import manImg from "../assets/identity/man.webp";
import domainHealthIcon from "../assets/icons/hands-heart-people.webp";
import domainDisasterIcon from "../assets/icons/warning-cracked-ground.webp";
import domainEnvironmentIcon from "../assets/icons/plant-hand.webp";
import domainNaturalResourcesIcon from "../assets/icons/globe-pin.webp";
import domainInfrastructureIcon from "../assets/icons/crane-construction.webp";
import domainKnowledgeIcon from "../assets/icons/head-lightbulb.webp";

/*
 * All copy on this page is drawn from the official "DOST GATES Program Briefer".
 * Please keep it in sync with that document rather than paraphrasing freely —
 * agency names, project titles, and objectives are quoted or lightly condensed
 * from it. Section headings and card titles are the only editorial additions.
 */

const SECTIONS = [
  { id: "overview", label: "Overview" },
  { id: "goals", label: "Strategic goals" },
  { id: "domains", label: "Domains" },
  { id: "pillars", label: "Pillars" },
  { id: "identity", label: "Identity" },
  { id: "projects", label: "Projects" },
  { id: "connect", label: "Connect" },
];

/*
 * DOST's four strategic goals, which GATES is designed to support. The briefer
 * names these without further description, so none is added here — do not
 * invent gloss for them without sign-off from the Program office.
 */
const STRATEGIC_GOALS = [
  { color: "blue", title: "Human Well-being", icon: IconHeart },
  { color: "teal", title: "Wealth Creation", icon: IconGrowth },
  { color: "orange", title: "Wealth Protection", icon: IconShield },
  { color: "plum", title: "Sustainability", icon: IconLeaf },
] as const;

/**
 * Innovation domains GATES anchors and integrates datasets across. `icon`
 * reuses the same topical icon set already wired to these same six domains
 * on the Hackathon page (see DOMAIN_ICONS in Hackathon.tsx) — matched by
 * topic here rather than array position, since the two lists don't share
 * an order.
 */
const DOMAINS = [
  { label: "Health, Nutrition, Education & Social Services", icon: domainHealthIcon },
  { label: "Disaster Risk Reduction & Management", icon: domainDisasterIcon },
  { label: "Environmental Monitoring", icon: domainEnvironmentIcon },
  { label: "Natural Resources Assessment", icon: domainNaturalResourcesIcon },
  { label: "Geospatial Infrastructure Development", icon: domainInfrastructureIcon },
  { label: "Project & Knowledge Management", icon: domainKnowledgeIcon },
] as const;

/**
 * How the logo and visual identity encode the program — copy quoted
 * verbatim from the official GATES brochure's own "star / sails / compass /
 * letter G" breakdown (the brochure supplied 2026-09-17), replacing the
 * earlier editorial paraphrase that didn't mention a "compass" reading at
 * all. Order matches how the brochure's own illustration reads bottom-to-
 * top: star (closest/largest, where the figure stands for scale), sails,
 * compass, letter G (furthest back).
 */
const IDENTITY_NOTES = [
  {
    key: "star",
    color: "plum",
    title: "The Star",
    desc: "This star signifies the GATES' goal of leveraging geospatial analytics and the latest technologies for innovative solutions.",
    image: starImg,
  },
  {
    key: "sails",
    color: "orange",
    title: "The Sails",
    desc: "These sails symbolize the four GATES projects, each charting a course for progress.",
    image: sailsImg,
  },
  {
    key: "compass",
    color: "blue",
    title: "The Compass",
    desc: "This compass symbolizes geospatial analytics, while also representing direction, guidance, and informed decision-making.",
    image: compassImg,
  },
  {
    key: "letterG",
    color: "teal",
    title: "The Letter “G”",
    desc: "This four-pointed letter “G”, directly ties this symbol to the GATES Program and reinforces its distinct brand identity.",
    image: letterGImg,
  },
] as const;

/** Position for each identity callout label — paired with the matching connector line drawn in the SVG overlay right above where this is used. Each label is horizontally centered on (aligned with) its own shape's center, alternating bottom/top left-to-right (star/sails below, compass/letter-G above). The four shapes' own boxes overlap each other a lot at this size/spacing (intentional — it's the layered brochure look), so there's no clear band directly under/over any single shape; every label lives in the one genuinely shape-free band on its side (below all four shapes, or above all four), even when that puts it further from its own shape than from a neighbor's — connector line length just varies to match. Bottom-placed labels use `top`; top-placed ones use `bottom` (grows upward, so it doesn't need its rendered height known in advance to stay clear of the shapes below it). */
const identityLabelStyle: Record<string, CSSProperties> = {
  star: { top: "88%", left: "2%", width: "20%", textAlign: "center" },
  sails: { top: "80%", left: "54%", width: "20%", textAlign: "center" },
  compass: { bottom: "69%", left: "28%", width: "20%", textAlign: "center" },
  letterG: { bottom: "78%", left: "76%", width: "20%", textAlign: "center" },
};

function SocialIcon({ platform }: { platform: string }) {
  return (
    <span
      aria-hidden="true"
      className={`social-brand-icon ${
        platform === "Facebook" ? "social-brand-icon-facebook" : "social-brand-icon-instagram"
      }`}
    >
      {platform === "Facebook" ? "f" : null}
    </span>
  );
}

/* Contact details are shared with the footer — see data/org.ts. */

export default function Program() {
  usePageMeta(
    `About GATES — ${CONFERENCE.edition}`,
    "The Geospatial Analytics and Technology Solutions (GATES) Program unifies DOST's geospatial data into one integrative, interoperable platform. Explore its objectives, innovation domains, and four component projects.",
  );

  return (
    <div className="program-page min-h-screen">
      <Nav />

      {/* Hero */}
      <header className="program-hero hackathon-hero-bg relative overflow-hidden border-b border-white/8 px-5 sm:px-8">
        <div className="program-hero-swirl-bg absolute inset-0 z-0" aria-hidden="true" />
        <div className="hero-bloom-bg absolute inset-0 z-0" aria-hidden="true" />
        <div className="relative z-10 max-w-[900px] mx-auto py-14 sm:py-20 text-center flex flex-col gap-[18px] items-center">
          <Eyebrow>ABOUT THE PROGRAM</Eyebrow>
          <h1 className="font-display text-[clamp(28px,5vw,56px)] font-extrabold m-0 tracking-[0.01em] uppercase text-glow">
            {GATES.programName}
          </h1>
          <p className="font-heading text-base sm:text-lg font-bold tracking-[0.14em] uppercase text-white/60 m-0">
            For a Spatially Intelligent Nation
          </p>
          <p className="text-[17px] sm:text-lg leading-[1.55] text-white/70 m-0 max-w-[720px] lg:max-w-none lg:whitespace-nowrap">
            GATES harmonizes geospatial information, tools, and applications into one integrated, interoperable
            platform.
          </p>

          <div className="flex flex-col min-[420px]:flex-row gap-3 mt-2 w-full min-[420px]:w-auto">
            <a
              href="#overview"
              className="btn-primary px-[26px] py-3.5 rounded-full text-white font-bold text-[15px] no-underline text-center"
            >
              Explore the Program
            </a>
            <a
              href="#projects"
              className="glass-panel px-[26px] py-3.5 rounded-full text-white/90 font-semibold text-[15px] no-underline text-center"
            >
              View Component Projects
            </a>
          </div>

        </div>
      </header>

      <SectionNav items={SECTIONS} />

      {/* Overview */}
      <PageSection id="overview" labelledBy="overview-title">
        <SectionHead eyebrow="OVERVIEW" title="What GATES is" titleId="overview-title" />
        <div className="flex flex-col gap-5 max-w-[820px] mx-auto text-[16px] sm:text-[17px] leading-[1.7] text-white/68">
          <p className="glass-panel glass-panel-strong program-overview-lead m-0 p-6 sm:p-8 text-white/76">
            GATES is one of the <strong className="font-semibold text-white/85">eight transformative research and
            development initiatives</strong> of the Department of Science and Technology (DOST), designed to harness the
            full potential of the Department&apos;s geospatial data for data-driven decision-making, research, and
            innovation.
          </p>
          <p className="m-0">
            At its core, GATES unifies and harmonizes the vast geospatial data developed by DOST and its attached
            agencies into a single, integrative, and interoperable platform &mdash; making data more accessible,
            usable, and impactful. It leverages advanced geospatial analytics and technologies such as artificial
            intelligence, machine learning, and predictive analytics.
          </p>
          <p className="m-0">
            GATES maximizes resources &mdash; data, technology, and people &mdash; and adds value to these investments
            by creating an environment for co-creation and collaboration: an environment where data is shared,
            multi-sectoral use cases and applications are developed, capacities are strengthened, and efforts are
            sustained. It supports DOST agencies and regional offices in co-developing practical use cases, and serves
            as a mechanism for the #OneDOST4U campaign.
          </p>
          <p className="m-0">
            Ultimately, GATES will be institutionalized as a core part of DOST&apos;s framework, and is envisioned to
            serve as a model for digital transformation and data-driven governance across government.
          </p>
        </div>
      </PageSection>

      {/* Strategic goals */}
      <PageSection id="goals" labelledBy="goals-title" width="wide" background="swirl" bloom>
        <SectionHead
          eyebrow="STRATEGIC ALIGNMENT"
          title="Supporting DOST's four strategic goals"
          titleId="goals-title"
          intro="By leveraging advanced geospatial analytics and new technologies such as artificial intelligence, machine learning, and predictive analytics, the Program supports the DOST's four strategic goals."
        />
        <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 list-none m-0 p-0">
          {STRATEGIC_GOALS.map((goal) => {
            const Icon = goal.icon;
            return (
              <li
                key={goal.title}
                className={`glass-panel program-card program-goal-card program-accent-${goal.color} flex items-center gap-3 p-4`}
              >
                {/* IconBadge's own mb-[14px] is meant for a vertical (icon-above-title)
                    card; this row is horizontal, so it's zeroed out here rather than
                    changing the shared badge for every other caller. */}
                <span className="shrink-0 [&>span]:mb-0">
                  <Icon color={goal.color} />
                </span>
                <h3 className="font-heading text-sm font-semibold leading-[1.3] text-white/82 m-0">{goal.title}</h3>
              </li>
            );
          })}
        </ul>
      </PageSection>

      {/* Innovation domains */}
      <PageSection id="domains" labelledBy="domains-title">
        <SectionHead
          eyebrow="INNOVATION DOMAINS"
          title="Where the data comes together"
          titleId="domains-title"
          intro="GATES enables the geospatial anchoring and integration of datasets across six key innovation domains."
        />
        <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 list-none m-0 p-0">
          {DOMAINS.map((domain) => (
            <li
              key={domain.label}
              className="glass-panel glass-panel-strong program-card program-domain-card p-5 sm:p-6"
            >
              <img src={domain.icon} alt="" aria-hidden="true" className="w-[42px] h-[42px] rounded-full" />
              <h3 className="font-heading text-[16px] sm:text-[17px] font-semibold leading-[1.4] text-white/86 m-0">
                {domain.label}
              </h3>
            </li>
          ))}
        </ul>
        <p className="text-[15px] leading-[1.65] text-white/58 max-w-[720px] mx-auto mt-7 text-center">
          Together these enhance DOST&apos;s ability to deliver responsive, science-based, and inclusive services while
          driving innovation and knowledge creation.
        </p>
      </PageSection>

      {/* Pillars — retained from the approved design */}
      <PageSection id="pillars" labelledBy="pillars-title" background="swirl" bloom>
        <SectionHead eyebrow="PILLARS" title="What GATES brings together" titleId="pillars-title" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="glass-panel p-6 sm:p-7">
            <IconLayers color="blue" />
            <h3 className="text-[19px] font-semibold mb-2">Data</h3>
            <p className="text-sm leading-[1.5] text-white/60 m-0">
              A shared geospatial data environment across agencies and sectors.
            </p>
          </div>
          <div className="glass-panel p-6 sm:p-7">
            <IconChip color="orange" />
            <h3 className="text-[19px] font-semibold mb-2">Technology</h3>
            <p className="text-sm leading-[1.5] text-white/60 m-0">
              Interoperable tools and platforms built for reuse, not reinvention.
            </p>
          </div>
          <div className="glass-panel p-6 sm:p-7 sm:col-span-2 lg:col-span-1">
            <IconPeople color="plum" />
            <h3 className="text-[19px] font-semibold mb-2">People</h3>
            <p className="text-sm leading-[1.5] text-white/60 m-0">
              Capacity strengthened across the community that builds and uses it.
            </p>
          </div>
        </div>
      </PageSection>

      {/* Identity */}
      <PageSection id="identity" labelledBy="identity-title" width="wide">
        <SectionHead
          eyebrow="PROGRAM IDENTITY"
          title="Reading the GATES logo"
          titleId="identity-title"
          intro="More than a visual identity — the mark stands for competence, reliability, discovery, and innovation."
        />

        {/* Desktop: the brochure's own layered illustration (star, sails,
            compass, and the letter "G" as separate renders, plus a figure
            for scale) with callout lines, reproduced from a reference photo
            of the printed brochure — positions are estimated from that
            photo, not measured from original source coordinates, so treat
            them as a first pass to true up against the real thing. Hidden
            below lg: the illustration + margin callouts need real width to
            read; the card fallback below covers narrower screens instead
            of trying to scale this down. */}
        <div className="hidden lg:block relative w-full max-w-[1100px] mx-auto aspect-[11/8.5] mt-4 mb-16">
          {/* Diagonal, ascending, evenly stacked: star (closest) at
              bottom-left, rising in equal steps (22% across, 11% up) through
              compass and sails to the letter "G" (furthest) at top-right —
              slope (rise/run) = 11/22 = 0.5. Sizes still shrink slightly with
              distance (34%, 33.5%, 33%, 32.5% — a 0.5-point step per shape
              left to right). Section widened (max-w 960→1100px) and made
              taller (aspect 11/8→11/8.5) to fit this wider spread and give
              the label bands below real room — see the label style comment
              further down. */}
          <img src={letterGImg} alt="" className="absolute" style={{ left: "65.75%", top: "24.99%", width: "32.5%" }} />
          <img src={sailsImg} alt="" className="absolute" style={{ left: "43.5%", top: "35.86%", width: "33%" }} />
          <img src={compassImg} alt="" className="absolute" style={{ left: "21.25%", top: "47.375%", width: "33.5%" }} />
          <img src={starImg} alt="" className="absolute" style={{ left: "-1%", top: "57.15%", width: "34%" }} />
          {/* Standing ON the star, not straddling its middle: horizontally
              centered on the star's own center (22%), with the figure's feet
              (its bottom edge) planted at that same center point vertically,
              so the whole figure rises up from there rather than being
              centered through it. Sized down again (4%, from 5%). */}
          <img src={manImg} alt="" className="absolute" style={{ left: "14%", top: "50.88%", width: "4%" }} />

          {/* Drawn after (so painted on top of) the shape images above —
              an svg positioned before them in the DOM would paint underneath
              at these z-index:auto stacking levels, hiding the dots
              wherever a shape happens to cover that spot. Star and compass
              dots sit at their shape's own visual center (verified opaque
              there by sampling actual pixel alpha). Sails and letter-G's
              dots are pulled off-center on the x-axis instead, matching
              their label's x so the connector line runs straight instead of
              on a diagonal — re-verified alpha at that shifted x for each
              (sails: still solidly opaque a little right of center; letter-G,
              a thin ribbon with no fully-opaque pixel anywhere in the file,
              uses the best alpha found anywhere along that one column,
              which isn't the same y as its label-aligned neighbors). */}
          <svg
            className="absolute inset-0 w-full h-full"
            viewBox="0 0 110 85"
            preserveAspectRatio="none"
            aria-hidden="true"
          >
            <g stroke="rgba(255,255,255,0.32)" strokeWidth="0.25">
              <line x1="13.2" y1="74.8" x2="13.2" y2="60.45" />
              <line x1="41.8" y1="26.35" x2="41.8" y2="51.17" />
              <line x1="70.4" y1="68" x2="70.4" y2="41.79" />
              <line x1="94.6" y1="18.7" x2="94.6" y2="30.45" />
            </g>
            <g fill="white">
              <circle cx="13.2" cy="60.45" r="0.7" />
              <circle cx="41.8" cy="51.17" r="0.7" />
              <circle cx="70.4" cy="41.79" r="0.7" />
              <circle cx="94.6" cy="30.45" r="0.7" />
            </g>
          </svg>

          {IDENTITY_NOTES.map((note) => (
            <div
              key={note.key}
              className="absolute font-heading"
              style={identityLabelStyle[note.key]}
            >
              <h3 className="text-[15px] font-bold uppercase tracking-[0.03em] m-0 mb-1">{note.title}</h3>
              <p className="text-[12.5px] leading-[1.5] text-white/60 m-0">{note.desc}</p>
            </div>
          ))}
        </div>

        {/* Mobile/tablet fallback — same copy and imagery, plain cards instead of the illustration. */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 lg:hidden">
          {IDENTITY_NOTES.map((note) => (
            <div key={note.key} className="glass-panel program-card p-6 sm:p-7">
              <img src={note.image} alt="" aria-hidden="true" className="w-16 h-auto mb-3" />
              <h3 className="text-[18px] font-semibold mb-2">{note.title}</h3>
              <p className="text-sm leading-[1.6] text-white/62 m-0">{note.desc}</p>
            </div>
          ))}
        </div>
      </PageSection>

      {/* Component projects */}
      <PageSection id="projects" labelledBy="projects-title" width="wide" background="swirl" bloom>
        <SectionHead
          eyebrow="COMPONENT PROJECTS"
          title="Four Projects, One Program"
          titleId="projects-title"
          intro="Each project is led by a different DOST office or attached agency, with the later projects building on the outputs of the earlier ones. Each is also represented by one sail of the GATES logomark — select a sail to read the details of each project."
        />
        <ProjectShowcase />
      </PageSection>

      {/* How it works — retained from the approved design */}
      <PageSection labelledBy="howitworks-title">
        <SectionHead eyebrow="HOW IT WORKS" title="Co-creation, in practice" titleId="howitworks-title" />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="glass-panel p-6 sm:p-7">
            <h3 className="text-[19px] font-semibold mb-2">Co-creation &amp; collaboration</h3>
            <p className="text-sm leading-[1.5] text-white/60 m-0">
              Agencies and regional offices co-develop use cases alongside each other, not in isolation.
            </p>
          </div>
          <div className="glass-panel p-6 sm:p-7">
            <h3 className="text-[19px] font-semibold mb-2">Shared data environment</h3>
            <p className="text-sm leading-[1.5] text-white/60 m-0">
              One integrative, interoperable platform &mdash; many contributors.
            </p>
          </div>
          <div className="glass-panel p-6 sm:p-7">
            <h3 className="text-[19px] font-semibold mb-2">Capacity strengthening</h3>
            <p className="text-sm leading-[1.5] text-white/60 m-0">
              A core DOST data science cadre, upskilled with support from high-level data experts.
            </p>
          </div>
          <div className="glass-panel p-6 sm:p-7">
            <h3 className="text-[19px] font-semibold mb-2">Sustained efforts</h3>
            <p className="text-sm leading-[1.5] text-white/60 m-0">
              Supporting policies, protocols, and an exit strategy so GATES outlasts any single funding cycle.
            </p>
          </div>
        </div>
      </PageSection>

      {/* Connect */}
      <PageSection id="connect" labelledBy="connect-title" background="swirl" bloom>
        <SectionHead eyebrow="CONNECT WITH US" title="Get in touch with the Program" titleId="connect-title" />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="glass-panel p-6 sm:p-7 flex flex-col gap-4">
            <div>
              <span className="block font-mono text-[10px] uppercase tracking-[0.12em] text-white/42 mb-1">Email</span>
              <a
                href={`mailto:${GATES.email}`}
                className="text-gates-link no-underline text-sm font-semibold hover:brightness-110 break-all"
              >
                {GATES.email}
              </a>
            </div>
            <div>
              <span className="block font-mono text-[10px] uppercase tracking-[0.12em] text-white/42 mb-1">
                Website
              </span>
              <a
                href={DOST.website.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-gates-link no-underline text-sm font-semibold hover:brightness-110"
              >
                {DOST.website.label}
              </a>
            </div>
            <div>
              <span className="block font-mono text-[10px] uppercase tracking-[0.12em] text-white/42 mb-1">
                Program office
              </span>
              <address className="text-sm leading-[1.6] text-white/68 not-italic m-0">
                {DOST.office}
                {DOST.addressLines.map((line) => (
                  <span key={line} className="block">
                    {line}
                  </span>
                ))}
              </address>
            </div>
          </div>
          <div className="glass-panel p-6 sm:p-7">
            <span className="block font-mono text-[10px] uppercase tracking-[0.12em] text-white/42 mb-4">
              Follow DOST GATES
            </span>
            <ul className="grid gap-3 list-none m-0 p-0">
              {SOCIALS.map((social) => (
                <li key={social.platform}>
                  <a
                    href={social.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="program-social-link flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3.5 text-white/78 no-underline transition-colors hover:text-white hover:border-white/20 hover:bg-white/[0.07]"
                  >
                    <SocialIcon platform={social.platform} />
                    <span className="min-w-0">
                      <span className="block font-heading text-xs font-semibold uppercase tracking-[0.08em] text-white/50">
                        {social.platform}
                      </span>
                      <span className="block text-sm font-semibold mt-0.5">{social.handle}</span>
                    </span>
                    <span aria-hidden="true" className="ml-auto text-white/40">
                      &#8599;
                    </span>
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </PageSection>

      {/* CTA */}
      <section
        style={{ scrollMarginTop: `${STICKY_OFFSET}px` }}
        className="hero-brand-gradient glass-panel relative overflow-hidden max-w-[1000px] mx-5 sm:mx-8 lg:mx-auto my-10 sm:my-16 px-6 sm:px-10 py-10 sm:py-14 text-center flex flex-col gap-[18px] items-center"
      >
        <Eyebrow>NEXT STEP</Eyebrow>
        <h2 className="text-[clamp(24px,3vw,34px)] font-bold m-0 tracking-tight">
          See it in action at the 2nd GATES Program Stakeholder Conference
        </h2>
        <div className="flex flex-col min-[420px]:flex-row gap-3 mt-1 w-full min-[420px]:w-auto">
          <PrimaryButton to="/conference">View Conference Details</PrimaryButton>
          <SecondaryButton to="/registration">Registration Info</SecondaryButton>
        </div>
      </section>

      <Footer />
    </div>
  );
}
