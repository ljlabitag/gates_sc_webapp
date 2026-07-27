/**
 * GATES Hackathon 2026 — public-facing mechanics.
 *
 * Source: "P4_GATES-Hackathon_Internal_General_Mechanics_v0.2_20260709".
 * This supersedes the earlier stakeholder-conference concept note, which said
 * "5 teams max" and dated the finalist announcement to Aug 19; v0.2 sets 6 teams
 * and Aug 25. Keep this file in sync with the mechanics document, not the concept note.
 */

export const HACKATHON = {
  /*
   * The mechanics shortlist two names ("GATES GeoHack 2026" and
   * "GATES Geo-vation Challenge 2026") with final selection pending, and uses
   * this placeholder throughout.
   * TODO: replace once the name is chosen.
   */
  name: "GATES Hackathon 2026",
  /** Anchored on the stakeholder conference theme. */
  theme: "Charting Spatial Futures",
  submissionDeadlineLabel: "11:59 PM on August 18, 2026",
  /** For buttons and tight spaces where the full label won't fit. */
  submissionDeadlineShort: "August 18",
  callForParticipantsLabel: "August 7, 2026",
  finalistsAnnouncedLabel: "August 25, 2026",
  maxFinalistTeams: 6,
  reserveTeams: 2,
  teamSize: 4,
  developmentPeriodLabel: "September 18 – October 14, 2026",
  proposalMaxPages: 5,
  proposalFilenamePattern: "GATESHack2026_Proposal_[TeamName].pdf",
};

export const OBJECTIVE =
  "Develop innovative geospatial technology solutions using the GATES Lakehouse, datasets, and tools to address operational challenges and pain points across the DOST system.";

export const SUB_OBJECTIVES = [
  "Surface real operational pain points within DOST agencies, regional offices, and PSTOs that geospatial technology can address.",
  "Demonstrate the value of the GATES Lakehouse, datasets, and tools through working solutions built by the DOST community itself.",
  "Build internal capacity and a pipeline of geospatial champions across the DOST system.",
  "Feed promising solutions into the GATES use case pipeline for possible further development after the hackathon.",
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
  "Technical staff of DOST attached agencies",
  "Technical staff of DOST regional offices",
  "Technical staff of Provincial Science and Technology Offices (PSTOs)",
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
    window: "August 7 – September 2, 2026",
    steps: [
      "Call for participants — GATES publishes the mechanics, proposal template, and submission instructions (August 7).",
      "Submission — one proposal per team using the official template, covering the domain and pain point, the proposed geospatial solution, GATES resources to be used, feasibility, and expected impact. Deadline August 18, 11:59 PM.",
      "Screening — subject matter experts and organizers review submissions against the screening rubric (August 19–24).",
      "Announcement — up to 6 finalist teams plus 2 ranked reserve teams announced August 25.",
      "Confirmation — finalists confirm participation, including agency endorsement, by September 1. Any team that backs out is replaced by the next-ranked reserve. The final list locks September 2.",
    ],
  },
  {
    number: 2,
    color: "teal",
    title: "Build, coach, pitch",
    window: "September 17 – October 16, 2026",
    steps: [
      "Orientation and capacity building (face-to-face, September 17) — onboarding to the GATES Lakehouse sandbox, datasets, and tools; briefing on rules, deliverables, scoring, and data governance; matching with assigned GATES mentors.",
      "Development period (September 18 – October 14) — teams build at their own offices with mentor support.",
      "Virtual check-ins — two mandatory online checkpoints with GATES specialists on September 30 and October 7, plus on-demand consultations with mentors.",
      "Final coaching and technical judging (face-to-face, October 15) — a walkthrough of pitching rules and a coaching session, then each team presents to the technical panel: 10 minutes to pitch, 5 minutes Q&A, 5 minutes of feedback. Worth 70% of the final score.",
      "Final pitch and executive judging (October 16) — teams deliver an improved 5-minute pitch to the executive panel and the conference audience. Worth 30% of the final score.",
      "Awarding — winners announced during the conference.",
    ],
  },
] as const;

export const TIMELINE = [
  { date: "August 7, 2026", milestone: "Call for participants opens" },
  { date: "August 7 – 18", milestone: "Submission window" },
  { date: "August 18, 11:59 PM", milestone: "Deadline for proposal submissions" },
  { date: "August 19 – 24", milestone: "Screening by subject matter experts and organizers" },
  { date: "August 25", milestone: "Announcement of finalists and 2 reserve teams" },
  { date: "August 26 – September 1", milestone: "Confirmation and back-out period" },
  { date: "September 2", milestone: "Final list of finalist teams locked" },
  { date: "September 17", milestone: "Orientation and capacity building (face-to-face)" },
  { date: "September 18 – October 14", milestone: "Development period with mentorship" },
  { date: "September 30 and October 7", milestone: "Mandatory virtual check-ins" },
  { date: "October 15", milestone: "Final coaching and technical judging (70%)" },
  { date: "October 16", milestone: "Final pitch, executive judging (30%), and awarding" },
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

export const COVERED_COSTS = [
  "Orientation (September 17) — one night of hotel accommodation, with meals during the activity.",
  "Finals (October 15–16) — one night of hotel accommodation on October 15, with meals during the activity.",
];

export const PARTICIPANT_COSTS = [
  "Airfare and land travel to and from Metro Manila for both face-to-face activities.",
  "Accommodation and meals beyond the covered nights and activity meals.",
];

export const PROPOSAL_SECTIONS = [
  { title: "Team information", detail: "Team name, agency or office per member, team leader contact, members and roles, and endorsing head/s." },
  { title: "Problem statement / pain point", detail: "Max 300 words. Which domain, who experiences the problem, how often, and what it costs today in time, money, or service quality." },
  { title: "Proposed solution", detail: "Max 500 words. How it works, and what will exist at the end of the hackathon as a demo-able prototype." },
  { title: "Geospatial component and GATES resources", detail: "What makes the solution geospatial, and which datasets and development tools you need." },
  { title: "Business model canvas", detail: "Condensed: target users, value proposition, key activities, resources and data, channels, cost to sustain, and success indicators." },
  { title: "Feasibility and workplan", detail: "High-level plan for the September 18 – October 14 development period, including who does what." },
  { title: "Expected impact", detail: "Who benefits, at what scale, and how DOST would adopt this beyond the hackathon." },
];

export const GENERAL_RULES = [
  "Solutions must be substantially developed during the development period (September 18 – October 14). Pre-existing open-source libraries, frameworks, and public components may be used with proper attribution; a pre-existing complete system merely rebranded is not eligible.",
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
