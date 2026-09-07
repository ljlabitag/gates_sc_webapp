import Nav from "../components/Nav";
import Footer from "../components/Footer";
import { Eyebrow, PageSection, SectionHead, SectionNav } from "../components/ui";
import { usePageMeta } from "../hooks/usePageMeta";
import { GATES } from "../data/org";

const SECTIONS = [
  { id: "collected", label: "What we collect" },
  { id: "basis", label: "Legal basis" },
  { id: "access", label: "Who can access it" },
  { id: "retention", label: "Retention" },
  { id: "rights", label: "Your rights" },
  { id: "contact", label: "Contact & complaints" },
];

const bodyText = "text-[15px] sm:text-[16px] leading-[1.7] text-white/68";

export default function Privacy() {
  usePageMeta(
    "Privacy Notice — GATES Program",
    "How the GATES Program collects, uses, and protects personal data submitted through hackathon proposals and conference registration, under the Philippine Data Privacy Act (RA 10173).",
  );

  return (
    <div className="privacy-page min-h-screen">
      <Nav />

      <header className="hero-brand-gradient relative overflow-hidden border-b border-white/8 px-5 sm:px-8">
        <div className="relative z-10 max-w-[780px] mx-auto py-14 sm:py-20 text-center flex flex-col gap-[18px] items-center">
          <Eyebrow>DATA PRIVACY ACT OF 2012 (RA 10173)</Eyebrow>
          <h1 className="font-display text-[clamp(32px,5vw,54px)] font-extrabold m-0 tracking-[0.01em] uppercase text-glow">
            Privacy Notice
          </h1>
          <p className="text-[16px] sm:text-lg leading-[1.6] text-white/70 m-0 max-w-[640px]">
            This notice explains what personal data the GATES Program collects through this website, why, and what
            rights you have over it.
          </p>
          <p className="font-mono text-[11px] text-white/45 m-0">Notice version: 2026-08-13</p>
        </div>
      </header>

      <SectionNav items={SECTIONS} />

      <PageSection id="collected" labelledBy="collected-title" width="narrow">
        <SectionHead eyebrow="WHAT WE COLLECT" title="Information we collect, and why" titleId="collected-title" />
        <div className={`flex flex-col gap-5 ${bodyText}`}>
          <p className="m-0">
            <strong className="text-white/85 font-semibold">Hackathon proposal submissions.</strong> Team name,
            agency or office, project title and domain, the team leader's name, position, email, and mobile number,
            the names and roles of teammates the leader lists, and the proposal document itself. We use this to
            evaluate and screen proposals, notify your team of results, and coordinate the hackathon program.
          </p>
          <p className="m-0">
            <strong className="text-white/85 font-semibold">Conference registration.</strong> Attendance is currently
            by invitation — see the{" "}
            <a href="/registration" className="text-gates-link no-underline font-semibold">
              registration page
            </a>
            . When registration opens to invited agencies, it will collect name, email, organization/role, and any
            dietary or accessibility needs, used to manage attendance and logistics for the conference.
          </p>
          <p className="m-0">
            We do not collect payment information, government IDs, or any data beyond what a form on this site
            explicitly asks for.
          </p>
        </div>
      </PageSection>

      <PageSection id="basis" labelledBy="basis-title" width="narrow">
        <SectionHead eyebrow="LEGAL BASIS" title="Why we're allowed to process this" titleId="basis-title" />
        <div className={`flex flex-col gap-5 ${bodyText}`}>
          <p className="m-0">
            We process personal data on the basis of your <strong className="text-white/85 font-semibold">consent</strong>,
            given at the point of submission, and — for finalist teams and registered attendees — because processing
            is necessary to administer your participation in the hackathon or conference.
          </p>
          <p className="m-0">
            Consent to have your information processed is separate from consent to be photographed or filmed for
            GATES documentation and advocacy purposes. Both forms ask for these independently: you can decline
            documentation consent and still take part.
          </p>
          <p className="m-0">
            If you submit a hackathon proposal as team leader, you're also asked to confirm that each named teammate
            and endorsing head has been informed their details are being submitted, and how they'll be used — since
            they don't visit this site themselves and can't give consent directly here.
          </p>
        </div>
      </PageSection>

      <PageSection id="access" labelledBy="access-title" width="narrow">
        <SectionHead eyebrow="WHO CAN ACCESS IT" title="Access is authenticated and logged" titleId="access-title" />
        <div className={`flex flex-col gap-5 ${bodyText}`}>
          <p className="m-0">
            Submitted data is visible only to GATES Program organizers and secretariat staff with admin access to
            this system, and to subject matter experts during proposal screening. Every time an admin views a list,
            exports data, or downloads a proposal file, that access is recorded — who, what, and when — so it can be
            audited.
          </p>
          <p className="m-0">We do not sell, rent, or share your data with third parties for marketing purposes.</p>
        </div>
      </PageSection>

      <PageSection id="retention" labelledBy="retention-title" width="narrow">
        <SectionHead eyebrow="RETENTION & DISPOSAL" title="How long we keep it" titleId="retention-title" />
        <div className={`flex flex-col gap-5 ${bodyText}`}>
          <p className="m-0">
            We keep personal data only as long as necessary for the purposes described above — screening and running
            the hackathon, or managing conference attendance — after which it is securely deleted. Non-finalist
            proposals and contact details are held for a limited window after finalists are announced, primarily to
            handle appeals or replace a team that withdraws; finalist and attendee records are held longer, for
            program reporting.
          </p>
          <p className="m-0">
            Specific retention periods are being finalized with the DOST GATES program office. This section will be
            updated with exact timeframes once they're confirmed.
          </p>
        </div>
      </PageSection>

      <PageSection id="rights" labelledBy="rights-title" width="narrow">
        <SectionHead eyebrow="YOUR RIGHTS" title="What you can ask of us" titleId="rights-title" />
        <div className={`flex flex-col gap-5 ${bodyText}`}>
          <p className="m-0">Under the Data Privacy Act of 2012 (RA 10173), you have the right to:</p>
          <ul className="list-disc pl-5 flex flex-col gap-2 m-0">
            <li>Be informed that your personal data will be, is being, or was processed.</li>
            <li>Access your personal data on record with us.</li>
            <li>Object to processing, including withdrawing consent already given.</li>
            <li>Correct any inaccurate or outdated personal data.</li>
            <li>Request erasure or blocking of your data where the law allows it.</li>
            <li>Be indemnified for damages from unlawful processing.</li>
            <li>Data portability, where technically feasible.</li>
            <li>Lodge a complaint with the National Privacy Commission.</li>
          </ul>
          <p className="m-0">
            To exercise any of these, contact us using the details below and describe what you'd like us to do —
            we'll confirm what's possible given the data we hold.
          </p>
        </div>
      </PageSection>

      <PageSection id="contact" labelledBy="contact-title" width="narrow">
        <SectionHead eyebrow="CONTACT & COMPLAINTS" title="Get in touch, or file a complaint" titleId="contact-title" />
        <div className={`flex flex-col gap-5 ${bodyText}`}>
          <p className="m-0">
            For any privacy question, or to exercise a right listed above, contact the GATES Program at{" "}
            <a href={`mailto:${GATES.email}`} className="text-gates-link no-underline font-semibold">
              {GATES.email}
            </a>
            .
          </p>
          <p className="m-0">
            If you believe your data has been mishandled and we haven't resolved it to your satisfaction, you may
            file a complaint with the{" "}
            <a
              href="https://privacy.gov.ph"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gates-link no-underline font-semibold"
            >
              National Privacy Commission
            </a>
            .
          </p>
        </div>
      </PageSection>

      <Footer />
    </div>
  );
}
