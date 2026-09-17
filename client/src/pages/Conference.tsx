import Nav from "../components/Nav";
import Footer from "../components/Footer";
import {
  Eyebrow,
  IconCalendar,
  IconClipboardCheck,
  IconCode,
  IconDot,
  IconMap,
  IconPresentation,
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
  CONFERENCE_DATE,
  PARTICIPANTS,
  RECAP_2025,
} from "../data/conference";
import { usePageMeta } from "../hooks/usePageMeta";
import { useCountdown } from "../hooks/useCountdown";

const SECTIONS = [
  { id: "about", label: "About" },
  { id: "schedule", label: "Hackathon pre-event" },
  { id: "programme", label: "Programme" },
  { id: "components", label: "Components" },
  { id: "attending", label: "Who attends" },
  { id: "recap", label: "2025 recap" },
];

/* Keyed by title (from data/conference.ts's COMPONENTS) rather than baked
   into the data file itself — icon choice is a UI concern, and keeping it
   here means data/conference.ts stays free of JSX/component imports. */
const componentIcons: Record<string, typeof IconMap> = {
  "Geospatial Gallery": IconMap,
  "Use Case Development Showcase": IconPresentation,
  "GATES GeoHack 2026": IconCode,
};

const dotByColor = {
  blue: "bg-gates-blue",
  teal: "bg-gates-teal",
  orange: "bg-gates-orange",
  plum: "bg-gates-plum",
} as const;

/* Split at the lunch break (AGENDA[13]) — the last morning-programme row —
   so the boundary moves with the data instead of a hardcoded index if the
   programme changes again. */
const AGENDA_LUNCH_INDEX = AGENDA.findIndex((item) => item.title === "Lunch Break + Geospatial Gallery Walk");
const AGENDA_GROUPS = [
  {
    label: "Morning programme",
    range: "8:00 AM–1:00 PM",
    color: "blue",
    items: AGENDA.slice(0, AGENDA_LUNCH_INDEX + 1),
  },
  {
    label: "Afternoon programme",
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

  const { d, h, m, s } = useCountdown(CONFERENCE_DATE);
  const countdown = [
    { value: d, label: "DAYS" },
    { value: h, label: "HRS" },
    { value: m, label: "MIN" },
    { value: s, label: "SEC" },
  ];

  return (
    <div className="conference-page min-h-screen">
      <Nav />

      {/* Hero */}
      <header className="conference-hero hero-brand-gradient relative overflow-hidden border-b border-white/8 px-5 sm:px-8">
        <div className="conference-hero-road-bg absolute inset-0 z-0" aria-hidden="true" />
        <div className="conference-hero-grid-bg absolute inset-0 z-0" aria-hidden="true" />
        <div className="relative z-10 max-w-[900px] mx-auto py-14 sm:py-20 text-center flex flex-col items-center">
          <Eyebrow>
            {CONFERENCE.dateLabel} &middot; {CONFERENCE.venueLabel}
          </Eyebrow>
          <h1 className="conference-hero-badge inline-flex items-center m-0 mt-3 px-5 py-2 sm:px-6 sm:py-2.5 rounded-full text-white font-heading font-bold text-base sm:text-xl tracking-[0.01em]">
            2<sup className="text-[0.65em] font-semibold">nd</sup>&nbsp;GATES Program Stakeholder Conference
          </h1>
          <p className="font-display text-[clamp(34px,6.4vw,72px)] font-extrabold m-0 mt-6 sm:mt-7 tracking-[0.01em] uppercase text-glow leading-[1.05]">
            {CONFERENCE.theme}
          </p>
          <p className="text-[17px] sm:text-lg leading-[1.6] text-white/70 m-0 mt-6 sm:mt-7 max-w-[700px]">
            The Program&apos;s second stakeholder conference moves from introducing GATES to showing how it is helping
            agencies and partners co-develop geospatial, data-driven solutions to real problems.
          </p>

          <div
            role="group"
            aria-label="Countdown to the conference"
            className="grid grid-cols-4 gap-2 sm:gap-3 mt-9 sm:mt-10 w-full max-w-[420px]"
          >
            {countdown.map((item) => (
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
              href="#programme"
              className="glass-panel px-[26px] py-3.5 rounded-full text-white/90 font-semibold text-[15px] no-underline text-center"
            >
              View the Programme
            </a>
          </div>

        </div>
      </header>

      <SectionNav items={SECTIONS} />

      {/* About / narrative */}
      <PageSection id="about" labelledBy="about-title">
        <SectionHead eyebrow="ABOUT THE CONFERENCE" title="From achievements to what we build next" titleId="about-title" />
        <div className="flex flex-col gap-5 max-w-[820px] mx-auto text-[16px] sm:text-[17px] leading-[1.7] text-white/68">
          <p className="glass-panel glass-panel-strong conference-about-lead m-0 p-6 sm:p-8 text-white/76">
            The second conference builds on the momentum of the inaugural event by marking the Program&apos;s transition
            from introducing GATES to demonstrating how it is enabling agencies and partners to co-develop geospatial,
            data-driven solutions for real-world challenges. Rather than focusing on Program accomplishments alone, it
            puts emerging use cases, collaborative initiatives, and strategic partnerships at the center.
          </p>
          <p className="m-0">
            Through Program updates, use case presentations, the first GATES GeoHack 2026, and discussions with
            development partners, the conference is a venue to strengthen partnerships, surface new ideas, and chart the
            next phase of the Program together.
          </p>
        </div>
      </PageSection>

      {/* Hackathon pre-event */}
      <PageSection id="schedule" labelledBy="schedule-title" background="grid-color">
        <SectionHead
          eyebrow="HACKATHON PRE-EVENT"
          title="Building toward the conference"
          titleId="schedule-title"
          intro="The Hackathon begins before the main event, preparing finalist teams to bring their strongest ideas to the stakeholder conference on November 10."
        />
        <div className="glass-panel glass-panel-strong max-w-[860px] mx-auto p-6 sm:p-8 grid grid-cols-1 sm:grid-cols-[1fr_auto_1fr] gap-5 sm:gap-7 sm:items-center">
          <div>
            <IconClipboardCheck color="orange" />
            <div className="font-mono text-[10px] uppercase tracking-[0.12em] text-white/45 mb-1">Pre-event</div>
            <h3 className="text-[19px] font-semibold mb-2">{CONFERENCE.hackathonDayLabel}</h3>
            <p className="text-sm leading-[1.6] text-white/62 m-0">
              Finalist teams take part in final coaching and technical judging before presenting their solutions to the
              wider stakeholder community.
            </p>
          </div>
          <div aria-hidden="true" className="hidden sm:flex items-center text-white/30 text-2xl">
            &rarr;
          </div>
          <div>
            <IconCalendar color="blue" />
            <div className="font-mono text-[10px] uppercase tracking-[0.12em] text-white/45 mb-1">Main event</div>
            <h3 className="text-[19px] font-semibold mb-2">{CONFERENCE.conferenceProperLabel}</h3>
            <p className="text-sm leading-[1.6] text-white/62 m-0">
              The stakeholder conference brings everyone together for Program updates, showcases, partnerships,
              Hackathon final pitches, and awarding.
            </p>
          </div>
        </div>
      </PageSection>

      {/* Programme */}
      <PageSection id="programme" labelledBy="programme-title">
        <SectionHead
          eyebrow="PROGRAMME"
          title="Provisional programme"
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
      <PageSection id="components" labelledBy="components-title" width="wide" background="grid-color">
        <SectionHead eyebrow="MAJOR COMPONENTS" title="Three things running alongside the programme" titleId="components-title" />
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

      {/* Participants */}
      <PageSection id="attending" labelledBy="attending-title">
        <SectionHead
          eyebrow="WHO ATTENDS"
          title="Who is in the room"
          titleId="attending-title"
          intro="The conference will bring together participants mainly from DOST offices and attached agencies, alongside other government institutions and development partners."
        />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
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

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="glass-panel program-card p-6 sm:p-7">
            <h3 className="text-[17px] font-semibold mb-3">What happened</h3>
            <p className="text-sm leading-[1.65] text-white/62 m-0">
              Held in a hybrid set-up, the inaugural conference brought DOST&apos;s central and regional offices,
              attached agencies, and external partners together for a day of keynotes and technical sessions. It closed with
              &ldquo;Mapping Shared Commitment&rdquo; &mdash; participants mapping their hometowns live to a shared map.
            </p>
          </div>
          <div className="glass-panel program-card p-6 sm:p-7">
            <h3 className="text-[17px] font-semibold mb-3">Sessions</h3>
            <ul className="list-none m-0 p-0 flex flex-col gap-2">
              {RECAP_2025.sessions.map((session) => (
                <li key={session} className="flex gap-2.5 text-[13px] leading-[1.5] text-white/62">
                  <span aria-hidden="true" className="shrink-0 mt-[6px] w-1.5 h-1.5 rounded-full bg-gates-teal" />
                  <span>{session}</span>
                </li>
              ))}
            </ul>
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
          <PrimaryButton to="/registration">Registration Info</PrimaryButton>
          <SecondaryButton to="/hackathon">Explore the Hackathon</SecondaryButton>
        </div>
      </section>

      <Footer />
    </div>
  );
}
