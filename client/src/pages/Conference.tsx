import Nav from "../components/Nav";
import Footer from "../components/Footer";
import ConferencePoster from "../components/ConferencePoster";
import { ConferenceActions } from "../components/ConferenceHeroInfo";
import {
  componentIcons,
  Eyebrow,
  IconCalendar,
  IconClipboardCheck,
  IconDot,
  PageSection,
  Photo,
  PrimaryButton,
  SecondaryButton,
  SectionHead,
  SectionNav,
  Stat,
  TextLink,
  STICKY_OFFSET,
} from "../components/ui";
import recapKeynote from "../assets/photos/2025-keynote.jpg";
import recapPlenarySession from "../assets/photos/2025-plenary-session.jpg";
import recapOpenForum from "../assets/photos/2025-open-forum.jpg";
import recapMappingSharedCommitment from "../assets/photos/2025-mapping-shared-commitment.jpg";
import {
  AGENDA,
  COMPONENTS,
  CONFERENCE,
  PARTICIPANTS,
  RECAP_2025,
} from "../data/conference";
import { usePageMeta } from "../hooks/usePageMeta";

const SECTIONS = [
  { id: "about", label: "About" },
  { id: "schedule", label: "Important dates" },
  { id: "attending", label: "Who attends" },
  { id: "programme", label: "Agenda" },
  { id: "components", label: "Components" },
  { id: "recap", label: "2025 recap" },
];

const dotByColor = {
  blue: "bg-gates-blue",
  teal: "bg-gates-teal",
  orange: "bg-gates-orange",
  plum: "bg-gates-plum",
} as const;

/* Split at the lunch break (AGENDA[13]) — the last morning-session row —
   so the boundary moves with the data instead of a hardcoded index if the
   agenda changes again. */
const AGENDA_LUNCH_INDEX = AGENDA.findIndex((item) => item.title === "Lunch Break + Geospatial Gallery Walk");
const AGENDA_GROUPS = [
  {
    label: "Morning sessions",
    range: "8:00 AM–1:00 PM",
    color: "blue",
    items: AGENDA.slice(0, AGENDA_LUNCH_INDEX + 1),
  },
  {
    label: "Afternoon sessions",
    range: "1:00 PM–4:00 PM",
    color: "orange",
    items: AGENDA.slice(AGENDA_LUNCH_INDEX + 1),
  },
] as const;

export default function Conference() {
  usePageMeta(
    `${CONFERENCE.edition} — ${CONFERENCE.dateLabel}`,
    `The 2nd GATES Program Stakeholder Conference, ${CONFERENCE.dateLabel} in Metro Manila. Program updates, the Use Case Development Showcase, the Geospatial Gallery, and the first GATES GeoHack 2026.`,
  );

  return (
    <div className="conference-page min-h-screen">
      <Nav />

      {/* Hero — the IEC poster carries the title, theme, date and venue, so
          the <h1> is screen-reader-only and the hero is the poster alone. The
          calls to action sit directly beneath it. */}
      <header className="conference-hero hero-poster-bg relative overflow-hidden">
        <h1 className="sr-only">{CONFERENCE.edition}</h1>
        <ConferencePoster priority />
      </header>

      <section
        aria-label="Registration and conference details"
        className="hero-poster-bg border-b border-white/8 px-5 sm:px-8 pt-2 pb-10 sm:pb-12"
      >
        <div className="max-w-[1150px] mx-auto flex flex-col items-center">
          <ConferenceActions detailsHref="#programme" detailsLabel="View Agenda" />
        </div>
      </section>

      <SectionNav items={SECTIONS} />

      {/* About / narrative */}
      <PageSection id="about" labelledBy="about-title">
        <SectionHead eyebrow="ABOUT THE CONFERENCE" title="From Progress to Charting What Comes Next" titleId="about-title" />
        <div className="flex flex-col gap-5 max-w-[820px] mx-auto text-[16px] sm:text-[17px] leading-[1.7] text-white/68">
          <p className="glass-panel glass-panel-strong conference-about-lead m-0 p-6 sm:p-8 text-white/76">
            The {CONFERENCE.edition} builds on the momentum of the inaugural event, marking the Program&rsquo;s
            transition from introducing GATES and its vision to demonstrating how it is enabling agencies and
            partners to co-develop geospatial, data-driven solutions for real-world challenges.
          </p>
          <p className="m-0">
            Beyond focusing on the Program&rsquo;s accomplishments, the event will provide stakeholders with a view of
            how GATES is being translated into applications and collaborations across the DOST System and with
            development partners, and how these efforts can evolve into solutions with potential for wider adoption
            and sustained use.
          </p>
          <p className="m-0">
            Through Program updates, a showcase of use cases and applications, the first GATES GeoHack 2026, and a
            geospatial gallery, the conference serves as a platform to strengthen partnerships, explore
            opportunities, and chart the next phase of the Program together.
          </p>

          <div className="glass-panel conference-theme-card p-8 sm:p-10 mt-6 sm:mt-8">
            <Eyebrow>ABOUT THE THEME</Eyebrow>
            <p className="font-display text-2xl sm:text-3xl font-extrabold uppercase tracking-[0.01em] text-glow m-0 mt-2 mb-3">
              {CONFERENCE.theme}
            </p>
            <p className="m-0">
              The theme reflects GATES&rsquo; forward-looking direction and its commitment to working with
              stakeholders to explore how geospatial technologies, data, and collaboration can help address
              today&rsquo;s challenges and shape solutions for the future.
            </p>
          </div>
        </div>
      </PageSection>

      {/* Hackathon pre-event */}
      <PageSection id="schedule" labelledBy="schedule-title" background="grid-color">
        <SectionHead
          eyebrow="IMPORTANT DATES"
          title="From Final Preparation to the Main Stage"
          titleId="schedule-title"
          intro="The GATES GeoHack 2026 culminates alongside the 2nd GATES Program Stakeholder Conference, bringing finalist teams through a final round of coaching and technical judging before they present their solutions to the wider GATES stakeholder community."
        />
        <div className="glass-panel glass-panel-strong max-w-[860px] mx-auto p-6 sm:p-8 grid grid-cols-1 sm:grid-cols-[1fr_auto_1fr] gap-5 sm:gap-7 sm:items-center">
          <div>
            <IconClipboardCheck color="orange" />
            <div className="font-mono text-[10px] uppercase tracking-[0.12em] text-white/45 mb-1">Pre-Event</div>
            <div className="text-sm font-semibold text-white/78 mb-1">
              GATES GeoHack 2026 Final Coaching &amp; Technical Judging
            </div>
            <h3 className="text-[19px] font-semibold mb-2">{CONFERENCE.hackathonDayLabel}</h3>
            <p className="text-sm leading-[1.6] text-white/62 m-0">
              Finalist teams will take part in final coaching and technical judging as they prepare to present their
              geospatial solutions and demonstrate how they address real-world challenges using the GATES
              environment.
            </p>
          </div>
          <div aria-hidden="true" className="hidden sm:flex items-center text-white/30 text-2xl">
            &rarr;
          </div>
          <div>
            <IconCalendar color="blue" />
            <div className="font-mono text-[10px] uppercase tracking-[0.12em] text-white/45 mb-1">Main Event</div>
            <div className="text-sm font-semibold text-white/78 mb-1">{CONFERENCE.edition}</div>
            <h3 className="text-[19px] font-semibold mb-2">{CONFERENCE.conferenceProperLabel}</h3>
            <p className="text-sm leading-[1.6] text-white/62 m-0">
              The conference brings together GATES stakeholders to explore the Program&rsquo;s latest developments,
              discover emerging use cases and applications, engage with partners, and explore opportunities for
              collaboration. The program will also feature the final pitches and awarding of the GATES GeoHack 2026
              winners.
            </p>
          </div>
        </div>
      </PageSection>

      {/* Participants */}
      <PageSection id="attending" labelledBy="attending-title">
        <SectionHead
          eyebrow="PARTICIPANTS"
          title="Who We’re Bringing Together"
          titleId="attending-title"
          intro="The conference brings together stakeholders from across and beyond the DOST System to learn about the latest developments of GATES, explore opportunities for collaboration, and contribute to charting its next phase."
        />
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {PARTICIPANTS.map((participant) => (
            <div key={participant.group} className="glass-panel program-card p-6 sm:p-7">
              <span aria-hidden="true" className={`block w-8 h-1 rounded-full mb-4 ${dotByColor[participant.color]}`} />
              <h3 className="text-[17px] font-semibold mb-2">{participant.group}</h3>
              <p className="text-sm leading-[1.55] text-white/60 m-0">{participant.detail}</p>
            </div>
          ))}
        </div>

        <div className="glass-panel glass-panel-strong conference-venue mt-4 p-6 sm:p-8 flex flex-col sm:flex-row gap-5 sm:items-center">
          <div aria-hidden="true" className="shrink-0 grid place-items-center w-12 h-12 rounded-2xl bg-gates-teal/70 text-xl">
            ◉
          </div>
          <div>
            <Eyebrow>VENUE</Eyebrow>
            <h3 className="text-[19px] font-semibold mt-2 mb-1.5">Metro Manila</h3>
            <p className="text-sm leading-[1.6] text-white/60 m-0">
              The venue is being finalized. Exact location and travel details will be posted here and sent to registered
              participants as soon as they are confirmed.
            </p>
          </div>
          <span className="sm:ml-auto shrink-0 self-start sm:self-center px-3 py-1.5 rounded-full border border-white/12 bg-white/6 font-heading text-[10px] font-semibold uppercase tracking-[0.08em] text-white/62">
            To be announced
          </span>
        </div>
      </PageSection>

      {/* Agenda (the section keeps its #programme id so existing links still work) */}
      <PageSection id="programme" labelledBy="programme-title" background="grid-color">
        <SectionHead
          eyebrow="PROVISIONAL PROGRAM"
          title="What to Look Forward To"
          titleId="programme-title"
          intro={`Conference proper · ${CONFERENCE.conferenceProperLabel}`}
        />
        <div
          role="note"
          className="glass-panel glass-panel-strong max-w-[900px] mx-auto mb-5 sm:mb-6 px-5 sm:px-6 py-4 flex flex-col sm:flex-row gap-3 sm:items-center"
        >
          <span className="shrink-0 self-start rounded-full border border-gates-orange/30 bg-gates-orange/10 px-2.5 py-1 font-heading text-[10px] font-semibold uppercase tracking-[0.08em] text-orange-200">
            Provisional
          </span>
          <p className="text-[13px] leading-[1.6] text-white/62 m-0">
            Sequence and timings are subject to change, and speakers will be announced closer to the date.
          </p>
        </div>

        <div className="max-w-[900px] mx-auto flex flex-col gap-4">
          {AGENDA_GROUPS.map((group) => (
            <section key={group.label} aria-label={group.label} className="glass-panel overflow-hidden">
              <div className="relative flex flex-col min-[420px]:flex-row min-[420px]:items-center min-[420px]:justify-between gap-1.5 min-[420px]:gap-4 px-5 sm:px-6 py-4 sm:py-5 border-b border-white/10">
                <span aria-hidden="true" className={`absolute inset-y-0 left-0 w-1 ${dotByColor[group.color]}`} />
                <h3 className="text-base sm:text-lg font-semibold m-0">{group.label}</h3>
                <span className="shrink-0 font-mono text-[10px] sm:text-[11px] text-white/48">{group.range}</span>
              </div>

              <ol className="list-none m-0 p-0 divide-y divide-white/8">
                {group.items.map((item, itemIndex) => {
                  const pending = item.time === "To be confirmed";
                  return (
                    <li
                      key={`${item.time}-${item.title}-${itemIndex}`}
                      className={`conference-programme-row grid grid-cols-[82px_minmax(0,1fr)] sm:grid-cols-[120px_minmax(0,1fr)] gap-3 sm:gap-6 px-4 sm:px-6 py-4 ${
                        item.isBreak ? "bg-white/[0.025]" : ""
                      }`}
                    >
                      <div>
                        <span
                          className={
                            pending
                              ? "inline-flex rounded-full border border-gates-orange/25 bg-gates-orange/8 px-2 py-1 font-heading text-[9px] font-semibold uppercase leading-tight tracking-[0.04em] text-orange-200"
                              : "font-mono tabular-nums text-[11px] sm:text-xs text-white/58"
                          }
                        >
                          {item.time}
                        </span>
                      </div>
                      <div className="flex gap-3">
                        <span
                          aria-hidden="true"
                          className={`shrink-0 w-2 h-2 rounded-full mt-[7px] ${dotByColor[group.color]}`}
                        />
                        <div>
                          <h4 className="text-[15px] sm:text-base font-semibold leading-snug text-white/88 m-0">
                            {item.title}
                          </h4>
                          {item.desc && (
                            <p className="text-[13px] sm:text-sm leading-[1.55] text-white/57 m-0 mt-1">{item.desc}</p>
                          )}
                          {item.notes && (
                            <ul className="text-[13px] sm:text-sm leading-[1.55] text-white/57 m-0 mt-1 pl-4 list-disc">
                              {item.notes.map((note) => (
                                <li key={note}>{note}</li>
                              ))}
                            </ul>
                          )}
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ol>
            </section>
          ))}
        </div>
      </PageSection>

      {/* Major components */}
      <PageSection id="components" labelledBy="components-title" width="wide">
        <SectionHead eyebrow="COMPONENTS" title="Key Highlights of the Event" titleId="components-title" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {COMPONENTS.map((component) => {
            const Icon = componentIcons[component.title] ?? IconDot;
            return (
            <div key={component.title} className="glass-panel program-card p-6 sm:p-7 h-full flex flex-col gap-3">
              <Icon color={component.color} />
              <h3 className="text-[19px] font-semibold m-0">{component.title}</h3>
              <p className="text-sm leading-[1.6] text-white/62 m-0">{component.desc}</p>
              {"to" in component && component.to && (
                <div className="mt-auto pt-2">
                  <TextLink to={component.to}>{component.linkLabel} &rarr;</TextLink>
                </div>
              )}
            </div>
            );
          })}
        </div>
      </PageSection>

      {/* 2025 recap */}
      <PageSection id="recap" labelledBy="recap-title" width="wide" background="grid-color">
        <SectionHead
          eyebrow="LOOKING BACK"
          title={RECAP_2025.title}
          titleId="recap-title"
          intro={`${RECAP_2025.dateLabel} · ${RECAP_2025.formatLabel} · ${RECAP_2025.theme}`}
        />

        <div className="grid grid-cols-1 min-[420px]:grid-cols-3 gap-3 mb-7">
          {RECAP_2025.stats.map((stat) => (
            <Stat key={stat.label} value={stat.value} label={stat.label} />
          ))}
        </div>

        {/* Plenary session gets its own full-width row so it renders larger
            than the other three, spanning the whole row alone instead of
            sharing it. Its source file is itself a wide (~21:9) crop of the
            crowd, so aspect matches that exactly rather than the other
            three's aspect-[4/3] default — using 4/3 here would make object-cover
            crop it a second time to fit, undoing the intentional crop. */}
        <div className="flex flex-col gap-3.5 mb-7">
          <div className="grid grid-cols-1 min-[420px]:grid-cols-3 gap-3.5">
            <Photo src={recapKeynote} alt="Keynote address at the 2025 GATES Stakeholder Conference" />
            <Photo src={recapOpenForum} alt="Open forum at the 2025 GATES Stakeholder Conference" />
            <Photo
              src={recapMappingSharedCommitment}
              alt="Attendees at the closing Mapping Shared Commitment activity, 2025 GATES Stakeholder Conference"
            />
          </div>
          <Photo
            src={recapPlenarySession}
            alt="Plenary session at the 2025 GATES Stakeholder Conference"
            aspect="aspect-[21/9]"
          />
        </div>

        <div className="glass-panel program-card p-8 sm:p-10">
          <h3 className="text-[17px] font-semibold mb-3">What happened</h3>
          <div className="flex flex-col gap-3.5 text-sm leading-[1.65] text-white/62">
            <p className="m-0">
              The inaugural GATES Program Stakeholder Conference marked the formal introduction of GATES to its
              stakeholders and served as the starting point for building a shared understanding of the Program and
              its vision.
            </p>
            <p className="m-0">
              The conference brought together DOST Central and Regional Offices, Attached Agencies, and external
              partners to explore why GATES was conceptualized, its four interconnected components, and its initial
              efforts toward building a geospatial and data-driven ecosystem. Through presentations, discussions, and
              interactive sessions, stakeholders shared insights, offered suggestions, and expressed their commitment
              to contributing to the Program&rsquo;s success.
            </p>
            <p className="m-0">
              The conference also unveiled the GATES roadmap, outlining the Program&rsquo;s direction and priorities
              for the years ahead. It concluded with &ldquo;Mapping Shared Commitment,&rdquo; an interactive activity
              where participants mapped their hometowns onto a shared map&mdash;symbolizing a collective commitment
              to building GATES together.
            </p>
          </div>
        </div>

        <div className="mt-6 text-center">
          <TextLink to={RECAP_2025.recapUrl} external>
            View the 2025 recap on Facebook &rarr;
          </TextLink>
        </div>
      </PageSection>

      {/* CTA */}
      <section
        style={{ scrollMarginTop: `${STICKY_OFFSET}px` }}
        className="hero-brand-gradient glass-panel relative overflow-hidden max-w-[1000px] mx-5 sm:mx-8 lg:mx-auto my-10 sm:my-16 px-6 sm:px-10 py-10 sm:py-14 text-center flex flex-col gap-[18px] items-center"
      >
        <Eyebrow>BE PART OF WHAT COMES NEXT</Eyebrow>
        <h2 className="text-[clamp(24px,3vw,34px)] font-bold m-0 tracking-tight">Join us on November 10</h2>
        <div className="flex flex-col min-[420px]:flex-row gap-3 mt-1 w-full min-[420px]:w-auto">
          <PrimaryButton to="/registration">Register Now</PrimaryButton>
          <SecondaryButton to="/hackathon">Explore the Hackathon</SecondaryButton>
        </div>
      </section>

      <Footer />
    </div>
  );
}
