import { useState, type ChangeEvent, type FormEvent } from "react";
import { Link } from "react-router-dom";
import Nav from "../components/Nav";
import Footer from "../components/Footer";
import {
  Chip,
  Eyebrow,
  IconPin,
  PageSection,
  PrimaryButton,
  SectionHead,
  SectionNav,
  TextLink,
  STICKY_OFFSET,
} from "../components/ui";
import {
  CONDITIONS,
  COVERED_COSTS,
  DATA_RULES,
  DOMAINS,
  ELIGIBLE,
  FINALISTS_ANNOUNCED_DATE,
  FINAL_LIST_LOCKED_DATE,
  GENERAL_RULES,
  HACKATHON,
  IP_RULES,
  OBJECTIVE,
  ORIENTATION_DATE,
  PARTICIPANT_COSTS,
  PHASES,
  PRIZES,
  PRIZE_TIERS,
  PROPOSAL_SECTIONS,
  RESOURCES,
  RUBRICS,
  SUBMISSION_DEADLINE_DATE,
  SUB_OBJECTIVES,
  TEAM_RULES,
  TIMELINE,
} from "../data/hackathon";
import { usePageMeta } from "../hooks/usePageMeta";
import { submitHackathonEntry } from "../lib/api";
import { CONFERENCE, CONFERENCE_DATE, HACKATHON_DAY_DATE } from "../data/conference";
import handLeft from "../assets/hero/hand-left.webp";
import handRight from "../assets/hero/hand-right.webp";
import keyboard from "../assets/hero/keyboard.webp";
import domainHealth from "../assets/icons/hands-heart-people.webp";
import domainDisaster from "../assets/icons/warning-cracked-ground.webp";
import domainEnvironment from "../assets/icons/plant-hand.webp";
import domainKnowledge from "../assets/icons/head-lightbulb.webp";
import domainInfrastructure from "../assets/icons/crane-construction.webp";
import domainNaturalResources from "../assets/icons/globe-pin.webp";

// Maps 1:1 to DOMAINS (client/src/data/hackathon.ts), same order — keep the
// two in sync if the domain list ever changes.
const DOMAIN_ICONS = [
  domainHealth,
  domainDisaster,
  domainEnvironment,
  domainKnowledge,
  domainInfrastructure,
  domainNaturalResources,
];

const SECTIONS = [
  { id: "objective", label: "Objective" },
  { id: "eligibility", label: "Who can join" },
  { id: "phases", label: "How it works" },
  { id: "timeline", label: "Timeline" },
  { id: "scoring", label: "Scoring" },
  { id: "support", label: "What you get" },
  { id: "rules", label: "Rules" },
  { id: "submit", label: "Submit" },
];

const inputClass =
  "w-full px-3.5 py-3 rounded-xl border border-white/16 bg-white/5 text-white/94 text-[15px] font-sans focus:outline-none focus:ring-2 focus:ring-gates-orange focus:border-gates-orange";

const labelClass = "font-heading text-[12px] font-semibold text-white/62";

// On Windows, <select> popups are drawn by the OS's own combo-box control,
// which doesn't reliably pick up `color-scheme: dark` the way macOS/Linux
// Chrome does — the popup renders with light-theme colors regardless,
// unreadable against this site's dark theme. Explicit colors on each
// <option> are respected everywhere color-scheme alone isn't.
const optionStyle = { backgroundColor: "#08090b", color: "#ededf0" };

const rubricAccent = {
  blue: "bg-gates-blue",
  orange: "bg-gates-orange",
  teal: "bg-gates-teal",
  plum: "bg-gates-plum",
} as const;

// Tinted card background/border per tier color — kept as full static class
// strings (not built with template interpolation) since Tailwind's compiler
// only picks up classes it can see written out in full.
const tierCardAccent = {
  blue: "bg-gates-blue/10 border-gates-blue/25",
  orange: "bg-gates-orange/10 border-gates-orange/25",
  teal: "bg-gates-teal/10 border-gates-teal/25",
} as const;

const TIMELINE_GROUPS = [
  {
    number: "01",
    title: "Apply",
    window: "August 27 – September 30",
    color: "orange",
    entries: TIMELINE.slice(0, 7),
  },
  {
    number: "02",
    title: "Build",
    window: "October 7 – November 8",
    color: "teal",
    entries: TIMELINE.slice(7, 10),
  },
  {
    number: "03",
    title: "Finals",
    window: "November 9–10",
    color: "plum",
    entries: TIMELINE.slice(10),
  },
] as const;

const RULE_SECTIONS = [
  {
    number: "01",
    title: "General rules",
    intro: "Development, attribution, conduct, and final decisions.",
    color: "orange",
    rules: GENERAL_RULES,
  },
  {
    number: "02",
    title: "Intellectual property",
    intro: "How attribution, use, adaptation, and scaling are handled.",
    color: "plum",
    rules: IP_RULES,
  },
  {
    number: "03",
    title: "Data governance and privacy",
    intro: "Authorized data, sandbox access, and privacy requirements.",
    color: "blue",
    rules: DATA_RULES,
  },
] as const;

const EMPTY_FORM = {
  team: "",
  title: "",
  domain: "",
  agency: "",
  leaderName: "",
  leaderPosition: "",
  leaderEmail: "",
  leaderMobile: "",
  members: "",
};

/** "September 25, 2026" -> "Sep 25" — same abbreviation the hero fact tiles already use, generalized past just September since NEXT_MILESTONES spans August through November. */
function abbreviateDate(label: string): string {
  return label
    .replace(", 2026", "")
    .replace("September", "Sep")
    .replace("October", "Oct")
    .replace("November", "Nov")
    .replace("August", "Aug");
}

/**
 * Every checkpoint after the submission deadline that's worth surfacing as
 * "what's next" (hero stat tile, bottom CTA, closed-submissions panel —
 * see `nextMilestone` in the component below), each anchored to a real
 * Date so those spots advance on their own as the hackathon proceeds —
 * announcement, then confirmation lock, then orientation, then the
 * hackathon day, then the conference itself — instead of needing a manual
 * edit every time one date passes (which is what prompted this: it used to
 * be hardcoded to "Finalists announced" forever, even after that date).
 * Mirrors data/conference.ts's TIMELINE, just reduced to single-point
 * dates and phrased for a one-line "next up" display rather than a full
 * schedule.
 */
const NEXT_MILESTONES = [
  {
    when: FINALISTS_ANNOUNCED_DATE,
    label: "Finalists announced",
    dateLabel: HACKATHON.finalistsAnnouncedLabel,
  },
  {
    when: FINAL_LIST_LOCKED_DATE,
    label: "Final list locked",
    dateLabel: "September 30, 2026",
  },
  {
    when: ORIENTATION_DATE,
    label: "Orientation and capacity building",
    dateLabel: "October 7, 2026",
  },
  {
    when: HACKATHON_DAY_DATE,
    label: "Final coaching and technical judging",
    dateLabel: CONFERENCE.hackathonDayLabel.replace(/^\w+, /, ""),
  },
  {
    when: CONFERENCE_DATE,
    label: "Final pitches, judging, and awarding",
    dateLabel: CONFERENCE.conferenceProperLabel.replace(/^\w+, /, ""),
  },
] as const;

export default function Hackathon() {
  // Recomputed on every render (like Home's own MILESTONES filter) rather
  // than once at module load, so this flips over to "closed" copy the
  // moment a visitor's clock crosses the deadline without needing a
  // deploy — nothing here needs second-level precision, just per-visit
  // freshness.
  const submissionsClosed = Date.now() >= SUBMISSION_DEADLINE_DATE.getTime();
  // Same idea, one step further: whichever NEXT_MILESTONES entry hasn't
  // happened yet. Falls back to the last one (the conference itself) once
  // everything has passed, so this never has nothing to show.
  const nextMilestone = NEXT_MILESTONES.find((m) => m.when.getTime() >= Date.now()) ?? NEXT_MILESTONES[NEXT_MILESTONES.length - 1];

  usePageMeta(
    `${HACKATHON.name} — Official Mechanics`,
    submissionsClosed
      ? `${HACKATHON.name}: proposal submissions are closed. Next up: ${nextMilestone.label}, ${nextMilestone.dateLabel}, ahead of the ${CONFERENCE.edition}.`
      : `${HACKATHON.name}: build geospatial solutions on the GATES Lakehouse. Proposals are due by ${HACKATHON.submissionDeadlineLabel}. Open to DOST attached agencies, regional offices, PSTOs, and DOST-SEI scholars.`,
  );

  // Split "11:59 PM on September 20, 2026" so the CTA banner below can force
  // a line break before the date — without it, the date wraps wherever the
  // viewport happens to cut it off, sometimes splitting "September" from
  // "20, 2026" mid-phrase.
  const [deadlineTime, deadlineDate] = HACKATHON.submissionDeadlineLabel.split(" on ");

  const [form, setForm] = useState(EMPTY_FORM);
  const [file, setFile] = useState<File | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [consent, setConsent] = useState(false);
  const [documentationConsent, setDocumentationConsent] = useState(false);
  const [memberConsentAttested, setMemberConsentAttested] = useState(false);

  const setField =
    (key: keyof typeof form) => (event: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
      setForm((state) => ({ ...state, [key]: event.target.value }));
      if (error) setError("");
    };

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const selected = event.target.files?.[0] ?? null;
    if (selected && selected.type !== "application/pdf" && !selected.name.toLowerCase().endsWith(".pdf")) {
      setFile(null);
      setError("Please attach the completed proposal as a PDF.");
      event.target.value = "";
      return;
    }
    setFile(selected);
    setError("");
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!form.team.trim() || !form.title.trim()) {
      setError("Please enter a team name and project title.");
      return;
    }
    if (!form.leaderName.trim() || !form.leaderEmail.trim()) {
      setError("Please enter the team leader's name and email address — they are the official point of contact.");
      return;
    }
    if (!form.domain) {
      setError("Please select the priority innovation domain your proposal addresses.");
      return;
    }
    if (!file) {
      setError("Please attach your completed proposal PDF.");
      return;
    }
    if (!consent) {
      setError("You must consent to data processing to submit a proposal — see the privacy notice.");
      return;
    }
    if (!memberConsentAttested) {
      setError("Please confirm that each named member has been informed their details are being submitted.");
      return;
    }
    setSubmitting(true);
    setError("");
    try {
      await submitHackathonEntry({ ...form, file, consent, documentationConsent, memberConsentAttested });
      setSubmitted(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="hackathon-page min-h-screen">
      <Nav />

      {/* Hero */}
      <header className="hackathon-hero hackathon-hero-bg relative overflow-hidden border-b border-white/8 px-5 sm:px-8">
        <div className="road-network-bg absolute inset-0 z-0" aria-hidden="true" />
        <div className="relative z-10 max-w-[880px] mx-auto py-14 sm:py-20 text-center flex flex-col gap-[18px] items-center">
          {/* callForParticipantsLabel drives the start date directly (this
              used to be hand-typed as "August 24", which had drifted from
              the data file's real "August 27" — see hackathon.ts's own
              header comment on that slip). Phase label flips to closed once
              past SUBMISSION_DEADLINE_DATE. */}
          <Eyebrow>
            {HACKATHON.callForParticipantsLabel.replace(", 2026", "").toUpperCase()}&ndash;NOVEMBER 10, 2026 &middot;{" "}
            {submissionsClosed ? "SUBMISSIONS CLOSED" : "OPEN CALL TO FINALS"}
          </Eyebrow>
          <h1 className="font-display text-[clamp(34px,5.6vw,62px)] font-extrabold m-0 tracking-[0.01em] uppercase text-glow-orange">
            {HACKATHON.name}
          </h1>
          <p className="font-heading text-xs font-bold tracking-[0.14em] uppercase text-white/60 m-0">
            {HACKATHON.theme}
          </p>
          <p className="text-[17px] sm:text-lg leading-[1.6] text-white/70 m-0 max-w-[680px]">
            Build geospatial solutions on the GATES Lakehouse that fix real operational pain points across the DOST
            system &mdash; then pitch them at the {CONFERENCE.edition}.
          </p>

          {/* Hands flank the keyboard art — a relative wrapper, in-flow like
              any other piece of copy (see the keyboard comment above), so
              the fact grid below is still pushed down to make real room for
              it. The hand cells inside are absolute (no in-flow content of
              their own), so the wrapper's height is just the keyboard's own
              rendered height, and the hands center on that via top:50% in
              .hackathon-hero-hand. Horizontal position is tied directly to
              the keyboard's own edge (see .hackathon-hero-hand-left/-right
              in index.css), so it tracks the keyboard's clamp()-resolved
              width rather than any fixed reference point. */}
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
          {/* relative z-[3]: the hands (z-[2], see .hackathon-hero-hand)
              geometrically overlap this row at several viewport widths by
              design — their position is fixed relative to the keyboard, not
              this grid — so this wins the stacking order instead, keeping
              the fact text fully legible wherever the two overlap. */}
          <div className="hackathon-hero-facts relative z-[3] grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 mt-1 w-full max-w-[680px]">
            {[
              {
                value: HACKATHON.callForParticipantsLabel.replace("August", "Aug").replace(", 2026", ""),
                label: "Call opens",
              },
              submissionsClosed
                ? { value: abbreviateDate(nextMilestone.dateLabel), label: nextMilestone.label }
                : { value: HACKATHON.submissionDeadlineShort.replace("September", "Sep"), label: "Proposals due · 11:59 PM" },
              { value: `${HACKATHON.maxFinalistTeams}`, label: "Finalist teams" },
              { value: `${HACKATHON.teamSize}`, label: "Members per team" },
            ].map((fact) => (
              <div
                key={fact.label}
                className="hackathon-hero-fact glass-panel px-3 sm:px-4 py-4 text-center"
              >
                <div className="font-heading text-[19px] sm:text-[22px] font-bold leading-none text-white/92">
                  {fact.value}
                </div>
                <div className="text-[10px] sm:text-[11px] leading-[1.35] text-white/52 mt-2">{fact.label}</div>
              </div>
            ))}
          </div>

          {/* Same reasoning as the fact grid above: relative z-[3] so these
              buttons stay fully visible/legible over the hands (z-[2])
              wherever the hands' fixed-to-the-keyboard position happens to
              reach this low. */}
          <div className="relative z-[3] flex flex-col min-[420px]:flex-row gap-3 mt-1 w-full min-[420px]:w-auto">
            <a
              href="#submit"
              className="btn-hackathon px-[26px] py-3.5 rounded-full text-white font-bold text-[15px] no-underline text-center"
            >
              {submissionsClosed ? "Submission Status" : "Submit a Proposal"}
            </a>
            <PrimaryButton to="/conference">See the Conference</PrimaryButton>
          </div>
        </div>
      </header>

      <SectionNav items={SECTIONS} />

      {/* Objective */}
      <PageSection id="objective" labelledBy="objective-title">
        <SectionHead eyebrow="OBJECTIVE" title="What we're asking you to build" titleId="objective-title" />
        <p className="glass-panel glass-panel-strong hackathon-objective-lead m-0 p-6 sm:p-8 max-w-[820px] mx-auto text-[16px] sm:text-[17px] leading-[1.7] text-white/76">
          {OBJECTIVE}
        </p>

        <ul className="grid grid-cols-1 sm:grid-cols-2 gap-4 list-none mt-6 mb-0 p-0">
          {SUB_OBJECTIVES.map((objective, index) => (
            <li
              key={objective}
              className="glass-panel program-card p-5 sm:p-6 flex items-start gap-4 text-sm leading-[1.6] text-white/65"
            >
              <span className="shrink-0 font-mono text-[11px] text-gates-orange/80 mt-0.5">
                {String(index + 1).padStart(2, "0")}
              </span>
              <span>{objective}</span>
            </li>
          ))}
        </ul>

        <div className="mt-9">
          <p className="text-center font-heading font-semibold text-[11px] uppercase tracking-[0.12em] text-white/48 mb-4">
            Your solution must address a pain point in at least one priority innovation domain
          </p>
          <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 list-none m-0 p-0">
            {DOMAINS.map((domain, index) => (
              <li key={domain}>
                <Chip color={(["blue", "teal", "orange", "plum"] as const)[index % 4]} icon={DOMAIN_ICONS[index]}>
                  {domain}
                </Chip>
              </li>
            ))}
          </ul>
        </div>
      </PageSection>

      {/* Eligibility & teams */}
      <PageSection id="eligibility" labelledBy="eligibility-title" width="wide" background="road-network">
        <SectionHead eyebrow="WHO CAN JOIN" title="Eligibility and team composition" titleId="eligibility-title" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="glass-panel program-card p-6 sm:p-7">
            <IconPin color="teal" />
            <h3 className="text-[19px] font-semibold mb-3">Open to</h3>
            <ul className="list-none m-0 p-0 flex flex-col gap-2.5">
              {ELIGIBLE.map((item) => (
                <li key={item} className="flex gap-2.5 text-sm leading-[1.55] text-white/68">
                  <span aria-hidden="true" className="shrink-0 mt-[7px] w-1.5 h-1.5 rounded-full bg-gates-teal" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
            <h4 className="font-heading text-[12px] font-semibold uppercase tracking-[0.1em] text-white/45 mt-6 mb-3">
              Conditions
            </h4>
            <ul className="list-none m-0 p-0 flex flex-col gap-2.5">
              {CONDITIONS.map((item) => (
                <li key={item} className="flex gap-2.5 text-[13px] leading-[1.55] text-white/58">
                  <span aria-hidden="true" className="shrink-0 mt-[7px] w-1.5 h-1.5 rounded-full bg-white/25" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="glass-panel program-card p-6 sm:p-7">
            <IconPin color="orange" />
            <h3 className="text-[19px] font-semibold mb-3">Team composition</h3>
            <ul className="list-none m-0 p-0 flex flex-col gap-2.5">
              {TEAM_RULES.map((item) => (
                <li key={item} className="flex gap-2.5 text-sm leading-[1.55] text-white/68">
                  <span aria-hidden="true" className="shrink-0 mt-[7px] w-1.5 h-1.5 rounded-full bg-gates-orange" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </PageSection>

      {/* Phases */}
      <PageSection id="phases" labelledBy="phases-title" width="wide">
        <SectionHead eyebrow="HOW IT WORKS" title="Two phases" titleId="phases-title" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {PHASES.map((phase) => (
            <div key={phase.number} className="glass-panel program-card p-6 sm:p-8 h-full">
              <div className="flex items-start gap-4 mb-4">
                <span
                  aria-hidden="true"
                  className={`shrink-0 grid place-items-center w-11 h-11 rounded-[14px] font-mono text-lg font-bold text-white ${rubricAccent[phase.color]}`}
                >
                  {phase.number}
                </span>
                <div>
                  <div className="font-heading text-[10px] uppercase tracking-[0.12em] text-white/45">
                    {phase.window}
                  </div>
                  <h3 className="text-[20px] font-semibold m-0 leading-tight">{phase.title}</h3>
                </div>
              </div>
              <ol className="list-none m-0 p-0 flex flex-col gap-3">
                {phase.steps.map((step, index) => (
                  <li key={step} className="flex gap-3 text-sm leading-[1.6] text-white/65">
                    <span className="shrink-0 font-mono text-[11px] text-white/35 mt-[3px]">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <span>{step}</span>
                  </li>
                ))}
              </ol>
            </div>
          ))}
        </div>
      </PageSection>

      {/* Timeline */}
      <PageSection id="timeline" labelledBy="timeline-title" background="road-network">
        <SectionHead
          eyebrow="TIMELINE"
          title="From proposal to final pitch"
          titleId="timeline-title"
          intro="Three stages take teams from the call for participants through development, judging, and awarding."
        />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-start">
          {TIMELINE_GROUPS.map((group) => (
            <article key={group.title} className="glass-panel overflow-hidden">
              <div className="relative p-5 sm:p-6 border-b border-white/10">
                <span aria-hidden="true" className={`absolute inset-x-0 top-0 h-1 ${rubricAccent[group.color]}`} />
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="font-heading text-[10px] font-semibold uppercase tracking-[0.12em] text-white/42">
                      Stage {group.number}
                    </div>
                    <h3 className="text-xl font-semibold m-0 mt-1">{group.title}</h3>
                  </div>
                  <span className="font-mono text-[10px] leading-[1.3] text-right text-white/48 max-w-[118px]">
                    {group.window}
                  </span>
                </div>
              </div>
              <ol className="list-none m-0 p-0 divide-y divide-white/8">
                {group.entries.map((entry) => (
                  <li key={entry.date} className="conference-programme-row px-5 sm:px-6 py-4">
                    <div className="font-mono text-[10px] text-white/48 mb-1.5">{entry.date}</div>
                    <div className="text-sm leading-[1.5] text-white/76">{entry.milestone}</div>
                  </li>
                ))}
              </ol>
            </article>
          ))}
        </div>
      </PageSection>

      {/* Scoring */}
      <PageSection id="scoring" labelledBy="scoring-title" width="wide">
        <SectionHead
          eyebrow="SCORING"
          title="How entries advance"
          titleId="scoring-title"
          intro="The proposal-screening rubric is published in full. Detailed finalist judging rubrics will be shared directly with the teams that advance."
        />
        <div className="flex flex-col gap-4">
          <div className="glass-panel program-card relative overflow-hidden p-6 sm:p-7">
            <span aria-hidden="true" className={`absolute inset-x-0 top-0 h-1 ${rubricAccent[RUBRICS[0].color]}`} />
            <div className="flex flex-wrap items-baseline justify-between gap-3 mb-2">
              <h3 className="text-[19px] font-semibold m-0">{RUBRICS[0].title}</h3>
              <span className="font-heading text-[11px] font-semibold uppercase tracking-[0.1em] text-white/55">
                {RUBRICS[0].share}
              </span>
            </div>
            <p className="text-[13px] leading-[1.6] text-white/52 m-0 mb-5">{RUBRICS[0].panel}</p>
            <ul className="list-none m-0 p-0 flex flex-col gap-3">
              {RUBRICS[0].criteria.map((criterion) => (
                <li
                  key={criterion.name}
                  className="grid grid-cols-[52px_minmax(0,1fr)] gap-3 sm:gap-5 border-t border-white/8 pt-3"
                >
                  <span className="font-mono text-[13px] text-white/75">{criterion.weight}</span>
                  <span>
                    <span className="block text-sm font-semibold text-white/82 mb-1">{criterion.name}</span>
                    <span aria-hidden="true" className="block h-1 rounded-full bg-white/8 overflow-hidden mb-2">
                      <span
                        className={`block h-full rounded-full ${rubricAccent[RUBRICS[0].color]}`}
                        style={{ width: criterion.weight }}
                      />
                    </span>
                    <span className="block text-[13px] leading-[1.6] text-white/58">{criterion.detail}</span>
                  </span>
                </li>
              ))}
            </ul>
          </div>

          <div className="glass-panel glass-panel-strong relative overflow-hidden p-6 sm:p-7">
            <span aria-hidden="true" className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-gates-teal to-gates-plum" />
            <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
              <div>
                <div className="font-mono text-[10px] uppercase tracking-[0.12em] text-white/45 mb-1">Phase 2 preview</div>
                <h3 className="text-[19px] font-semibold m-0">Finalist judging</h3>
              </div>
              <span className="rounded-full border border-white/12 bg-white/6 px-3 py-1.5 font-heading text-[10px] font-semibold uppercase tracking-[0.08em] text-white/60">
                Detailed rubrics for finalists
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-4 sm:p-5">
                <span className="font-mono text-[10px] uppercase tracking-[0.1em] text-gates-teal">November 9</span>
                <h4 className="text-[15px] font-semibold mt-2 mb-1.5">Technical judging</h4>
                <p className="text-[13px] leading-[1.6] text-white/58 m-0">
                  Teams demonstrate their working solution, explain its technical implementation, and respond to the
                  technical panel.
                </p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-4 sm:p-5">
                <span className="font-mono text-[10px] uppercase tracking-[0.1em] text-gates-plum">November 10</span>
                <h4 className="text-[15px] font-semibold mt-2 mb-1.5">Final conference pitch</h4>
                <p className="text-[13px] leading-[1.6] text-white/58 m-0">
                  Teams present an improved pitch to the executive panel and stakeholder conference audience before
                  awarding.
                </p>
              </div>
            </div>
          </div>
        </div>
      </PageSection>

      {/* Support & logistics */}
      <PageSection id="support" labelledBy="support-title" width="wide" background="road-network">
        <SectionHead eyebrow="WHAT YOU GET" title="Resources and cost coverage" titleId="support-title" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="glass-panel program-card p-6 sm:p-7 lg:col-span-1">
            <IconPin color="blue" />
            <h3 className="text-[18px] font-semibold mb-3">Provided to finalists</h3>
            <ul className="list-none m-0 p-0 flex flex-col gap-2.5">
              {RESOURCES.map((item) => (
                <li key={item} className="flex gap-2.5 text-[13px] leading-[1.55] text-white/65">
                  <span aria-hidden="true" className="shrink-0 mt-[6px] w-1.5 h-1.5 rounded-full bg-gates-blue" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="glass-panel program-card p-6 sm:p-7">
            <IconPin color="teal" />
            <h3 className="text-[18px] font-semibold mb-3">The Program covers</h3>
            <ul className="list-none m-0 p-0 flex flex-col gap-2.5">
              {COVERED_COSTS.map((item) => (
                <li key={item} className="flex gap-2.5 text-[13px] leading-[1.55] text-white/65">
                  <span aria-hidden="true" className="shrink-0 mt-[6px] w-1.5 h-1.5 rounded-full bg-gates-teal" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="glass-panel program-card p-6 sm:p-7">
            <IconPin color="orange" />
            <h3 className="text-[18px] font-semibold mb-3">You or your agency covers</h3>
            <ul className="list-none m-0 p-0 flex flex-col gap-2.5">
              {PARTICIPANT_COSTS.map((item) => (
                <li key={item} className="flex gap-2.5 text-[13px] leading-[1.55] text-white/65">
                  <span aria-hidden="true" className="shrink-0 mt-[6px] w-1.5 h-1.5 rounded-full bg-gates-orange" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
            <p className="text-[12px] leading-[1.6] text-white/45 mt-4 mb-0">
              Process travel authority and agency endorsements early, using the milestone dates above.
            </p>
            <p className="text-[12px] leading-[1.6] text-white/45 mt-2 mb-0">
              For DOST-SEI scholar finalists: DOST-SEI covers airfare and incidental expenses, on
              top of the accommodation and meals the Program provides during the finals.
            </p>
          </div>
        </div>

        <div className="glass-panel program-card p-6 sm:p-7 mt-4">
          <IconPin color="plum" />
          <h3 className="text-[18px] font-semibold mb-3">What awaits the winners</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
            {PRIZE_TIERS.map((tier, index) => (
              <div key={tier.place} className={`rounded-2xl border p-5 ${tierCardAccent[tier.color]}`}>
                <div className="flex items-center gap-3 mb-3">
                  <span
                    aria-hidden="true"
                    className={`shrink-0 grid place-items-center w-10 h-10 rounded-full font-mono text-base font-bold text-white ${rubricAccent[tier.color]}`}
                  >
                    {index + 1}
                  </span>
                  <span className="font-heading text-[12px] font-semibold uppercase tracking-[0.1em] text-white/70">
                    {tier.place}
                  </span>
                </div>
                <div className="text-[28px] font-bold leading-none tracking-tight">{tier.amount}</div>
              </div>
            ))}
          </div>
          <p className="text-[13px] leading-[1.55] text-white/65 m-0">
            Each winning team also receives a trophy, medals, and certificates for all team members.
          </p>
          <ul className="list-none m-0 p-0 flex flex-col gap-2.5 mt-3">
            {PRIZES.map((item) => (
              <li key={item} className="flex gap-2.5 text-[13px] leading-[1.55] text-white/65">
                <span aria-hidden="true" className="shrink-0 mt-[6px] w-1.5 h-1.5 rounded-full bg-gates-plum" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </PageSection>

      {/* Rules */}
      <PageSection id="rules" labelledBy="rules-title" width="wide">
        <SectionHead
          eyebrow="RULES"
          title="Rules, IP, and data governance"
          titleId="rules-title"
          intro="Choose a topic to review the requirements that apply to every participating team."
        />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-start">
          {RULE_SECTIONS.map((section, index) => (
            <details
              key={section.title}
              className="group hackathon-rule-card glass-panel program-card relative overflow-hidden p-5 sm:p-6"
              open={index === 0}
            >
              <span aria-hidden="true" className={`absolute inset-x-0 top-0 h-1 ${rubricAccent[section.color]}`} />
              <summary className="cursor-pointer list-none rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-[10px] text-white/38">{section.number}</span>
                    <span className="font-heading text-[15px] font-semibold text-white/85">{section.title}</span>
                  </div>
                  <span
                    aria-hidden="true"
                    className="grid place-items-center shrink-0 w-7 h-7 rounded-full bg-white/7 text-white/60 transition-transform group-open:rotate-180"
                  >
                    ↓
                  </span>
                </div>
                <p className="text-[12px] leading-[1.55] text-white/48 mt-3 mb-0 pr-8">{section.intro}</p>
                <span className="inline-flex mt-3 rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 font-mono text-[9px] uppercase tracking-[0.08em] text-white/45">
                  {section.rules.length} requirements
                </span>
              </summary>
              <ul className="list-none m-0 p-0 pt-5 mt-5 border-t border-white/8 flex flex-col gap-3">
                {section.rules.map((rule) => (
                  <li key={rule} className="flex gap-2.5 text-[13px] leading-[1.6] text-white/62">
                    <span
                      aria-hidden="true"
                      className={`shrink-0 mt-[7px] w-1.5 h-1.5 rounded-full ${rubricAccent[section.color]}`}
                    />
                    <span>{rule}</span>
                  </li>
                ))}
              </ul>
            </details>
          ))}
        </div>
      </PageSection>

      {/* Submission */}
      <PageSection id="submit" labelledBy="submit-title" width="wide" background="road-network">
        <SectionHead
          eyebrow={submissionsClosed ? "SUBMISSIONS CLOSED" : "SUBMIT YOUR PROPOSAL"}
          title={submissionsClosed ? "The submission window has closed" : "One proposal per team"}
          titleId="submit-title"
          intro={
            submissionsClosed
              ? `Submissions closed at ${HACKATHON.submissionDeadlineLabel}. Next up: ${nextMilestone.label}, ${nextMilestone.dateLabel}.`
              : `Submit by ${HACKATHON.submissionDeadlineLabel}. Proposals must be PDF files of no more than ${HACKATHON.proposalMaxPages} pages and under ${HACKATHON.proposalMaxSizeMB}MB.`
          }
        />

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 items-start">
          {/* What the proposal must contain */}
          <div className="lg:col-span-2 glass-panel program-card p-6 sm:p-7">
            <h3 className="text-[17px] font-semibold mb-1">What the proposal covers</h3>
            <p className="font-mono text-[11px] text-white/45 mb-4 break-all">
              {HACKATHON.proposalFilenamePattern}
            </p>
            <ol className="list-none m-0 p-0 flex flex-col gap-3">
              {PROPOSAL_SECTIONS.map((section, index) => (
                <li key={section.title} className="flex gap-3">
                  <span className="shrink-0 font-mono text-[11px] text-white/35 mt-[3px]">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <span>
                    <span className="block text-sm font-semibold text-white/80">{section.title}</span>
                    <span className="block text-[12px] leading-[1.55] text-white/52 mt-0.5">{section.detail}</span>
                  </span>
                </li>
              ))}
            </ol>
            {!submissionsClosed && (
              <a
                href="/templates/GATESGeoHack2026_Proposal_Template.docx"
                download
                className="btn-hackathon inline-flex w-full sm:w-auto justify-center px-[22px] py-3 rounded-full text-white font-semibold text-sm text-center no-underline mt-6"
              >
                &#8595; Download proposal template (.docx)
              </a>
            )}
          </div>

          {/* Form */}
          <div className="lg:col-span-3">
            {submitted ? (
              <div className="glass-panel p-6 sm:p-10 flex flex-col gap-2.5 items-start">
                <IconPin color="teal" />
                <h3 className="text-xl font-semibold m-0">Proposal received, {form.team}.</h3>
                <p className="text-sm leading-[1.6] text-white/62 m-0">
                  &ldquo;{form.title}&rdquo; is in. We&apos;ve sent a confirmation to {form.leaderEmail}. Screening runs
                  September 21&ndash;24, and finalists are announced {HACKATHON.finalistsAnnouncedLabel}.
                </p>
                <p className="text-[13px] leading-[1.6] text-white/50 m-0 mt-1">
                  If your agency endorsement isn&apos;t in progress yet, start it now &mdash; finalists need it to
                  confirm by September 29.
                </p>
                <div className="mt-1.5">
                  <TextLink to="/conference">See the conference programme &rarr;</TextLink>
                </div>
              </div>
            ) : submissionsClosed ? (
              <div className="glass-panel p-6 sm:p-10 flex flex-col gap-2.5 items-start">
                <IconPin color="orange" />
                <h3 className="text-xl font-semibold m-0">Submissions are closed.</h3>
                <p className="text-sm leading-[1.6] text-white/62 m-0">
                  The proposal window closed at {deadlineTime} on {deadlineDate}. Next up: {nextMilestone.label},{" "}
                  {nextMilestone.dateLabel}.
                </p>
                <div className="mt-1.5">
                  <TextLink to="/conference">See the conference programme &rarr;</TextLink>
                </div>
              </div>
            ) : (
              <form className="glass-panel p-6 sm:p-8 flex flex-col gap-5" onSubmit={handleSubmit} noValidate>
                <div className="flex items-center justify-between gap-4 pb-4 border-b border-white/10">
                  <span className="font-heading text-base font-semibold text-white/88">Proposal submission form</span>
                  <span className="text-[11px] text-white/45">
                    <span className="text-gates-orange">*</span> Required
                  </span>
                </div>
                <fieldset className="border-0 m-0 p-0 flex flex-col gap-4">
                  <legend className="font-heading text-[11px] font-semibold uppercase tracking-[0.12em] text-white/48 mb-1">
                    <span className="text-gates-orange mr-2">01</span>The team
                  </legend>
                  <div className="flex flex-col gap-2">
                    <label className={labelClass} htmlFor="team">
                      Team name <span className="text-gates-orange">*</span>
                    </label>
                    <input
                      id="team"
                      className={inputClass}
                      type="text"
                      value={form.team}
                      onChange={setField("team")}
                      autoComplete="organization"
                      required
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className={labelClass} htmlFor="agency">
                      Agency, regional office, or PSTO
                    </label>
                    <input
                      id="agency"
                      className={inputClass}
                      type="text"
                      value={form.agency}
                      onChange={setField("agency")}
                      autoComplete="organization"
                      placeholder="List each member's office if the team is cross-agency"
                    />
                    <p className="text-[12px] leading-[1.5] text-white/45 m-0">
                      For DOST-SEI scholars, enter &ldquo;DOST-SEI&rdquo; as the agency or office.
                    </p>
                  </div>
                </fieldset>

                <fieldset className="border-0 m-0 p-0 flex flex-col gap-4 border-t border-white/8 pt-5">
                  <legend className="font-heading text-[11px] font-semibold uppercase tracking-[0.12em] text-white/48 mb-1">
                    <span className="text-gates-orange mr-2">02</span>Team leader &mdash; official point of contact
                  </legend>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="flex flex-col gap-2">
                      <label className={labelClass} htmlFor="leaderName">
                        Full name <span className="text-gates-orange">*</span>
                      </label>
                      <input
                        id="leaderName"
                        className={inputClass}
                        type="text"
                        value={form.leaderName}
                        onChange={setField("leaderName")}
                        autoComplete="name"
                        required
                      />
                    </div>
                    <div className="flex flex-col gap-2">
                      <label className={labelClass} htmlFor="leaderPosition">
                        Position
                      </label>
                      <input
                        id="leaderPosition"
                        className={inputClass}
                        type="text"
                        value={form.leaderPosition}
                        onChange={setField("leaderPosition")}
                        autoComplete="organization-title"
                      />
                    </div>
                    <div className="flex flex-col gap-2">
                      <label className={labelClass} htmlFor="leaderEmail">
                        Email <span className="text-gates-orange">*</span>
                      </label>
                      <input
                        id="leaderEmail"
                        className={inputClass}
                        type="email"
                        value={form.leaderEmail}
                        onChange={setField("leaderEmail")}
                        autoComplete="email"
                        required
                      />
                    </div>
                    <div className="flex flex-col gap-2">
                      <label className={labelClass} htmlFor="leaderMobile">
                        Mobile
                      </label>
                      <input
                        id="leaderMobile"
                        className={inputClass}
                        type="tel"
                        value={form.leaderMobile}
                        onChange={setField("leaderMobile")}
                        autoComplete="tel"
                      />
                    </div>
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className={labelClass} htmlFor="members">
                      Members 2&ndash;4
                    </label>
                    <textarea
                      id="members"
                      className={`${inputClass} min-h-[92px] resize-y`}
                      value={form.members}
                      onChange={setField("members")}
                      placeholder={"One per line: Name — position — role in team"}
                    />
                    <p className="text-[12px] leading-[1.5] text-white/45 m-0">
                      Teams are exactly {HACKATHON.teamSize} members. Mix a domain owner, a developer, a data or GIS
                      specialist, and a presenter or analyst.
                    </p>
                  </div>
                </fieldset>

                <fieldset className="border-0 m-0 p-0 flex flex-col gap-4 border-t border-white/8 pt-5">
                  <legend className="font-heading text-[11px] font-semibold uppercase tracking-[0.12em] text-white/48 mb-1">
                    <span className="text-gates-orange mr-2">03</span>The proposal
                  </legend>
                  <div className="flex flex-col gap-2">
                    <label className={labelClass} htmlFor="title">
                      Project title <span className="text-gates-orange">*</span>
                    </label>
                    <input id="title" className={inputClass} type="text" value={form.title} onChange={setField("title")} required />
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className={labelClass} htmlFor="domain">
                      Priority innovation domain <span className="text-gates-orange">*</span>
                    </label>
                    <select
                      id="domain"
                      className={inputClass}
                      style={{ colorScheme: "dark" }}
                      value={form.domain}
                      onChange={setField("domain")}
                      required
                    >
                      <option value="" style={optionStyle}>
                        Select one…
                      </option>
                      {DOMAINS.map((domain) => (
                        <option key={domain} value={domain} style={optionStyle}>
                          {domain}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className={labelClass} htmlFor="proposal">
                      Completed proposal &mdash; PDF, max {HACKATHON.proposalMaxPages} pages, under{" "}
                      {HACKATHON.proposalMaxSizeMB}MB <span className="text-gates-orange">*</span>
                    </label>
                    <input
                      id="proposal"
                      className={inputClass}
                      type="file"
                      accept=".pdf"
                      onChange={handleFileChange}
                      aria-describedby="proposal-file-help"
                      required
                    />
                    <p id="proposal-file-help" className="font-mono text-[11px] text-white/45 m-0 break-all">
                      {file ? `Selected: ${file.name}` : `Filename: ${HACKATHON.proposalFilenamePattern}`}
                    </p>
                  </div>
                </fieldset>

                <fieldset className="border-0 m-0 p-0 flex flex-col gap-3.5 border-t border-white/8 pt-5">
                  <legend className="font-heading text-[11px] font-semibold uppercase tracking-[0.12em] text-white/48 mb-1">
                    <span className="text-gates-orange mr-2">04</span>Consent
                  </legend>
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={consent}
                      onChange={(e) => {
                        setConsent(e.target.checked);
                        if (error) setError("");
                      }}
                      required
                      className="mt-0.5 w-4 h-4 shrink-0 rounded border-white/25 bg-white/5 accent-gates-orange"
                    />
                    <span className="text-[13px] leading-[1.55] text-white/70">
                      I consent to GATES collecting and processing the information in this form to administer the
                      hackathon, per the{" "}
                      <Link to="/privacy" className="text-gates-link underline">
                        privacy notice
                      </Link>
                      . <span className="text-gates-orange">*</span>
                    </span>
                  </label>
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={memberConsentAttested}
                      onChange={(e) => {
                        setMemberConsentAttested(e.target.checked);
                        if (error) setError("");
                      }}
                      required
                      className="mt-0.5 w-4 h-4 shrink-0 rounded border-white/25 bg-white/5 accent-gates-orange"
                    />
                    <span className="text-[13px] leading-[1.55] text-white/70">
                      I confirm each named team member and endorsing head has been informed that their details are
                      being submitted, and how they will be used &mdash; they will not visit this site themselves.{" "}
                      <span className="text-gates-orange">*</span>
                    </span>
                  </label>
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={documentationConsent}
                      onChange={(e) => setDocumentationConsent(e.target.checked)}
                      className="mt-0.5 w-4 h-4 shrink-0 rounded border-white/25 bg-white/5 accent-gates-orange"
                    />
                    <span className="text-[13px] leading-[1.55] text-white/70">
                      Separately, our team consents to documentation &mdash; photos, video, and publication of team
                      names and solution summaries &mdash; for GATES information and advocacy purposes.
                    </span>
                  </label>
                </fieldset>

                {error && (
                  <div
                    role="alert"
                    aria-live="assertive"
                    className="rounded-xl border border-gates-error/35 bg-gates-error/8 px-4 py-3 text-red-300 text-[13px] leading-[1.5]"
                  >
                    {error}
                  </div>
                )}
                <button
                  type="submit"
                  disabled={submitting}
                  className="btn-hackathon w-full sm:w-auto px-[26px] py-3.5 rounded-full text-white font-bold text-[15px] border-none cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {submitting ? "Submitting…" : "Submit proposal"}
                </button>
              </form>
            )}
          </div>
        </div>
      </PageSection>

      {/* CTA */}
      <section
        style={{ scrollMarginTop: `${STICKY_OFFSET}px` }}
        className="hero-brand-gradient glass-panel relative overflow-hidden max-w-[1000px] mx-5 sm:mx-8 lg:mx-auto my-10 sm:my-16 px-6 sm:px-10 py-10 sm:py-14 text-center flex flex-col gap-[18px] items-center"
      >
        <Eyebrow>{submissionsClosed ? "WHAT'S NEXT" : "SUBMISSION DEADLINE"}</Eyebrow>
        <h2 className="text-[clamp(24px,3vw,34px)] font-bold m-0 tracking-tight">
          {submissionsClosed ? (
            <>
              {nextMilestone.label}
              <br />
              {nextMilestone.dateLabel}
            </>
          ) : (
            <>
              Proposal submissions close at {deadlineTime} on
              <br />
              {deadlineDate}
            </>
          )}
        </h2>
        {submissionsClosed ? (
          <Link
            to="/conference"
            className="btn-hackathon w-full min-[420px]:w-auto px-[26px] py-3.5 rounded-full text-white font-bold text-[15px] text-center no-underline"
          >
            See the Conference
          </Link>
        ) : (
          <a
            href="#submit"
            className="btn-hackathon w-full min-[420px]:w-auto px-[26px] py-3.5 rounded-full text-white font-bold text-[15px] text-center no-underline"
          >
            Submit a Proposal
          </a>
        )}
      </section>

      <Footer />
    </div>
  );
}
