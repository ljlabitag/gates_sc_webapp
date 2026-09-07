/**
 * GATES GeoHack 2026 — public-facing mechanics.
 *
 * Source: "Official Mechanics for the GATES Program Hackathon 2026_v2.0_20260819"
 * (external copy supplied 2026-08-19). This is a full timeline revision, not a
 * typo fix, superseding the v0.2 dates previously in this file (Aug 18 call /
 * Sep 3 deadline / Oct 25-26 finals+conference) — do not revert to those.
 * v2.0 pushes the whole schedule back roughly a month and, unlike v0.2, is
 * internally consistent (no stale-date mismatches between its timeline table
 * and its prose) — nothing needed the same kind of judgment call this time.
 *
 * Call-for-participants opening slipped again after v2.0: August 24 → August
 * 27, 2026 (confirmed verbally 2026-08-26, not yet in a revised mechanics
 * doc). Only that one date moved — the submission window's start shifted with
 * it, but the September 15 deadline and everything after are unchanged.
 *
 * v2.0 also references this site directly as the submission channel
 * ("...via https://gates-sc-webapp.dost-gates.workers.dev/hackathon"), so the
 * domain in that document needs updating too if this site's domain changes
 * again before launch.
 */

export const HACKATHON = {
  name: "GATES GeoHack 2026",
  /** Confirmed — matches the mechanics document's own title. */
  theme: "Charting Spatial Futures",
  submissionDeadlineLabel: "11:59 PM on September 15, 2026",
  /** For buttons and tight spaces where the full label won't fit. */
  submissionDeadlineShort: "September 15",
  callForParticipantsLabel: "August 27, 2026",
  finalistsAnnouncedLabel: "September 22, 2026",
  maxFinalistTeams: 6,
  reserveTeams: 2,
  teamSize: 4,
  developmentPeriodLabel: "October 8 – November 8, 2026",
  // Sourced from the real Annex A template (originally Annex_A_Proposal_Submission_Template_v2.docx,
  // supplied 2026-08-19; superseded by v3.0, supplied 2026-08-27 — v3 kept
  // these same limits, so nothing below changed with the v3 swap). The v2
  // template itself superseded 5 pages / no stated size limit /
  // "GATESHack2026_..." that were on the site before either version existed.
  // The 8-page limit covers Sections 1–7 only; the declarations page doesn't
  // count toward it.
  proposalMaxPages: 8,
  proposalMaxSizeMB: 100,
  proposalFilenamePattern: "GATESGeoHack2026_Proposal_[TeamName].pdf",
};

export const OBJECTIVE =
  "Develop innovative geospatial technology solutions using the GATES Lakehouse, datasets, and tools to address operational challenges and pain points or explore an uncharted territory across the DOST system.";

export const SUB_OBJECTIVES = [
  "Encourage the development of geospatial solutions and innovations within the DOST system.",
  "Build internal capacity and a pipeline of geospatial champions across the Department.",
  "Demonstrate the value of the GATES Lakehouse, datasets, and tools through working solutions built by the DOST community itself.",
  "Identify promising solutions for inclusion into the GATES use case pipeline for possible further development after the hackathon.",
];

/** A proposal must address a pain point in at least one of these. */
export const DOMAINS = [
  "Health, Nutrition, Education, and Social Services",
  "Disaster Risk Reduction and Management",
  "Environmental Monitoring",
  "Project and Knowledge Management",
  "Geospatial Infrastructure Development",
  "Natural Resources Assessment",
];

export const ELIGIBLE = [
  "DOST attached agencies staff",
  "DOST regional offices staff",
  "Provincial Science and Technology Offices (PSTOs) staff",
  "DOST-SEI scholars, who must be in their senior year of college at the time of the hackathon",
];

export const CONDITIONS = [
  "Each participant may join only one team.",
  "Members of the GATES organizing committee, screening panel, mentors, and judges — and their immediate staff involved in the hackathon — are not eligible.",
  "DOST staff must secure endorsement from their agency or office head for official time and travel authority. SEI scholars must be in good standing with SEI.",
  "Cross-agency and cross-office teams are allowed and encouraged.",
];

export const TEAM_RULES = [
  "Exactly 4 members per team, with one designated Team Leader as the official point of contact.",
  "A maximum of 6 teams advance to the Finals, with 2 ranked reserve teams.",
  "Mix your roles: a domain or process owner who knows the pain point, a developer, a data or GIS specialist, and a presenter or analyst.",
  "No substitution of members after finalists are announced, except for justified cases — resignation, medical, or official duty conflict — approved by the organizing committee. Replacements must meet the eligibility rules.",
];

export const PHASES = [
  {
    number: 1,
    color: "orange",
    title: "Idea submission and screening",
    window: "August 27 – September 30, 2026",
    steps: [
      "Call for participants — GATES publishes the mechanics, proposal template, and submission instructions (August 27).",
      "Submission — one proposal per team using the official template, covering the domain and pain point, the proposed geospatial solution, GATES resources to be used, feasibility, and expected impact. Deadline September 15, 11:59 PM.",
      "Screening — subject matter experts and organizers review submissions against the screening rubric (September 16–21).",
      "Announcement — up to 6 finalist teams plus 2 ranked reserve teams announced September 22.",
      "Confirmation — finalists confirm participation, including agency endorsement, by September 29. Any team that backs out is replaced by the next-ranked reserve. The final list locks September 30.",
    ],
  },
  {
    number: 2,
    color: "teal",
    title: "Build, coach, pitch",
    window: "October 7 – November 10, 2026",
    steps: [
      "Orientation and capacity building (online, October 7) — onboarding to the GATES Lakehouse sandbox, datasets, and tools; briefing on rules, deliverables, scoring, and data governance; matching with assigned GATES mentors.",
      "Development period (October 8 – November 8) — teams build at their own offices with mentor support.",
      "Virtual check-ins — two mandatory online checkpoints with GATES specialists on October 20 and November 3, plus on-demand consultations with mentors.",
      "Final coaching and technical judging (face-to-face, November 9) — a walkthrough of pitching rules and a coaching session, then each team presents to the technical panel: 10 minutes to pitch, 5 minutes Q&A, 5 minutes of feedback. Worth 70% of the final score.",
      "Final pitch and executive judging (November 10) — teams deliver an improved 5-minute pitch to the executive panel and the conference audience. Worth 30% of the final score.",
      "Awarding — winners announced during the conference.",
    ],
  },
] as const;

export const TIMELINE = [
  { date: "August 27, 2026", milestone: "Call for participants opens" },
  { date: "August 27 – September 15", milestone: "Submission window" },
  { date: "September 15, 11:59 PM", milestone: "Deadline for proposal submissions" },
  { date: "September 16 – 21", milestone: "Screening by subject matter experts and organizers" },
  { date: "September 22", milestone: "Announcement of finalists and 2 reserve teams" },
  { date: "September 23 – 29", milestone: "Confirmation and back-out period" },
  { date: "September 30", milestone: "Final list of finalist teams locked" },
  { date: "October 7", milestone: "Orientation and capacity building (online)" },
  { date: "October 8 – November 8", milestone: "Development period with mentorship" },
  { date: "October 20 and November 3", milestone: "Mandatory virtual check-ins" },
  { date: "November 9", milestone: "Final coaching and technical judging (70%)" },
  { date: "November 10", milestone: "Final pitch, executive judging (30%), and awarding" },
];

export const RESOURCES = [
  "Access to the GATES Lakehouse sandbox environment with individual or team credentials",
  "Curated datasets from the Lakehouse authorized for hackathon use",
  "Tools developed under the GATES Program",
  "Mentorship from GATES specialists, assigned per team at orientation",
  "Orientation and capacity building session materials",
];

export type Rubric = {
  id: string;
  title: string;
  share: string;
  panel: string;
  color: "orange" | "teal" | "plum";
  criteria: { name: string; weight: string; detail: string }[];
};

export const RUBRICS: Rubric[] = [
  {
    id: "screening",
    title: "Phase 1 — Screening of proposals",
    share: "Determines who advances",
    panel: "GATES subject matter experts and organizers. Teams are ranked by weighted total; the top 6 advance and the next 2 form the reserve list.",
    color: "orange",
    criteria: [
      {
        name: "Relevance and GATES alignment",
        weight: "30%",
        detail:
          "Is the problem a real pain point within a priority innovation domain? Is the solution meaningfully geospatial? Can it be implemented using the GATES Lakehouse, datasets, or tools?",
      },
      {
        name: "Feasibility",
        weight: "30%",
        detail:
          "Can a working prototype realistically be built within the roughly four-week development period? Is the required data available or obtainable? Is the scope right-sized?",
      },
      {
        name: "Forecasted impact",
        weight: "30%",
        detail:
          "Scale of benefit — how many offices, processes, or citizens are helped? Potential for adoption and sustained use beyond the hackathon.",
      },
      {
        name: "Innovation and originality",
        weight: "10%",
        detail: "Novelty of the approach; not a duplicate of an existing DOST or GATES system.",
      },
    ],
  },
];

// Orientation is online now (see PHASES), so there's no separate covered
// hotel night for it — only Finals gets one, per the mechanics' §X.
export const COVERED_COSTS = [
  "Finals (November 9–10) — one night of hotel accommodation, with meals during the activity.",
];

export const PARTICIPANT_COSTS = [
  "Airfare and land travel to and from Metro Manila for face-to-face activities.",
  "Accommodation and meals beyond the covered night and activity meals.",
];

// Per the mechanics §VIII. Cash amounts are deliberately not stated here —
// they're to be announced closer to the finals — so keep that as a quiet
// trailing note in the UI rather than its own callout.
export const PRIZES = [
  "The top 3 teams each receive a cash prize, a plaque, and medals for their members.",
  "Remaining finalist teams receive a certificate of recognition and a consolation prize.",
];

export const PROPOSAL_SECTIONS = [
  { title: "Team information", detail: "Team name, agency or office per member, team leader contact, members and roles, and endorsing head/s." },
  { title: "Problem statement / pain point", detail: "Max 400 words. Which domain, who experiences the problem, how often, and what it costs today in time, money, or service quality." },
  { title: "Proposed solution", detail: "Max 700 words. How it works, and what will exist at the end of the hackathon as a demo-able prototype." },
  { title: "Geospatial component and GATES resources", detail: "What makes the solution geospatial, and which datasets and development tools you need." },
  { title: "Business model canvas", detail: "Condensed: target users, value proposition, key activities, resources and data, channels, cost to sustain, and success indicators." },
  { title: "Feasibility and workplan", detail: "High-level plan for the October 8 – November 8 development period, including who does what." },
  { title: "Expected impact", detail: "Who benefits, at what scale, and how DOST would adopt this beyond the hackathon." },
];

export const GENERAL_RULES = [
  "Solutions must be substantially developed during the development period (October 8 – November 8). Pre-existing open-source libraries, frameworks, and public components may be used with proper attribution; a pre-existing complete system merely rebranded is not eligible.",
  "Teams must use the GATES Lakehouse sandbox, authorized datasets, and/or GATES tools as a core component of the solution.",
  "Any plagiarism, misrepresentation, or unauthorized use of another team's work is ground for disqualification.",
  "The organizing committee may disqualify teams for violations of these mechanics, the data governance rules, or the code of conduct, at any stage.",
  "By joining, participants consent to documentation — photos, video, and publication of team names and solution summaries — for GATES information and advocacy purposes.",
  "Decisions of the screening panel and the board of judges are final and unappealable.",
];

export const IP_RULES = [
  "Solutions are developed using government-funded Program resources. IP treatment follows RA 10055 (Technology Transfer Act), RA 8293 (works of government), and the DOST IP Policy (AO 016 s. 2019).",
  "Teams retain attribution and recognition as developers. DOST and the GATES Program obtain the right to use, deploy, adapt, and scale the solutions within the DOST system.",
];

export const DATA_RULES = [
  "Teams may use only the datasets provided or explicitly authorized by the organizers. Scraping or importing personal or sensitive data into the sandbox is prohibited.",
  "Sandbox credentials are per team, non-transferable, and revoked after the hackathon.",
  "Handling of any personal data must comply with RA 10173 (Data Privacy Act).",
];
