import { useState } from "react";
import { Link, NavLink } from "react-router-dom";
import gatesLogo from "../assets/logos/gates-lockup-horizontal.png";

const pages = [
  { to: "/", label: "Home" },
  { to: "/conference", label: "Conference" },
  { to: "/hackathon", label: "Hackathon" },
  { to: "/program", label: "About GATES" },
];

const linkBase = "px-3.5 py-2 rounded-full text-sm font-sans no-underline border transition-colors";
const linkActive = "text-white/96 bg-white/10 border-white/16";
const linkInactive = "text-white/62 bg-transparent border-transparent hover:text-white/85";

export default function Nav() {
  const [menuOpen, setMenuOpen] = useState(false);

  // id="top" is the target for the footer's "Back to top" link.
  return (
    <nav id="top" className="sticky top-0 z-50 glass-nav border-b border-white/8">
      <div className="flex items-center justify-between gap-3 sm:gap-6 px-5 sm:px-8 py-3.5">
        <Link to="/" className="font-sans font-bold text-[19px] tracking-wide text-white/96 no-underline">
          <img src={gatesLogo} alt="GATES" className="h-10 w-auto" />
        </Link>

        <div className="hidden md:flex items-center gap-1.5 flex-wrap">
          {pages.map((p) => (
            <NavLink
              key={p.to}
              to={p.to}
              end={p.to === "/"}
              className={({ isActive }) => `${linkBase} ${isActive ? linkActive : linkInactive}`}
            >
              {p.label}
            </NavLink>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <Link
            to="/registration"
            className="nav-register-gradient px-[18px] py-[9px] rounded-full text-sm font-semibold font-sans no-underline text-white"
          >
            Register
          </Link>
          <button
            type="button"
            aria-label="Toggle navigation menu"
            onClick={() => setMenuOpen((o) => !o)}
            className="md:hidden px-3 py-2 rounded-full text-sm font-sans text-white/85 border border-white/16"
          >
            Menu
          </button>
        </div>
      </div>

      {menuOpen && (
        <div className="md:hidden flex flex-col gap-1.5 px-5 pb-4">
          {pages.map((p) => (
            <NavLink
              key={p.to}
              to={p.to}
              end={p.to === "/"}
              onClick={() => setMenuOpen(false)}
              className={({ isActive }) => `${linkBase} ${isActive ? linkActive : linkInactive} text-center`}
            >
              {p.label}
            </NavLink>
          ))}
        </div>
      )}
    </nav>
  );
}
