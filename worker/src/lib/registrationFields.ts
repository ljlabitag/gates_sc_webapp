// Validation for the personal/agency/dietary fields of a registration, shared
// by the public form (POST /api/registrations) and the admin editor
// (PATCH /api/admin/registrations/:id) so the two can never disagree about
// what a valid registration looks like. Consent fields are NOT here: they're
// a statement the registrant makes at submission time, which an admin can't
// make or change on their behalf.

// Mirror client/src/data/registration.ts — the two packages don't share code,
// so keep these in sync by hand if the options or limits ever change.
export const DIETARY_OPTIONS = ["Vegetarian", "Halal", "No pork"];
export const ASSISTANCE_OPTIONS = ["Senior citizen", "Person with disability (PWD)", "Pregnant"];
export const LIMITS = {
  name: 60,
  nickname: 30,
  mobile: 25,
  agency: 160,
  division: 120,
  designation: 120,
  foodAllergies: 200,
  assistanceNeeded: 200,
};

const EMAIL_RE = /^[^@\s]+@[^@\s.]+(\.[^@\s.]+)+$/;
const EMAIL_MAX_LENGTH = 254;

// Deliberately lenient: this is a contact number, not an identifier, and
// attendees include development partners with non-PH numbers. It only has to
// catch obvious junk — allowed characters and a plausible digit count (a PH
// mobile is 11 digits as 09XX…, 12 as +63 9XX…; E.164 tops out at 15).
const MOBILE_RE = /^\+?[0-9][0-9\s\-()]*$/;

export interface RegistrationFields {
  /** Display name, composed from the parts: "First M. Last". */
  name: string;
  firstName: string;
  middleInitial: string | null;
  lastName: string;
  nickname: string | null;
  /** Lower-cased, so the one-registration-per-email index sees "A@x.ph" and "a@x.ph" as the same. */
  email: string;
  mobile: string;
  agency: string;
  division: string | null;
  designation: string;
  dietaryPreferences: string | null;
  foodAllergies: string | null;
  specialAssistance: string | null;
  assistanceNeeded: string | null;
}

export type ParsedRegistration = { ok: true; value: RegistrationFields } | { ok: false; error: string };

function text(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

// Optional checklist field: absent is fine, but if present it must be an
// array drawn from the fixed list — anything else is a hand-built request,
// not this site's form. Returns the canonical (list-ordered, "; "-joined)
// value, or null when nothing was ticked.
function checklist(value: unknown, allowed: string[]): { ok: true; value: string | null } | { ok: false } {
  const raw: unknown = value ?? [];
  if (!Array.isArray(raw) || !raw.every((v) => typeof v === "string" && allowed.includes(v))) {
    return { ok: false };
  }
  const chosen = allowed.filter((option) => raw.includes(option));
  return { ok: true, value: chosen.join("; ") || null };
}

export function parseRegistrationFields(body: Record<string, unknown>): ParsedRegistration {
  const firstName = text(body.firstName);
  const lastName = text(body.lastName);
  // Accept "D" or "D." — stored as the bare uppercase letter.
  const rawInitial = text(body.middleInitial)?.replace(/\.$/, "") ?? null;
  const nickname = text(body.nickname);
  const email = text(body.email);
  const mobile = text(body.mobile);
  const agency = text(body.agency);
  const division = text(body.division);
  const designation = text(body.designation);
  const foodAllergies = text(body.foodAllergies);
  const assistanceNeeded = text(body.assistanceNeeded);

  if (!firstName) return { ok: false, error: "Please enter your first name." };
  if (!lastName) return { ok: false, error: "Please enter your last name." };
  if (rawInitial && !/^\p{L}$/u.test(rawInitial)) {
    return { ok: false, error: "Middle initial should be a single letter." };
  }
  if (!email) return { ok: false, error: "Please enter your email address." };
  if (!EMAIL_RE.test(email) || email.length > EMAIL_MAX_LENGTH) {
    return { ok: false, error: "Please enter a valid email address." };
  }
  if (!mobile) return { ok: false, error: "Please enter your mobile number." };
  const mobileDigits = mobile.replace(/\D/g, "").length;
  if (!MOBILE_RE.test(mobile) || mobile.length > LIMITS.mobile || mobileDigits < 10 || mobileDigits > 15) {
    return { ok: false, error: "Please enter a valid mobile number." };
  }
  if (!agency) return { ok: false, error: "Please enter your agency or organization." };
  if (!designation) return { ok: false, error: "Please enter your position or designation." };
  if (
    firstName.length > LIMITS.name ||
    lastName.length > LIMITS.name ||
    (nickname?.length ?? 0) > LIMITS.nickname ||
    agency.length > LIMITS.agency ||
    (division?.length ?? 0) > LIMITS.division ||
    designation.length > LIMITS.designation
  ) {
    return { ok: false, error: "One of the fields you entered is too long." };
  }

  const dietary = checklist(body.dietaryPreferences, DIETARY_OPTIONS);
  if (!dietary.ok) return { ok: false, error: "Please choose dietary preferences from the list provided." };
  const assistance = checklist(body.specialAssistance, ASSISTANCE_OPTIONS);
  if (!assistance.ok) {
    return { ok: false, error: "Please choose special assistance options from the list provided." };
  }
  if ((foodAllergies?.length ?? 0) > LIMITS.foodAllergies) {
    return { ok: false, error: `Please keep the food allergy note under ${LIMITS.foodAllergies} characters.` };
  }
  if ((assistanceNeeded?.length ?? 0) > LIMITS.assistanceNeeded) {
    return { ok: false, error: `Please keep the assistance note under ${LIMITS.assistanceNeeded} characters.` };
  }

  const middleInitial = rawInitial ? rawInitial.toLocaleUpperCase() : null;
  const name = [firstName, middleInitial ? `${middleInitial}.` : null, lastName].filter(Boolean).join(" ");

  return {
    ok: true,
    value: {
      name,
      firstName,
      middleInitial,
      lastName,
      nickname,
      email: email.toLowerCase(),
      mobile,
      agency,
      division,
      designation,
      dietaryPreferences: dietary.value,
      foodAllergies,
      specialAssistance: assistance.value,
      assistanceNeeded,
    },
  };
}
