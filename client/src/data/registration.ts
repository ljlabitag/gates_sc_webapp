/**
 * Conference registration form options and limits.
 *
 * Dietary and assistance details are sensitive personal information under
 * RA 10173 (they can reveal health status and disability), so they're short
 * checklists plus length-capped notes rather than open text boxes
 * (implementation brief §6, data minimization): enough for catering and
 * venue logistics to act on, not an invitation to disclose medical history.
 *
 * worker/src/routes/registrations.ts validates against its own copy of these
 * — the two packages don't share code, so keep them in sync by hand if
 * anything here changes.
 */
export const DIETARY_OPTIONS = ["Vegetarian", "Halal", "No pork"] as const;

/** Priority-category checklist; anything else goes in the free-text note. */
export const ASSISTANCE_OPTIONS = ["Senior citizen", "Person with disability (PWD)", "Pregnant"] as const;

/** Age brackets rather than a birth date: enough for attendance reporting, nothing more. */
export const AGE_BRACKETS = ["Below 18", "18-24", "25-34", "35-44", "45-54", "55-64", "65 and above"] as const;

/** Sex assigned at birth; answering is required but "Prefer not to say" is a valid answer. */
export const SEX_OPTIONS = ["Female", "Male", "Prefer not to say"] as const;

export const REGISTRATION_LIMITS = {
  name: 60,
  nickname: 30,
  mobile: 25,
  agency: 160,
  division: 120,
  designation: 120,
  /** Food allergies / specific diet note. */
  foodAllergies: 200,
  /** Specific assistance needed note. */
  assistanceNeeded: 200,
} as const;
