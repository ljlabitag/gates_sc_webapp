import { useCallback, useEffect, useRef, useState, type KeyboardEvent } from "react";
import logomark from "../assets/logos/gates-logomark.png";
import { PROJECTS, type Quadrant } from "../data/projects";
import { ProjectCard } from "./ui";

/**
 * Interactive "component projects" view.
 *
 * The GATES logomark sits on the right; each of its four sails is a hit target
 * that selects a project shown in the panel on the left. Hovering dims the other
 * sails and surfaces a short label in the (empty) corner nearest that sail.
 *
 * Clicking turns the mark about its vertical axis. The turn is a *half* rotation
 * onto a mirrored back face carrying the same artwork, which buys two things:
 * the mark always comes to rest reading correctly, and the exact midpoint of the
 * turn is the edge-on frame where the mark is invisible — so the panel swap is
 * hidden inside the motion rather than crossfaded over it. The easing curve is
 * symmetric about 50%, so midpoint-in-time really is midpoint-in-rotation.
 *
 * The mark is a raster asset, so individual sails can't be recoloured. Instead
 * a dim base copy is layered under a full-brightness copy masked to a single
 * 90° wedge — the highlight therefore follows the artwork exactly.
 */

/** Duration of one half-turn. */
const SPIN_MS = 1400;
/** Symmetric ease-in-out, so progress is exactly 50% at SPIN_MS / 2. */
const SPIN_EASING = "cubic-bezier(0.65, 0, 0.35, 1)";
/** The edge-on frame: the mark has no width here, so the swap is invisible. */
const SWAP_MS = SPIN_MS / 2;

/**
 * Start angle of each quadrant's mask wedge. CSS conic-gradient starts at 12
 * o'clock and runs clockwise, which lines up with NE → SE → SW → NW.
 */
const QUADRANT_FROM: Record<Quadrant, number> = { NE: 0, SE: 90, SW: 180, NW: 270 };

/** Hit target position — each is a quarter of the square logo box. */
const HIT_POSITION: Record<Quadrant, string> = {
  NE: "top-0 right-0",
  SE: "bottom-0 right-0",
  SW: "bottom-0 left-0",
  NW: "top-0 left-0",
};

/**
 * Where the label card sits. The star is four-pointed, so the box corners are
 * empty — parking the card there never covers the mark.
 */
const LABEL_POSITION: Record<Quadrant, string> = {
  NE: "top-0 right-0 text-right",
  SE: "bottom-0 right-0 text-right",
  SW: "bottom-0 left-0 text-left",
  NW: "top-0 left-0 text-left",
};

/** Soft-edged 90° wedge isolating one sail. Feathered ~14° so edges don't read as cuts. */
function sailMask(quadrant: Quadrant) {
  const gradient =
    `conic-gradient(from ${QUADRANT_FROM[quadrant]}deg at 50% 50%,` +
    " rgba(0,0,0,0) 0deg, rgba(0,0,0,1) 14deg, rgba(0,0,0,1) 76deg, rgba(0,0,0,0) 90deg)";
  return { maskImage: gradient, WebkitMaskImage: gradient } as const;
}

/**
 * One side of the turning mark: a dimmed full copy with a full-brightness copy
 * masked over the highlighted sail.
 *
 * The back face is pre-rotated 180°, so when the container reaches 180° its net
 * transform is a full 360° — the artwork and its mask both read un-mirrored at
 * rest. No flipped duplicate of the asset is needed.
 */
function MarkFace({ quadrant, glow, back = false }: { quadrant: Quadrant; glow: string; back?: boolean }) {
  return (
    <div
      className="absolute inset-0"
      style={{
        backfaceVisibility: "hidden",
        WebkitBackfaceVisibility: "hidden",
        transform: back ? "rotateY(180deg)" : undefined,
      }}
    >
      <img
        src={logomark}
        alt=""
        aria-hidden="true"
        draggable={false}
        className="absolute inset-0 w-full h-full opacity-30"
      />
      {/* The glow sits on a wrapper OUTSIDE the mask so the halo can bleed past the
          wedge edge. Masking and filtering the same element would clip it flat. */}
      <div
        className="absolute inset-0 transition-[filter] duration-300"
        style={{ filter: `drop-shadow(0 0 10px ${glow}b3) drop-shadow(0 0 36px ${glow}8c)` }}
      >
        <div className="absolute inset-0" style={sailMask(quadrant)}>
          <img
            src={logomark}
            alt=""
            aria-hidden="true"
            draggable={false}
            className="w-full h-full"
            style={{ filter: "brightness(1.22) saturate(1.08)" }}
          />
        </div>
      </div>
    </div>
  );
}

export default function ProjectShowcase() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);
  const [rotation, setRotation] = useState(0);
  const [panelVisible, setPanelVisible] = useState(true);
  const [animate, setAnimate] = useState(true);

  const reduceMotion = useRef(false);
  const timers = useRef<number[]>([]);
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);

  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => {
      reduceMotion.current = query.matches;
      setAnimate(!query.matches);
    };
    sync();
    query.addEventListener("change", sync);
    return () => query.removeEventListener("change", sync);
  }, []);

  // Any pending swap/spin timer must not fire after unmount or a second click.
  const clearTimers = useCallback(() => {
    timers.current.forEach((id) => window.clearTimeout(id));
    timers.current = [];
  }, []);

  useEffect(() => clearTimers, [clearTimers]);

  const select = useCallback(
    (index: number) => {
      clearTimers();

      if (reduceMotion.current) {
        setActiveIndex(index);
        setPanelVisible(true);
        return;
      }

      setRotation((current) => current + 180);

      // Re-selecting the live sail turns for feedback but leaves the panel alone.
      if (index === activeIndex) return;

      setPanelVisible(false);
      timers.current.push(
        window.setTimeout(() => {
          setActiveIndex(index);
          setPanelVisible(true);
        }, SWAP_MS),
      );
    },
    [activeIndex, clearTimers],
  );

  /** Roving-tabindex arrow key navigation, per the tabs pattern. */
  const onKeyDown = useCallback(
    (event: KeyboardEvent) => {
      const { key } = event;
      let next: number | null = null;

      if (key === "ArrowRight" || key === "ArrowDown") next = (activeIndex + 1) % PROJECTS.length;
      else if (key === "ArrowLeft" || key === "ArrowUp") next = (activeIndex - 1 + PROJECTS.length) % PROJECTS.length;
      else if (key === "Home") next = 0;
      else if (key === "End") next = PROJECTS.length - 1;

      if (next === null) return;
      event.preventDefault();
      select(next);
      tabRefs.current[next]?.focus();
    },
    [activeIndex, select],
  );

  const active = PROJECTS[activeIndex];
  // Hover wins the label and glow; otherwise the selected project holds them.
  const highlighted = PROJECTS[hoverIndex ?? activeIndex];
  const showingHover = hoverIndex !== null && hoverIndex !== activeIndex;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 lg:gap-10 items-center">
      {/* Logomark selector — left on desktop, and first on mobile since it's the control */}
      <div className="lg:col-span-5">
        <div className="relative w-full max-w-[420px] mx-auto aspect-square" style={{ perspective: "1200px" }}>
          {/* Turning artwork. The hit areas below deliberately do NOT rotate: every
              turn is a multiple of 180°, so the resting face always reads un-mirrored
              and screen position always maps to the same sail. */}
          <div
            className="absolute inset-0"
            style={{
              transformStyle: "preserve-3d",
              transform: `rotateY(${rotation}deg)`,
              // Always applied so a timer can never strip the transition mid-turn.
              transition: animate ? `transform ${SPIN_MS}ms ${SPIN_EASING}` : undefined,
              willChange: "transform",
            }}
          >
            <MarkFace quadrant={highlighted.quadrant} glow={highlighted.glow} />
            <MarkFace quadrant={highlighted.quadrant} glow={highlighted.glow} back />
          </div>

          {/* Hit areas / tabs */}
          <div
            role="tablist"
            aria-label="GATES component projects"
            onKeyDown={onKeyDown}
            className="absolute inset-0"
          >
            {PROJECTS.map((project, index) => (
              <button
                key={project.number}
                ref={(node) => {
                  tabRefs.current[index] = node;
                }}
                type="button"
                role="tab"
                id={`gates-project-tab-${project.number}`}
                aria-selected={index === activeIndex}
                aria-controls="gates-project-panel"
                tabIndex={index === activeIndex ? 0 : -1}
                onClick={() => select(index)}
                onMouseEnter={() => setHoverIndex(index)}
                onMouseLeave={() => setHoverIndex((current) => (current === index ? null : current))}
                onFocus={() => setHoverIndex(index)}
                onBlur={() => setHoverIndex((current) => (current === index ? null : current))}
                className={`absolute w-1/2 h-1/2 ${HIT_POSITION[project.quadrant]} cursor-pointer bg-transparent border-0 p-0 rounded-2xl focus:outline-none focus-visible:ring-2 focus-visible:ring-white/40`}
              >
                <span className="sr-only">
                  Project {project.number}: {project.name} — led by {project.leadShort}
                </span>
              </button>
            ))}
          </div>

          {/* Label card, parked in the empty corner nearest the highlighted sail */}
          <div
            aria-hidden="true"
            className={`absolute ${LABEL_POSITION[highlighted.quadrant]} pointer-events-none glass-panel rounded-xl px-3 py-2 max-w-[47%] transition-opacity duration-200 ${
              showingHover ? "opacity-100" : "opacity-85"
            }`}
          >
            <div className="font-mono text-[9px] uppercase tracking-[0.12em] text-white/45">
              Project {highlighted.number}
            </div>
            <div className="text-[13px] font-semibold leading-tight mt-0.5">{highlighted.shortName}</div>
            <div className="text-[10px] leading-tight text-white/55 mt-1">{highlighted.leadShort}</div>
          </div>
        </div>

        <p className="mt-4 sm:mt-6 text-center font-mono text-[11px] leading-[1.6] text-white/45 max-w-[380px] mx-auto">
          Select a sail to explore each project
        </p>
        <p className="mt-2 text-center text-[12px] leading-[1.6] text-white/38 max-w-[380px] mx-auto min-h-[42px]">
          {highlighted.sailMotif}
        </p>
      </div>

      {/* Detail panel */}
      <div className="lg:col-span-7">
        <div
          id="gates-project-panel"
          role="tabpanel"
          aria-labelledby={`gates-project-tab-${active.number}`}
          tabIndex={0}
          className={`transition-opacity duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/25 rounded-[20px] ${
            panelVisible ? "opacity-100" : "opacity-0"
          }`}
        >
          <ProjectCard project={active} activitiesOpen className="lg:min-h-[420px]" />
        </div>
      </div>
    </div>
  );
}
