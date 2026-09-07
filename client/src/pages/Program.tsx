import Nav from "../components/Nav";
import Footer from "../components/Footer";
import ProjectShowcase from "../components/ProjectShowcase";
import {
  Eyebrow,
  IconDot,
  PageSection,
  PrimaryButton,
  SecondaryButton,
  SectionHead,
  SectionNav,
  STICKY_OFFSET,
} from "../components/ui";
import { usePageMeta } from "../hooks/usePageMeta";
import { DOST, GATES, SOCIALS } from "../data/org";

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
  { color: "blue", title: "Human Well-being" },
  { color: "teal", title: "Wealth Creation" },
  { color: "orange", title: "Wealth Protection" },
  { color: "plum", title: "Sustainability" },
] as const;

/** Innovation domains GATES anchors and integrates datasets across. */
const DOMAINS = [
  { color: "blue", label: "Health, Nutrition, Education & Social Services" },
  { color: "orange", label: "Disaster Risk Reduction & Management" },
  { color: "teal", label: "Environmental Monitoring" },
  { color: "plum", label: "Natural Resources Assessment" },
  { color: "blue", label: "Geospatial Infrastructure Development" },
  { color: "teal", label: "Project & Knowledge Management" },
] as const;

/** How the logo and visual identity encode the program. */
const IDENTITY_NOTES = [
  {
    color: "blue",
    title: "Rooted in the DOST star",
    desc: "The design draws on the DOST star, which signifies scientific creativity — and which has also become an unofficial symbol of AI in contemporary design, evoking wonder, innovation, and discovery.",
  },
  {
    color: "orange",
    title: "Four points, four sails",
    desc: "The star's shaded and unshaded quadrants echo the four points of a compass, while its geometry creates shapes resembling sails — suggesting movement, exploration, and forward momentum. Each sail carries elements representing one of the four component projects.",
  },
  {
    color: "plum",
    title: "A colour per project",
    desc: "The palette represents the GATES Program as a whole, while each colour — blue, teal, orange, and purple — also marks the distinct identity of one of the Program's project components.",
  },
  {
    color: "teal",
    title: "A hidden “G”, and a sunset horizon",
    desc: "The four-pointed star subtly forms the letter “G”. The complementing visual theme is inspired by the sky at sunset — horizon imagery for new possibilities, hope, discovery, and the limitless potential of data and technology.",
  },
] as const;

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
    "About GATES — GATES Stakeholder Conference 2026",
    "The Geospatial Analytics and Technology Solutions (GATES) Program unifies DOST's geospatial data into one integrative, interoperable platform. Explore its objectives, innovation domains, and four component projects.",
  );

  return (
    <div className="program-page min-h-screen">
      <Nav />

      {/* Hero */}
      <header className="program-hero hero-brand-gradient relative overflow-hidden border-b border-white/8 px-5 sm:px-8">
        <div className="relative z-10 max-w-[860px] mx-auto py-14 sm:py-20 text-center flex flex-col gap-[18px] items-center">
          <Eyebrow>ABOUT THE PROGRAM</Eyebrow>
          <h1 className="font-display text-[clamp(36px,6vw,68px)] font-extrabold m-0 tracking-[0.01em] uppercase text-glow">
            The GATES Program
          </h1>
          <p className="text-[17px] sm:text-lg leading-[1.55] text-white/70 m-0 max-w-[720px]">
            The Geospatial Analytics and Technology Solutions Program harmonizes geospatial information, tools, and
            applications into one integrated, interoperable platform.
          </p>
          <p className="font-heading text-xs font-bold tracking-[0.14em] uppercase text-white/60 m-0">
            For a Spatially Intelligent Nation
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
      <PageSection id="goals" labelledBy="goals-title" width="wide">
        <SectionHead
          eyebrow="STRATEGIC ALIGNMENT"
          title="Supporting DOST's four strategic goals"
          titleId="goals-title"
          intro="By leveraging advanced geospatial analytics and new technologies such as artificial intelligence, machine learning, and predictive analytics, the Program supports the DOST's four strategic goals."
        />
        <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 list-none m-0 p-0">
          {STRATEGIC_GOALS.map((goal) => (
            <li
              key={goal.title}
              className={`glass-panel program-card program-goal-card program-accent-${goal.color} flex items-center gap-3 p-4`}
            >
              <span className="program-icon-placeholder" aria-label="Icon placeholder">
                Icon
              </span>
              <h3 className="font-heading text-sm font-semibold leading-[1.3] text-white/82 m-0">{goal.title}</h3>
            </li>
          ))}
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
              className={`glass-panel glass-panel-strong program-card program-domain-card program-accent-${domain.color} p-5 sm:p-6`}
            >
              <span className="program-icon-placeholder program-icon-placeholder-large" aria-label="Icon placeholder">
                Icon
              </span>
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
      <PageSection id="pillars" labelledBy="pillars-title">
        <SectionHead eyebrow="PILLARS" title="What GATES brings together" titleId="pillars-title" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="glass-panel p-6 sm:p-7">
            <IconDot color="blue" />
            <h3 className="text-[19px] font-semibold mb-2">Data</h3>
            <p className="text-sm leading-[1.5] text-white/60 m-0">
              A shared geospatial data environment across agencies and sectors.
            </p>
          </div>
          <div className="glass-panel p-6 sm:p-7">
            <IconDot color="orange" />
            <h3 className="text-[19px] font-semibold mb-2">Technology</h3>
            <p className="text-sm leading-[1.5] text-white/60 m-0">
              Interoperable tools and platforms built for reuse, not reinvention.
            </p>
          </div>
          <div className="glass-panel p-6 sm:p-7 sm:col-span-2 lg:col-span-1">
            <IconDot color="plum" />
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
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {IDENTITY_NOTES.map((note) => (
            <div key={note.title} className="glass-panel program-card p-6 sm:p-7">
              <IconDot color={note.color} />
              <h3 className="text-[18px] font-semibold mb-2">{note.title}</h3>
              <p className="text-sm leading-[1.6] text-white/62 m-0">{note.desc}</p>
            </div>
          ))}
        </div>
      </PageSection>

      {/* Component projects */}
      <PageSection id="projects" labelledBy="projects-title" width="wide">
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
      <PageSection id="connect" labelledBy="connect-title">
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
          See it in action at the 2026 Conference
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
