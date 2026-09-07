import Nav from "../components/Nav";
import Footer from "../components/Footer";
import { Eyebrow } from "../components/ui";
import { GATES } from "../data/org";
import { CONFERENCE } from "../data/conference";
import { usePageMeta } from "../hooks/usePageMeta";

export default function Registration() {
  usePageMeta(
    "Register — GATES Stakeholder Conference 2026",
    "Attendance at the GATES Stakeholder Conference is by invitation. Invited agencies and offices receive a registration code in September.",
  );

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
            Reserve your seat at the GATES Stakeholder Conference.
          </p>
        </div>
      </header>

      <section className="py-10 sm:py-14 lg:py-16 px-5 sm:px-8 max-w-[1000px] mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1.5fr)_minmax(260px,1fr)] gap-4 items-start">
          <div className="glass-panel p-6 sm:p-10 flex flex-col gap-2.5 items-start">
            <div className="w-[34px] h-[34px] rounded-[10px] bg-gates-blue mb-1" />
            <h3 className="text-xl font-semibold m-0">Attendance is by invitation</h3>
            <p className="text-sm leading-[1.6] text-white/62 m-0">
              Invited agencies and offices will receive a registration code in September. For enquiries, contact{" "}
              <a href={`mailto:${GATES.email}`} className="text-gates-link no-underline font-semibold">
                {GATES.email}
              </a>
              .
            </p>
          </div>

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
              Keynotes &middot; use case showcase &middot; Geospatial Gallery &middot; awarding ceremony
            </p>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
