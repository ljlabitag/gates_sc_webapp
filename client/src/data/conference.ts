/**
 * Facts for the 2nd GATES Program Stakeholder Conference and the 2025 recap.
 *
 * Sources: "2nd Stakeholder Conference Concept" (draft) and "Conference
 * Documentation Oct 15 - 17" (the 2025 event report).
 *
 * The conference date and hackathon-day pairing come from the hackathon
 * mechanics v2.0 (external copy supplied 2026-08-19), which pushed the whole
 * hackathon timeline back roughly a month from the v0.2 reading this file
 * previously used (Oct 25/26) — do not revert to those dates:
 *   - Nov 9 (Mon) — hackathon final coaching and technical judging, participants only
 *   - Nov 10 (Tue) — the stakeholder conference proper, plus final pitches and awarding
 * The mechanics cover one hotel night for this pairing (see COVERED_COSTS in
 * data/hackathon.ts) — and unlike the Oct 25/26 reading, Nov 9/10 is a clean
 * weekday pair (Mon/Tue), not weekend judging.
 *
 * Hackathon specifics come from the hackathon mechanics v2.0. See
 * data/hackathon.ts — do not duplicate those figures here.
 *
 * Nothing internal belongs in this file: no budgets, billeting or pax counts,
 * purchase-request details, PCIEERD monitoring figures, or staff initials.
 */

// Anchored to +08:00 explicitly — an earlier version of this constructed in
// browser-local time, so the countdown differed per viewer timezone.
/** Conference proper, used for the countdown. */
export const CONFERENCE_DATE = new Date("2026-11-10T09:00:00+08:00");

export const CONFERENCE = {
  edition: "2nd GATES Program Stakeholder Conference",
  dateLabel: "November 10, 2026",
  conferenceProperLabel: "Tuesday, November 10, 2026",
  hackathonDayLabel: "Monday, November 9, 2026",
  venueLabel: "Metro Manila — venue to be announced",
  /** Confirmed — matches the hackathon mechanics document's own title. */
  theme: "Charting Spatial Futures",
  previousTheme: "#SpatialTogether",
};

/** Section II of the concept note. */
export const OBJECTIVES = [
  "Present the latest progress and milestones of the GATES Program.",
  "Showcase emerging geospatial use cases being co-developed with partner agencies.",
  "Highlight collaborations with development partners that strengthen the GATES ecosystem.",
  "Promote innovation through the GATES Hackathon.",
  "Strengthen stakeholder commitment toward data-driven governance and geospatial collaboration.",
];

/** Section III — the core narrative's four key messages. */
export const KEY_MESSAGES = [
  { color: "blue", text: "We understand government problems." },
  { color: "teal", text: "We are co-developing solutions — not building them alone." },
  { color: "orange", text: "GATES enables collaboration." },
  { color: "plum", text: "Today's prototypes become tomorrow's operational solutions." },
] as const;

/** Section VI — major components. */
export const COMPONENTS = [
  {
    color: "orange",
    title: "Geospatial Gallery",
    short: "Maps built from DOST datasets, layered across agencies.",
    desc: "A gallery of maps generated from DOST datasets, shown on lightboxes — including the layering of datasets contributed by different agencies, not only those drawn from use cases.",
  },
  {
    color: "teal",
    title: "Use Case Development Showcase",
    short: "Partner agencies present the use cases they are currently co-developing with GATES.",
    desc: "Short presentations of the major use cases GATES is co-developing, delivered by the partner agencies themselves so each can champion the work it is building with the Program.",
  },
  {
    color: "plum",
    title: "GATES GeoHack 2026",
    short: "Six finalist teams build on the GATES Lakehouse, then pitch live at the conference.",
    desc: "The first GATES GeoHack. Up to six finalist teams build geospatial solutions on the GATES Lakehouse sandbox, then deliver a five-minute pitch to the executive panel and the conference audience before awarding.",
    to: "/hackathon",
    linkLabel: "See the full mechanics",
  },
] as const;

/** Section V — target participants. */
export const PARTICIPANTS = [
  {
    color: "blue",
    group: "DOST offices",
    detail: "Central and regional offices, including provincial science and technology offices.",
  },
  {
    color: "teal",
    group: "DOST attached agencies",
    detail: "Representatives from across the DOST system and its attached agencies.",
  },
  {
    color: "orange",
    group: "Government institutions",
    detail: "Other public institutions working with data, technology, planning, and public service delivery.",
  },
  {
    color: "plum",
    group: "Development partners",
    detail: "Development organizations and collaborating partners supporting the GATES ecosystem.",
  },
] as const;

/**
 * Draft programme for the conference proper. Deliberately no speaker names —
 * the source table uses internal initials and several rows have no time yet.
 */
export const AGENDA = [
  { time: "8:00 AM", title: "Registration", desc: "" },
  {
    time: "8:30 AM",
    title: "Opening ceremony",
    desc: "National anthem, invocation, and acknowledgement of attendees.",
  },
  {
    time: "8:45 AM",
    title: "Opening and keynote messages",
    desc: "DOST leadership on the Department's geospatial and AI direction.",
  },
  {
    time: "9:20 AM",
    title: "GATES Program updates",
    desc: "Progress and milestones since the first stakeholder conference.",
  },
  {
    time: "9:35 AM",
    title: "DOST's data governance rationale",
    desc: "Why governance underpins everything the Program builds.",
  },
  {
    time: "10:00 AM",
    title: "The GATES Lakehouse",
    desc: "The infrastructure behind the Program's data, AI models, and visualisation.",
  },
  {
    time: "10:30 AM",
    title: "Use Case Development Showcase",
    desc: "Partner agencies present the mature use cases they are co-developing with GATES.",
  },
  { time: "12:00 NN", title: "Lunch break", desc: "" },
  {
    time: "1:15 PM",
    title: "Hackathon finalists' pitches",
    desc: "Finalist teams pitch to the judging panel.",
  },
  {
    time: "2:00 PM",
    title: "GATES collaborations",
    desc: "Development partners on joint work strengthening the GATES ecosystem.",
  },
  { time: "To be confirmed", title: "Awarding of hackathon winners", desc: "" },
  {
    time: "To be confirmed",
    title: "Way forward",
    desc: "What is coming next for the Program.",
  },
  {
    time: "To be confirmed",
    title: "Map Your Commitment",
    desc: "Closing interactive activity mapping where stakeholders are joining from.",
  },
];

/* ------------------------------------------------------------------ *
 * 2025 recap — from the first conference's documentation
 * ------------------------------------------------------------------ */

export const RECAP_2025 = {
  title: "The First Stakeholder Conference, 2025",
  dateLabel: "October 16, 2025",
  formatLabel: "Hybrid",
  theme: "#SpatialTogether",
  stats: [
    { value: "302", label: "Total attendees" },
    { value: "235", label: "Onsite" },
    { value: "67", label: "Online" },
  ],
  /** Day 1 session titles, as programmed. */
  sessions: [
    "Spatial Together — keynote presentation",
    "The GATES Program: Building a Connected, Spatially Intelligent DOST",
    "Strengthening Data Foundation: AI-ready Data Architecture",
    "Opening GATES: Unifying Data, AI Models, and Visualization",
    "Insight to Action: GATES Applications for Agency Use Cases powered by AI and Spatial Intelligence",
    "From Conversations to Collaborations: Towards Partnerships and Long-term Engagements",
    "Framing the Future: Policy Insights and Pathways to Support GATES",
    "Co-creation and Collaboration: Enabling One DOST through GATES",
    "The GATES Roadmap: From Foundations to Sustainability",
    "Mapping Shared Commitment",
  ],
  recapUrl: "https://www.facebook.com/share/p/1D6LxisvYK/",
};
