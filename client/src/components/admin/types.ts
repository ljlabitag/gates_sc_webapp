/** A registration row as GET /api/admin/registrations returns it. */
export interface Registration {
  id: string;
  name: string;
  firstName: string | null;
  middleInitial: string | null;
  lastName: string | null;
  nickname: string | null;
  email: string;
  mobile: string | null;
  agency: string | null;
  division: string | null;
  designation: string | null;
  ageBracket: string | null;
  sexAtBirth: string | null;
  dietaryPreferences: string | null;
  foodAllergies: string | null;
  specialAssistance: string | null;
  assistanceNeeded: string | null;
  documentationConsent: boolean;
  privacyNoticeVersion: string;
  checkedInAt: number | null;
  checkedInBy: string | null;
  kitSentAt: number | null;
  createdAt: number;
}

/** A hackathon submission row as GET /api/admin/hackathon-submissions returns it. */
export interface HackathonSubmission {
  id: string;
  team: string;
  title: string;
  domain: string | null;
  agency: string | null;
  leaderName: string | null;
  leaderPosition: string | null;
  leaderEmail: string | null;
  leaderMobile: string | null;
  fileName: string | null;
  fileSize: number | null;
  createdAt: number;
}

/** Checklist columns are stored "; "-joined. */
export const splitChecklist = (value: string | null) => (value ? value.split("; ") : []);

export const hasSpecialNeeds = (r: Registration) =>
  Boolean(r.dietaryPreferences || r.foodAllergies || r.specialAssistance || r.assistanceNeeded);
