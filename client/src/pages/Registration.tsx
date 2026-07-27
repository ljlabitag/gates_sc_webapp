import { useState, type FormEvent } from "react";
import Nav from "../components/Nav";
import Footer from "../components/Footer";
import { Eyebrow, TextLink } from "../components/ui";
import { submitRegistration } from "../lib/api";
import { IS_PREVIEW, PREVIEW_FORM_MESSAGE } from "../lib/preview";

const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

const inputClass =
  "w-full px-3.5 py-3 rounded-xl border border-white/16 bg-white/5 text-white/94 text-[15px] font-sans focus:outline-none focus:ring-2 focus:ring-gates-blue focus:border-gates-blue";

export default function Registration() {
  const [form, setForm] = useState({ name: "", email: "", org: "", needs: "" });
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const setField = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm((s) => ({ ...s, [key]: e.target.value }));
    if (error) setError("");
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.email.trim() || !EMAIL_RE.test(form.email)) {
      setError("Please enter your name and a valid email.");
      return;
    }
    if (IS_PREVIEW) {
      setError(PREVIEW_FORM_MESSAGE);
      return;
    }
    setSubmitting(true);
    setError("");
    try {
      await submitRegistration(form);
      setSubmitted(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="registration-page min-h-screen">
      <Nav />

      <header className="registration-hero hero-brand-gradient relative overflow-hidden border-b border-white/8 px-5 sm:px-8">
        <div className="relative z-10 py-14 sm:py-20 max-w-[780px] mx-auto text-center flex flex-col gap-4 items-center">
          <Eyebrow>OCT 16, 2026</Eyebrow>
          <h1 className="font-display text-[clamp(36px,5.5vw,60px)] font-extrabold m-0 tracking-[0.01em] uppercase text-glow">
            Register to Attend
          </h1>
          <p className="text-base sm:text-[17px] leading-[1.6] text-white/65 m-0">
            Reserve your seat at the GATES Stakeholder Conference.
          </p>
        </div>
      </header>

      <section className="py-10 sm:py-14 lg:py-16 px-5 sm:px-8 max-w-[1000px] mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1.5fr)_minmax(260px,1fr)] gap-4 items-start">
          {submitted ? (
            <div className="glass-panel p-6 sm:p-10 flex flex-col gap-2.5 items-start">
              <div className="w-[34px] h-[34px] rounded-[10px] bg-gates-blue mb-1" />
              <h3 className="text-xl font-semibold m-0">You&apos;re registered, {form.name}!</h3>
              <p className="text-sm leading-[1.5] text-white/60 m-0">
                A confirmation has been saved for {form.email}. We&apos;ll follow up with venue and schedule details
                as they&apos;re confirmed.
              </p>
              <div className="mt-1.5">
                <TextLink to="/">Back to Home &rarr;</TextLink>
              </div>
            </div>
          ) : (
            <form className="glass-panel p-6 sm:p-8 flex flex-col gap-[18px]" onSubmit={handleSubmit} noValidate>
              <div className="flex items-center justify-between gap-4 pb-4 border-b border-white/10">
                <span className="font-heading text-base font-semibold text-white/88">Attendee information</span>
                <span className="text-[11px] text-white/45">
                  <span className="text-gates-orange">*</span> Required
                </span>
              </div>
              <div className="flex flex-col gap-2">
                <label htmlFor="registration-name" className="text-[13px] text-white/60 font-semibold">
                  Name <span className="text-gates-orange">*</span>
                </label>
                <input
                  id="registration-name"
                  className={inputClass}
                  type="text"
                  value={form.name}
                  onChange={setField("name")}
                  autoComplete="name"
                  placeholder="Full name"
                  required
                />
              </div>
              <div className="flex flex-col gap-2">
                <label htmlFor="registration-email" className="text-[13px] text-white/60 font-semibold">
                  Email <span className="text-gates-orange">*</span>
                </label>
                <input
                  id="registration-email"
                  className={inputClass}
                  type="email"
                  value={form.email}
                  onChange={setField("email")}
                  autoComplete="email"
                  placeholder="you@organization.org"
                  required
                />
              </div>
              <div className="flex flex-col gap-2">
                <label htmlFor="registration-organization" className="text-[13px] text-white/60 font-semibold">
                  Organization / Role
                </label>
                <input
                  id="registration-organization"
                  className={inputClass}
                  type="text"
                  value={form.org}
                  onChange={setField("org")}
                  autoComplete="organization"
                  placeholder="Organization and role"
                />
              </div>
              <div className="flex flex-col gap-2">
                <label htmlFor="registration-needs" className="text-[13px] text-white/60 font-semibold">
                  Dietary / accessibility needs
                </label>
                <textarea
                  id="registration-needs"
                  className={`${inputClass} min-h-[80px] resize-y`}
                  value={form.needs}
                  onChange={setField("needs")}
                  placeholder="Optional"
                />
              </div>
              {error && (
                <div
                  role="alert"
                  aria-live="assertive"
                  className="rounded-xl border border-gates-error/35 bg-gates-error/8 px-4 py-3 text-red-300 text-[13px] leading-[1.5]"
                >
                  {error}
                </div>
              )}
              <button type="submit" disabled={submitting} className="btn-primary w-full sm:w-auto px-[26px] py-3.5 rounded-full text-white font-bold text-[15px] border-none cursor-pointer mt-1.5 disabled:opacity-60 disabled:cursor-not-allowed">
                {submitting ? "Submitting…" : "Submit Registration"}
              </button>
            </form>
          )}

          <div className="glass-panel p-6 sm:p-7 flex flex-col gap-2.5 lg:sticky lg:top-24">
            <Eyebrow>EVENT INFO</Eyebrow>
            <div className="grid grid-cols-[auto_minmax(0,1fr)] gap-4 text-sm text-white/80">
              <span className="text-white/50">Date</span>
              <span className="text-right">Oct 16, 2026</span>
            </div>
            <div className="grid grid-cols-[auto_minmax(0,1fr)] gap-4 text-sm text-white/80">
              <span className="text-white/50">Venue</span>
              <span className="text-right">TBD</span>
            </div>
            <div className="h-px bg-white/10 my-1.5" />
            <Eyebrow>INCLUDES</Eyebrow>
            <p className="text-sm leading-[1.5] text-white/60 m-0">
              Keynotes &middot; use case showcase &middot; Geospatial Gallery &middot; awarding ceremony
            </p>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
