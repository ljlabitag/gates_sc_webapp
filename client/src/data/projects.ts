import type { DotColor } from "../components/ui";

/**
 * The four GATES component projects.
 *
 * Copy is quoted or lightly condensed from the official "DOST GATES Program
 * Briefer" — please keep it in sync with that document. Project names, full
 * titles, lead agencies, objectives, and activities all come from the briefer;
 * `shortName`, `leadShort`, and `sailMotif` are editorial labels for the UI.
 */

/** Quadrant of the logomark, split on the vertical and horizontal axes through the centre. */
export type Quadrant = "NE" | "SE" | "SW" | "NW";

export type Project = {
  number: number;
  /** Brand colour for badges and panel accents. */
  color: DotColor;
  /** Colour of the sail's own artwork, used for the highlight glow so it never clashes with the art. */
  glow: string;
  name: string;
  shortName: string;
  fullTitle: string;
  lead: string;
  leadShort: string;
  objective: string;
  activities: string[];
  /** Which sail of the logomark represents this project. */
  quadrant: Quadrant;
  /** Plain-language description of that sail's artwork. */
  sailMotif: string;
};

/*
 * Colour assignment follows the briefer's statement that blue, teal, orange, and
 * purple each symbolise a project component, in that listed order.
 *
 * Quadrant assignment is inferred from what each sail depicts — ocean currents
 * for "Navigating the Ocean of Data", a geodetic network for the lakehouse
 * build-out, terrain contours for the DRR-CCA analytics work, and fingerprint
 * ridges for institutional identity and the data science cadre.
 *
 * TODO: confirm BOTH the project↔colour and project↔sail mappings with the
 * GATES comms team. They are inferences, not documented in the briefer, and
 * this constant is the single place to change them.
 */
export const PROJECTS: Project[] = [
  {
    number: 1,
    color: "blue",
    glow: "#fdb04a",
    quadrant: "SE",
    sailMotif: "Ocean currents — flow lines tracing movement through open water",
    name: "Navigating the Ocean of Data",
    shortName: "Navigating the Ocean of Data",
    fullTitle: "DOST-Wide Data Mapping, Cleansing, and Designing the AI-Ready Data Architecture",
    lead: "DOST Central Office — Planning and Evaluation Service (PES)",
    leadShort: "DOST-CO Planning and Evaluation Service",
    objective:
      "To systematically collect, map, cleanse, and standardize the geospatial datasets across DOST, creating an AI-ready data architecture that enhances data-driven decision-making, fosters collaboration, and supports the integration of advanced technologies for national development.",
    activities: [
      "Establish standardized data formats and protocols to ensure the accuracy, reliability, and interoperability of geospatial data across all DOST offices and systems",
      "Conduct data inventory and mapping of existing geospatial data assets across DOST agencies, and identify data needs addressable through collection and integration in the regional offices",
      "Conduct data collection among regional offices",
      "Implement rigorous data cleansing to address inconsistencies, duplicates, and errors in current geospatial data",
      "Design a scalable and flexible data architecture that supports AI and machine learning applications",
    ],
  },
  {
    number: 2,
    color: "teal",
    glow: "#ffa726",
    quadrant: "NW",
    sailMotif: "Geodetic network — a triangulated mesh of survey nodes and baselines",
    name: "Building the Lakehouse",
    shortName: "Building the Lakehouse",
    fullTitle:
      "Establishing the DOST Data Lakehouse and GATES Interface Using Geospatial and AI-Powered Business Intelligence and Predictive Analysis for Strategic and Tactical Data-Driven Decision-Making",
    lead: "DOST Advanced Science and Technology Institute (ASTI)",
    leadShort: "DOST-ASTI",
    objective:
      "To establish the infrastructure supporting all component projects — the essential hardware and software for both backend and frontend applications — ensuring the technological framework is in place for seamless data processing, storage, and accessibility.",
    activities: [
      "Operationalize a Data Lakehouse infrastructure to house scalable, modular data storage and computing",
      "Design, develop, and operationalize the GATES AI",
      "Design, develop, and operationalize a GATES visualization platform",
    ],
  },
  {
    number: 3,
    color: "orange",
    glow: "#f0c060",
    quadrant: "NE",
    sailMotif: "Terrain contours — topographic lines wrapping elevation and hazard",
    name: "Future-ready DOST",
    shortName: "Future-ready DOST",
    fullTitle: "Upscaling and Integrating Geospatial Analytics and AI in Planning and Decision-Making",
    lead: "DOST Philippine Institute of Volcanology and Seismology (PHIVOLCS)",
    leadShort: "DOST-PHIVOLCS",
    objective:
      "To develop and operationalize AI-enabled tools that enhance planning and decision-making across DOST and its agencies. It focuses first on integrating AI into the GeoRiskPH Integrated Services platform for Disaster Risk Reduction and Climate Change Adaptation (DRR-CCA) with DOST-PHIVOLCS and DOST-PAGASA, then broadens to agency-specific geospatial analytics interfaces with built-in chatbot functionality.",
    activities: [
      "Upscale and integrate existing geospatial solutions, and develop new ones from dynamic data in the Data Lakehouse",
      "Develop a single interface where AI draws out existing geospatial solutions and creates new ones through predictive analytics and suitability models",
      "Leverage existing geospatial systems and AI algorithms in the GeoRiskPH platform for planning and decision-making",
      "Build the capacity of DOST agencies and regional offices on using the platform for the use cases",
    ],
  },
  {
    number: 4,
    color: "plum",
    glow: "#35c8c0",
    quadrant: "SW",
    sailMotif: "Fingerprint ridges — the mark of identity, people, and institutional memory",
    name: "Sustaining GATES",
    shortName: "Sustaining GATES",
    fullTitle: "Institutionalizing and Expanding the Reach of the Program While Developing the DOST Data Science Cadre",
    lead: "DOST Office of the Assistant Secretary for Development Cooperation (OASECDC)",
    leadShort: "DOST-OASECDC",
    objective:
      "To ensure the GATES Program's vision of revolutionizing planning and decision-making within and beyond DOST is realized, by putting in place mechanisms that guarantee its long-term sustainability — mainstreaming the program and its personnel across the Department and its attached agencies.",
    activities: [
      "Ensure the policies and protocols supporting program and GATES Hub operationalization and sustainability are in place (e.g. data management policies, R&D data capture policies, exit strategy and sustainability plan)",
      "Align the GATES platform with global and national standards on the ethical and responsible use of AI (e.g. UNESCO, ASEAN)",
      "Provide visibility and exposure through interagency advocacy, stakeholder engagement, and regular funding",
      "Plan and execute the training, immersion, and capacity building required by DOST core staff under the program",
      "Integrate the outcomes of all component projects for long-term impact",
    ],
  },
];
