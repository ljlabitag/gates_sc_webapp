import { useEffect, useState, type ChangeEvent, type FormEvent, type ReactNode } from "react";
import { Link } from "react-router-dom";
import Nav from "../components/Nav";
import Footer from "../components/Footer";
import Turnstile from "../components/Turnstile";
import { Eyebrow, IconPin, TextLink } from "../components/ui";
import { GATES } from "../data/org";
import { CONFERENCE } from "../data/conference";
import { ASSISTANCE_OPTIONS, DIETARY_OPTIONS, REGISTRATION_LIMITS } from "../data/registration";
import { fetchRegistrationConfig, submitRegistration, type RegistrationResult } from "../lib/api";
import { usePageMeta } from "../hooks/usePageMeta";

const inputClass =
  "w-full px-3.5 py-3 rounded-xl border border-white/16 bg-white/5 text-white/94 text-[15px] font-sans placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-gates-link focus:border-gates-link";

const labelClass = "font-heading text-[12px] font-semibold text-white/62";

const legendClass =
  "font-heading text-[11px] font-semibold uppercase tracking-[0.12em] text-white/48 mb-1";

const hintClass = "text-[12px] leading-[1.5] text-white/45 m-0";

const checkboxClass = "mt-0.5 w-4 h-4 shrink-0 rounded border-white/25 bg-white/5 accent-gates-link";

const EMPTY_FORM = {
  firstName: "",
  middleInitial: "",
  lastName: "",
  nickname: "",
  email: "",
  mobile: "",
  agency: "",
  division: "",
  designation: "",
  foodAllergies: "",
  assistanceNeeded: "",
};

// Light client-side checks so the common typos get caught without a round
// trip; the Worker's own validation is the real gate.
const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

function Field({
  id,
  label,
  required,
  hint,
  children,
}: {
  id: string;
  label: string;
  required?: boolean;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-2">
      <label className={labelClass} htmlFor={id}>
        {label}
        {required && (
          <>
            {" "}
            <span className="text-gates-orange">*</span>
          </>
        )}
      </label>
      {children}
      {hint && <p className={hintClass}>{hint}</p>}
    </div>
  );
}

function Checklist({
  options,
  selected,
  onToggle,
}: {
  options: readonly string[];
  selected: string[];
  onToggle: (option: string) => void;
}) {
  return (
    <div className="grid grid-cols-1 min-[420px]:grid-cols-2 gap-x-4 gap-y-3">
      {options.map((option) => (
        <label key={option} className="flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={selected.includes(option)}
            onChange={() => onToggle(option)}
            className={checkboxClass}
          />
          <span className="text-[13px] leading-[1.55] text-white/70">{option}</span>
        </label>
      ))}
    </div>
  );
}

const toggle = (list: string[], option: string) =>
  list.includes(option) ? list.filter((o) => o !== option) : [...list, option];

export default function Registration() {
  usePageMeta(
    `Register — ${CONFERENCE.edition}`,
    `Register to attend the ${CONFERENCE.edition} on ${CONFERENCE.dateLabel}. Attendance is by invitation — use the registration link in your invitation email.`,
  );

  const [form, setForm] = useState(EMPTY_FORM);
  const [dietaryPreferences, setDietaryPreferences] = useState<string[]>([]);
  const [specialAssistance, setSpecialAssistance] = useState<string[]>([]);
  const [consent, setConsent] = useState(false);
  const [documentationConsent, setDocumentationConsent] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<RegistrationResult | null>(null);
  // Bot check: the server says whether it's on (and the public site key);
  // when it's off, the form works exactly as before.
  const [siteKey, setSiteKey] = useState<string | null>(null);
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const [turnstileReset, setTurnstileReset] = useState(0);

  useEffect(() => {
    fetchRegistrationConfig().then((config) => setSiteKey(config.turnstileSiteKey));
  }, []);

  const setField =
    (key: keyof typeof form) => (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setForm((state) => ({ ...state, [key]: event.target.value }));
      if (error) setError("");
    };

  // A single letter only — anything else (digits, punctuation, a second
  // letter) is dropped as it's typed rather than rejected after the fact.
  const setMiddleInitial = (event: ChangeEvent<HTMLInputElement>) => {
    const letter = event.target.value.replace(/[^\p{L}]/gu, "").slice(0, 1);
    setForm((state) => ({ ...state, middleInitial: letter }));
    if (error) setError("");
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    const mobileDigits = form.mobile.replace(/\D/g, "").length;
    if (!form.firstName.trim()) {
      setError("Please enter your first name.");
      return;
    }
    if (!form.lastName.trim()) {
      setError("Please enter your last name.");
      return;
    }
    if (!form.email.trim() || !EMAIL_RE.test(form.email.trim())) {
      setError("Please enter a valid email address.");
      return;
    }
    if (mobileDigits < 10 || mobileDigits > 15) {
      setError("Please enter a valid mobile number.");
      return;
    }
    if (!form.agency.trim()) {
      setError("Please enter your agency or organization.");
      return;
    }
    if (!form.designation.trim()) {
      setError("Please enter your position or designation.");
      return;
    }
    if (!consent) {
      setError("You must consent to data processing to register — see the privacy notice.");
      return;
    }
    if (siteKey && !turnstileToken) {
      setError("Please complete the verification check above the Register button.");
      return;
    }
    setSubmitting(true);
    setError("");
    try {
      setResult(
        await submitRegistration({
          ...form,
          dietaryPreferences,
          specialAssistance,
          consent,
          documentationConsent,
          ...(turnstileToken ? { turnstileToken } : {}),
        }),
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    } finally {
      // A Turnstile token is single-use, whether or not the attempt worked.
      setTurnstileReset((n) => n + 1);
      setSubmitting(false);
    }
  };

  return (
    <div className="registration-page min-h-screen">
      <Nav />

      <header className="registration-hero hero-brand-gradient relative overflow-hidden border-b border-white/8 px-5 sm:px-8">
        <div className="relative z-10 py-14 sm:py-20 max-w-[780px] mx-auto text-center flex flex-col gap-4 items-center">
          <Eyebrow>NOV 10, 2026</Eyebrow>
          <h1 className="font-display text-[clamp(36px,5.5vw,60px)] font-extrabold m-0 tracking-[0.01em] uppercase text-glow">
            Register to Attend
          </h1>
          <p className="text-base sm:text-[17px] leading-[1.6] text-white/65 m-0">
            Reserve your seat at the {CONFERENCE.edition}.
          </p>
        </div>
      </header>

      <section className="py-10 sm:py-14 lg:py-16 px-5 sm:px-8 max-w-[1000px] mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1.5fr)_minmax(260px,1fr)] gap-4 items-start">
          {result ? (
            <div className="glass-panel p-6 sm:p-10 flex flex-col gap-2.5 items-start">
              <IconPin color="teal" />
              <h3 className="text-xl font-semibold m-0">
                {result.alreadyRegistered ? "You're already registered" : "You're registered"}, {form.firstName.trim()}.
              </h3>
              {result.alreadyRegistered ? (
                <p className="text-sm leading-[1.6] text-white/62 m-0">
                  {form.email.trim()} already has a registration, so we haven&apos;t created a second one and
                  we&apos;ve kept the details you first gave.{" "}
                  {result.resent
                    ? "We've sent your original confirmation again — your QR code is in that email."
                    : "We sent your confirmation a short while ago — check your inbox and spam folder, and try again later if it still hasn't arrived."}{" "}
                  To change your details, contact the secretariat.
                </p>
              ) : (
                <p className="text-sm leading-[1.6] text-white/62 m-0">
                  We&apos;ve sent a confirmation to {form.email.trim()}. Venue and travel details will be sent to
                  that address as soon as they&apos;re confirmed.
                </p>
              )}
              <p className="text-[13px] leading-[1.6] text-white/50 m-0 mt-1">
                Don&apos;t see the email in a few minutes? Check your spam folder, or contact{" "}
                <a href={`mailto:${GATES.email}`} className="text-gates-link no-underline font-semibold">
                  {GATES.email}
                </a>
                .
              </p>
              <div className="mt-1.5">
                <TextLink to="/conference">See conference details &rarr;</TextLink>
              </div>
            </div>
          ) : (
            <form className="glass-panel p-6 sm:p-8 flex flex-col gap-5" onSubmit={handleSubmit} noValidate>
              <div className="flex items-center justify-between gap-4 pb-4 border-b border-white/10">
                <span className="font-heading text-base font-semibold text-white/88">Registration form</span>
                <span className="text-[11px] text-white/45">
                  <span className="text-gates-orange">*</span> Required
                </span>
              </div>

              <p className="text-sm leading-[1.6] text-white/62 m-0">
                Attendance is by invitation. If you received this link in an invitation email, complete the form
                below to confirm your attendance.
              </p>

              <fieldset className="border-0 m-0 p-0 flex flex-col gap-4">
                <legend className={legendClass}>
                  <span className="text-gates-link mr-2">01</span>Personal details
                </legend>
                <div className="grid grid-cols-1 sm:grid-cols-[minmax(0,1fr)_88px_minmax(0,1fr)] gap-4">
                  <Field id="firstName" label="First name" required>
                    <input
                      id="firstName"
                      className={inputClass}
                      type="text"
                      value={form.firstName}
                      onChange={setField("firstName")}
                      maxLength={REGISTRATION_LIMITS.name}
                      autoComplete="given-name"
                      placeholder="Juan"
                      required
                    />
                  </Field>
                  <Field id="middleInitial" label="M.I.">
                    <input
                      id="middleInitial"
                      className={`${inputClass} uppercase`}
                      type="text"
                      value={form.middleInitial}
                      onChange={setMiddleInitial}
                      autoComplete="additional-name"
                      placeholder="D"
                    />
                  </Field>
                  <Field id="lastName" label="Last name" required>
                    <input
                      id="lastName"
                      className={inputClass}
                      type="text"
                      value={form.lastName}
                      onChange={setField("lastName")}
                      maxLength={REGISTRATION_LIMITS.name}
                      autoComplete="family-name"
                      placeholder="Dela Cruz"
                      required
                    />
                  </Field>
                </div>
                <Field id="nickname" label="Nickname" hint="Optional. How you'd like to be called — printed on your name tag.">
                  <input
                    id="nickname"
                    className={inputClass}
                    type="text"
                    value={form.nickname}
                    onChange={setField("nickname")}
                    maxLength={REGISTRATION_LIMITS.nickname}
                    autoComplete="nickname"
                    placeholder="e.g. Jun"
                  />
                </Field>
                <Field
                  id="email"
                  label="Email address"
                  required
                  hint="Your confirmation, and later the venue details, are sent here."
                >
                  <input
                    id="email"
                    className={inputClass}
                    type="email"
                    value={form.email}
                    onChange={setField("email")}
                    autoComplete="email"
                    placeholder="name@agency.gov.ph"
                    required
                  />
                </Field>
                <Field id="mobile" label="Mobile number" required>
                  <input
                    id="mobile"
                    className={inputClass}
                    type="tel"
                    inputMode="tel"
                    value={form.mobile}
                    onChange={setField("mobile")}
                    maxLength={REGISTRATION_LIMITS.mobile}
                    autoComplete="tel"
                    placeholder="09XX XXX XXXX"
                    required
                  />
                </Field>
              </fieldset>

              <fieldset className="border-0 m-0 p-0 flex flex-col gap-4 border-t border-white/8 pt-5">
                <legend className={legendClass}>
                  <span className="text-gates-link mr-2">02</span>Agency &amp; position
                </legend>
                <Field id="agency" label="Agency / Organization" required>
                  <input
                    id="agency"
                    className={inputClass}
                    type="text"
                    value={form.agency}
                    onChange={setField("agency")}
                    maxLength={REGISTRATION_LIMITS.agency}
                    autoComplete="organization"
                    placeholder="e.g. DOST-ASTI, DOST-PAGASA, DOST Regional Office No. 3"
                    required
                  />
                </Field>
                <Field id="division" label="Division / Section" hint="Optional. Leave blank if not applicable.">
                  <input
                    id="division"
                    className={inputClass}
                    type="text"
                    value={form.division}
                    onChange={setField("division")}
                    maxLength={REGISTRATION_LIMITS.division}
                    placeholder="e.g. Remote Sensing and Data Science Division"
                  />
                </Field>
                <Field id="designation" label="Position / Designation" required>
                  <input
                    id="designation"
                    className={inputClass}
                    type="text"
                    value={form.designation}
                    onChange={setField("designation")}
                    maxLength={REGISTRATION_LIMITS.designation}
                    autoComplete="organization-title"
                    placeholder="e.g. Science Research Specialist II"
                    required
                  />
                </Field>
              </fieldset>

              <fieldset className="border-0 m-0 p-0 flex flex-col gap-3.5 border-t border-white/8 pt-5">
                <legend className={legendClass}>
                  <span className="text-gates-link mr-2">03</span>Dietary needs
                </legend>
                <p className={hintClass}>Optional. Used only to arrange catering.</p>
                <Checklist
                  options={DIETARY_OPTIONS}
                  selected={dietaryPreferences}
                  onToggle={(o) => setDietaryPreferences((current) => toggle(current, o))}
                />
                <Field id="foodAllergies" label="Food allergies or other specific diet">
                  <textarea
                    id="foodAllergies"
                    className={`${inputClass} min-h-[72px] resize-y`}
                    value={form.foodAllergies}
                    onChange={setField("foodAllergies")}
                    maxLength={REGISTRATION_LIMITS.foodAllergies}
                    placeholder="e.g. allergic to shellfish and peanuts; gluten-free"
                  />
                </Field>
              </fieldset>

              <fieldset className="border-0 m-0 p-0 flex flex-col gap-3.5 border-t border-white/8 pt-5">
                <legend className={legendClass}>
                  <span className="text-gates-link mr-2">04</span>Special assistance
                </legend>
                <p className={hintClass}>
                  Optional. Used only to arrange access and seating &mdash; please don&apos;t include medical
                  details.
                </p>
                <Checklist
                  options={ASSISTANCE_OPTIONS}
                  selected={specialAssistance}
                  onToggle={(o) => setSpecialAssistance((current) => toggle(current, o))}
                />
                <Field id="assistanceNeeded" label="Specific assistance needed">
                  <textarea
                    id="assistanceNeeded"
                    className={`${inputClass} min-h-[72px] resize-y`}
                    value={form.assistanceNeeded}
                    onChange={setField("assistanceNeeded")}
                    maxLength={REGISTRATION_LIMITS.assistanceNeeded}
                    placeholder="e.g. wheelchair ramp access, sign language interpreter, a seat near the exit"
                  />
                </Field>
              </fieldset>

              <fieldset className="border-0 m-0 p-0 flex flex-col gap-3.5 border-t border-white/8 pt-5">
                <legend className={legendClass}>
                  <span className="text-gates-link mr-2">05</span>Consent
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
                    className={checkboxClass}
                  />
                  <span className="text-[13px] leading-[1.55] text-white/70">
                    I consent to GATES collecting and processing the information in this form &mdash; including any
                    dietary, allergy, or assistance details I choose to share &mdash; to manage conference
                    attendance and logistics, per the{" "}
                    <Link to="/privacy" className="text-gates-link underline">
                      privacy notice
                    </Link>
                    . <span className="text-gates-orange">*</span>
                  </span>
                </label>
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={documentationConsent}
                    onChange={(e) => setDocumentationConsent(e.target.checked)}
                    className={checkboxClass}
                  />
                  <span className="text-[13px] leading-[1.55] text-white/70">
                    Separately, I consent to being photographed and recorded at the conference for GATES information
                    and advocacy purposes.
                  </span>
                </label>
              </fieldset>

              {siteKey && (
                <Turnstile siteKey={siteKey} resetKey={turnstileReset} onToken={setTurnstileToken} />
              )}

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
                className="btn-primary w-full sm:w-auto px-[26px] py-3.5 rounded-full text-white font-bold text-[15px] border-none cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {submitting ? "Registering…" : "Register"}
              </button>
              <p className={hintClass}>
                Questions? Contact{" "}
                <a href={`mailto:${GATES.email}`} className="text-gates-link no-underline font-semibold">
                  {GATES.email}
                </a>
                .
              </p>
            </form>
          )}

          <div className="glass-panel p-6 sm:p-7 flex flex-col gap-2.5 lg:sticky lg:top-24">
            <Eyebrow>EVENT INFO</Eyebrow>
            <div className="grid grid-cols-[auto_minmax(0,1fr)] gap-4 text-sm text-white/80">
              <span className="text-white/50">Date</span>
              <span className="text-right">{CONFERENCE.dateLabel}</span>
            </div>
            <div className="grid grid-cols-[auto_minmax(0,1fr)] gap-4 text-sm text-white/80">
              <span className="text-white/50">Venue</span>
              <span className="text-right">TBD</span>
            </div>
            <div className="h-px bg-white/10 my-1.5" />
            <Eyebrow>INCLUDES</Eyebrow>
            <p className="text-sm leading-[1.5] text-white/60 m-0">
              Keynotes &middot; Use Case Showcase &middot; Geospatial Gallery &middot; GeoHack 2026 Awarding Ceremony
            </p>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
