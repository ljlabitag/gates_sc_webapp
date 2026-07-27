import { Link } from "react-router-dom";
import gatesLogo from "../assets/logos/gates-lockup-horizontal.png";
import dostLogo from "../assets/logos/dost-logo-horizontal.png";
import { DOST, GATES, SOCIALS } from "../data/org";

const links = [
  { to: "/", label: "Home" },
  { to: "/conference", label: "Conference" },
  { to: "/hackathon", label: "Hackathon" },
  { to: "/program", label: "About GATES" },
  { to: "/registration", label: "Register" },
];

const headingClass = "font-heading text-[11px] font-semibold uppercase tracking-[0.12em] text-white/55 mb-3.5";
const bodyLinkClass =
  "text-white/68 no-underline text-sm hover:text-white/95 transition-colors rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30";
/** Equal rendered height keeps both horizontal marks balanced without distortion. */
const logoClass = "h-10 w-auto max-w-full object-contain object-left";
const brandPairClass =
  "flex flex-col items-start gap-2.5 no-underline rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30";
const sloganClass = "font-heading text-[10px] font-semibold uppercase tracking-[0.11em] leading-[1.5] text-white/50 m-0";

function SocialIcon({ platform }: { platform: string }) {
  return (
    <span
      aria-hidden="true"
      className={`social-brand-icon ${
        platform === "Facebook" ? "social-brand-icon-facebook" : "social-brand-icon-instagram"
      }`}
    >
      {platform === "Facebook" ? "f" : null}
    </span>
  );
}

export default function Footer() {
  return (
    <footer className="site-footer border-t border-white/8 px-5 sm:px-8 pt-10 sm:pt-12 pb-7 sm:pb-8">
      <div className="max-w-[1120px] mx-auto">
        {/* The brand block is the first column rather than its own centred band, so
            everything in the footer shares one left edge. */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-[2.1fr_0.75fr_1fr_1.2fr] gap-x-8 gap-y-9 lg:gap-x-10 pb-9">
          <div className="sm:col-span-2 lg:col-span-1">
            <div className="flex flex-wrap items-start gap-x-4 gap-y-6">
              <a
                href={DOST.website.url}
                target="_blank"
                rel="noopener noreferrer"
                className={`${brandPairClass} w-[250px] max-w-full`}
              >
                <img src={dostLogo} alt={DOST.name} className={logoClass} />
              </a>
              <Link to="/program" className={`${brandPairClass} w-[150px] max-w-full`}>
                <img src={gatesLogo} alt={GATES.shortName} className={logoClass} />
                <p className={sloganClass}>{GATES.tagline}</p>
              </Link>
            </div>
          </div>

          <nav aria-labelledby="footer-explore">
            <h2 id="footer-explore" className={headingClass}>
              Explore
            </h2>
            <ul className="list-none m-0 p-0 grid grid-cols-2 sm:grid-cols-1 gap-x-6 gap-y-2.5">
              {links.map((link) => (
                <li key={link.to}>
                  <Link to={link.to} className={bodyLinkClass}>
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <div>
            <h2 className={headingClass}>Contact</h2>
            <ul className="list-none m-0 p-0 flex flex-col gap-2.5">
              <li>
                <a href={`mailto:${GATES.email}`} className={`${bodyLinkClass} break-all`}>
                  {GATES.email}
                </a>
              </li>
              <li>
                <a href={DOST.website.url} target="_blank" rel="noopener noreferrer" className={bodyLinkClass}>
                  {DOST.website.label}
                </a>
              </li>
            </ul>

            <h2 className={`${headingClass} mt-7`}>Follow DOST GATES</h2>
            <ul className="list-none m-0 p-0 flex flex-col gap-2">
              {SOCIALS.map((social) => (
                <li key={social.platform}>
                  <a
                    href={social.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`${bodyLinkClass} inline-flex items-center gap-2.5`}
                  >
                    <SocialIcon platform={social.platform} />
                    <span>
                      <span className="block text-[12px] leading-tight text-white/45">{social.platform}</span>
                      <span className="block leading-tight mt-0.5">{social.handle}</span>
                    </span>
                    <span aria-hidden="true" className="text-white/40 text-[11px]">
                      &#8599;
                    </span>
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div className="sm:col-span-2 lg:col-span-1">
            <h2 className={headingClass}>Program office</h2>
            <address className="text-sm leading-[1.7] text-white/68 not-italic m-0">
              <span className="block text-white/80">{DOST.office}</span>
              {DOST.addressLines.map((line) => (
                <span key={line} className="block">
                  {line}
                </span>
              ))}
            </address>
          </div>
        </div>

        {/* Legal */}
        <div className="pt-6 border-t border-white/8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-white/50 text-xs">
          <span>
            &copy; 2026 {DOST.abbreviation} {GATES.shortName}. All rights reserved.
          </span>
          <a
            href="#top"
            className="text-white/55 no-underline hover:text-white/90 transition-colors rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30"
          >
            Back to top &#8593;
          </a>
        </div>
      </div>
    </footer>
  );
}
