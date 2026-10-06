import { useCallback, useEffect, useRef, useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import jsQR from "jsqr";
import BrandLogos from "../components/admin/BrandLogos";
import { ACTIVE_EVENT, ADMIN_TITLE } from "../data/adminEvent";
import { usePageMeta } from "../hooks/usePageMeta";

// Venue check-in: staff scan each registrant's QR code (or look them up by
// name) to record their arrival. Runs entirely in the browser on a laptop
// webcam — jsQR decodes frames in JavaScript because the browser's built-in
// BarcodeDetector isn't available on Windows Chrome. Camera access needs
// HTTPS (workers.dev has it) and the Permissions-Policy in _headers.

const UUID_RE = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i;
const IS_UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const STATION_KEY = "gates-checkin-station";
// A code that stays in front of the camera decodes dozens of times a second;
// it only counts as a fresh scan once it has been out of view this long.
const REPEAT_GAP_MS = 2500;
// Decode at most this wide: plenty for a QR, and keeps weak laptops responsive.
const DECODE_WIDTH = 640;
const DECODE_INTERVAL_MS = 120;
const STAFF_KEY = "gates-checkin-staff-open";
const STATS_REFRESH_MS = 20_000;
const RECENT_REFRESH_MS = 45_000;

interface Attendee {
  id: string;
  name: string;
  firstName: string | null;
  nickname: string | null;
  agency: string | null;
  division: string | null;
  designation: string | null;
  checkedInAt: number | null;
  checkedInBy: string | null;
}

type Outcome =
  | { kind: "checked_in"; attendee: Attendee; kit: "sending" | "already_sent" }
  | { kind: "already"; attendee: Attendee }
  | { kind: "error"; message: string };

interface SearchHit extends Attendee {
  email: string;
}

const clock = (ms: number) => new Date(ms).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });

function readStation() {
  try {
    return localStorage.getItem(STATION_KEY) ?? "";
  } catch {
    return "";
  }
}

function readStaffOpen() {
  try {
    return localStorage.getItem(STAFF_KEY) === "1";
  } catch {
    return false;
  }
}

export default function AdminCheckin() {
  usePageMeta(`Check-in — ${ADMIN_TITLE}`, "Scan registration QR codes to check attendees in.");
  const [staffOpen, setStaffOpen] = useState(readStaffOpen);
  const toggleStaffOpen = useCallback((open: boolean) => {
    setStaffOpen(open);
    try {
      localStorage.setItem(STAFF_KEY, open ? "1" : "0");
    } catch {
      // remembered for this visit only
    }
  }, []);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const frameRef = useRef(0);
  const lastDecodeRef = useRef(0);
  const lastCodeRef = useRef({ code: "", at: 0 });
  const audioRef = useRef<AudioContext | null>(null);

  const [camera, setCamera] = useState<"idle" | "starting" | "running" | "error">("idle");
  const [cameraError, setCameraError] = useState("");
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [deviceId, setDeviceId] = useState("");
  const [station, setStation] = useState(readStation);
  const [sound, setSound] = useState(true);
  const [outcome, setOutcome] = useState<Outcome | null>(null);
  const [stats, setStats] = useState<{ registered: number; checkedIn: number } | null>(null);
  const [recent, setRecent] = useState<Attendee[] | null>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const [authLost, setAuthLost] = useState(false);
  const [query, setQuery] = useState("");
  const [hits, setHits] = useState<SearchHit[] | null>(null);

  // The decode loop and its scan handler live outside React's render cycle,
  // so they read the latest station/sound through refs rather than closing
  // over stale state.
  const stationRef = useRef(station);
  stationRef.current = station;
  const soundRef = useRef(sound);
  soundRef.current = sound;

  const loadStats = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/checkin/stats", { credentials: "include" });
      if (res.status === 401) return setAuthLost(true);
      if (res.ok) setStats(await res.json());
    } catch {
      // keep the last known counts
    }
  }, []);

  const loadRecent = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/checkin/recent", { credentials: "include" });
      if (res.status === 401) return setAuthLost(true);
      if (res.ok) setRecent(await res.json());
    } catch {
      // keep the last known list
    }
  }, []);

  // Other stations check people in too, so the count and the recent-arrivals
  // feed are read from the server — after every scan below, and on a timer —
  // rather than tallied locally.
  useEffect(() => {
    loadStats();
    loadRecent();
    const statsTimer = setInterval(loadStats, STATS_REFRESH_MS);
    const recentTimer = setInterval(loadRecent, RECENT_REFRESH_MS);
    return () => {
      clearInterval(statsTimer);
      clearInterval(recentTimer);
    };
  }, [loadStats, loadRecent]);

  // "/" jumps to the search box (unless you're already typing somewhere).
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (event.key === "/" && !/^(INPUT|TEXTAREA|SELECT)$/.test(target?.tagName ?? "")) {
        event.preventDefault();
        toggleStaffOpen(true);
        // The input only exists once the panel has rendered open.
        requestAnimationFrame(() => searchRef.current?.focus());
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [toggleStaffOpen]);

  const beep = useCallback((tone: "ok" | "warn" | "bad") => {
    const ctx = audioRef.current;
    if (!ctx || !soundRef.current) return;
    const notes = { ok: [880], warn: [520, 520], bad: [220] }[tone];
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.frequency.value = freq;
      gain.gain.value = 0.12;
      osc.connect(gain).connect(ctx.destination);
      const start = ctx.currentTime + i * 0.18;
      osc.start(start);
      osc.stop(start + 0.12);
    });
  }, []);

  const checkIn = useCallback(
    async (id: string) => {
      try {
        const res = await fetch("/api/admin/checkin", {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id, station: stationRef.current }),
        });
        if (res.status === 401) {
          setAuthLost(true);
          return;
        }
        const data = await res.json().catch(() => ({}));
        if (data.status === "checked_in") {
          setOutcome({ kind: "checked_in", attendee: data.attendee, kit: data.kit });
          loadStats();
          loadRecent();
          beep("ok");
        } else if (data.status === "already_checked_in") {
          setOutcome({ kind: "already", attendee: data.attendee });
          beep("warn");
        } else {
          setOutcome({ kind: "error", message: data.error ?? "Could not check this person in." });
          beep("bad");
        }
      } catch {
        setOutcome({ kind: "error", message: "Could not reach the server. Check the connection and scan again." });
        beep("bad");
      }
    },
    [beep, loadStats, loadRecent],
  );

  const handleCode = useCallback(
    (text: string) => {
      const now = Date.now();
      const last = lastCodeRef.current;
      // Sliding window: every decode of the same code refreshes it, so a code
      // held steadily in view stays one scan indefinitely. It only counts as
      // a new scan once it has been out of frame for REPEAT_GAP_MS — which is
      // when "already checked in" is the right answer to show.
      const sameCodeStillInView = last.code === text && now - last.at < REPEAT_GAP_MS;
      lastCodeRef.current = { code: text, at: now };
      if (sameCodeStillInView) return;
      const match = text.match(UUID_RE);
      if (!match) {
        setOutcome({ kind: "error", message: "That QR code isn't a conference registration code." });
        beep("bad");
        return;
      }
      checkIn(match[0].toLowerCase());
    },
    [beep, checkIn],
  );

  const stopCamera = useCallback(() => {
    cancelAnimationFrame(frameRef.current);
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
  }, []);

  useEffect(() => stopCamera, [stopCamera]);

  const startCamera = useCallback(
    async (wantedDevice?: string) => {
      stopCamera();
      setCamera("starting");
      setCameraError("");
      try {
        if (!navigator.mediaDevices?.getUserMedia) {
          throw new Error("This browser can't use the camera here. Open the page over HTTPS in Chrome, Edge or Safari.");
        }
        // A click is the user gesture browsers need before allowing audio.
        audioRef.current ??= new AudioContext();
        void audioRef.current.resume();

        const stream = await navigator.mediaDevices.getUserMedia({
          video: wantedDevice
            ? { deviceId: { exact: wantedDevice } }
            : { facingMode: { ideal: "environment" }, width: { ideal: 1280 }, height: { ideal: 720 } },
          audio: false,
        });
        streamRef.current = stream;
        const video = videoRef.current;
        if (!video) return;
        video.srcObject = stream;
        await video.play();
        setCamera("running");

        // Labels are only available once permission has been granted.
        const all = await navigator.mediaDevices.enumerateDevices();
        setDevices(all.filter((d) => d.kind === "videoinput"));
        setDeviceId(stream.getVideoTracks()[0]?.getSettings().deviceId ?? "");

        const tick = (time: number) => {
          const v = videoRef.current;
          const canvas = canvasRef.current;
          if (v && canvas && v.readyState >= 2 && v.videoWidth > 0 && time - lastDecodeRef.current >= DECODE_INTERVAL_MS) {
            lastDecodeRef.current = time;
            const scale = Math.min(1, DECODE_WIDTH / v.videoWidth);
            canvas.width = Math.round(v.videoWidth * scale);
            canvas.height = Math.round(v.videoHeight * scale);
            const g = canvas.getContext("2d", { willReadFrequently: true });
            if (g) {
              g.drawImage(v, 0, 0, canvas.width, canvas.height);
              const frame = g.getImageData(0, 0, canvas.width, canvas.height);
              const code = jsQR(frame.data, frame.width, frame.height, { inversionAttempts: "dontInvert" });
              if (code?.data) handleCode(code.data);
            }
          }
          frameRef.current = requestAnimationFrame(tick);
        };
        frameRef.current = requestAnimationFrame(tick);
      } catch (err) {
        stopCamera();
        setCamera("error");
        const name = err instanceof DOMException ? err.name : "";
        setCameraError(
          name === "NotAllowedError"
            ? "Camera access was blocked. Click the camera icon in the address bar, allow it, then try again."
            : name === "NotFoundError"
              ? "No camera was found on this device."
              : name === "NotReadableError"
                ? "The camera is in use by another app or browser tab. Close it and try again."
                : err instanceof Error
                  ? err.message
                  : "Could not start the camera.",
        );
      }
    },
    [handleCode, stopCamera],
  );

  const onStationChange = (value: string) => {
    setStation(value);
    try {
      localStorage.setItem(STATION_KEY, value);
    } catch {
      // not persisted — still used for this session
    }
  };

  // Debounced name/email search.
  useEffect(() => {
    const q = query.trim();
    if (q.length < 2 || IS_UUID_RE.test(q)) {
      setHits(null);
      return;
    }
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/admin/checkin/search?q=${encodeURIComponent(q)}`, { credentials: "include" });
        if (res.status === 401) return setAuthLost(true);
        if (res.ok) setHits(await res.json());
      } catch {
        // leave the previous results
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [query]);

  // Enter in the box: a pasted or handheld-scanned id checks in directly.
  const onSubmitQuery = (event: FormEvent) => {
    event.preventDefault();
    const q = query.trim();
    if (IS_UUID_RE.test(q)) {
      checkIn(q.toLowerCase());
      setQuery("");
    }
  };

  const undo = async (attendee: Attendee) => {
    const res = await fetch(`/api/admin/checkin/${attendee.id}`, { method: "DELETE", credentials: "include" });
    if (res.ok) {
      setOutcome(null);
      lastCodeRef.current = { code: "", at: 0 };
      loadStats();
      loadRecent();
    }
  };

  const checkInFromSearch = async (hit: SearchHit) => {
    await checkIn(hit.id);
    setQuery("");
    setHits(null);
  };

  if (authLost) {
    return (
      <div className="min-h-screen flex items-center justify-center px-5">
        <div className="glass-panel p-6 sm:p-8 max-w-[420px] flex flex-col gap-3 text-center">
          <h1 className="font-display text-xl font-extrabold uppercase m-0">Sign in required</h1>
          <p className="text-sm text-white/65 m-0">Your admin session has expired or you're not signed in.</p>
          <Link to="/admin" className="text-gates-link font-semibold no-underline">
            Go to admin sign-in &rarr;
          </Link>
        </div>
      </div>
    );
  }

  const percent = stats && stats.registered ? Math.round((stats.checkedIn / stats.registered) * 100) : 0;

  return (
    <div className="relative isolate min-h-screen overflow-hidden">
      {/* The site's hero backdrop: arriving participants see this screen too. */}
      <div aria-hidden="true" className="hero-brand-gradient fixed inset-0 -z-20" />
      <div aria-hidden="true" className="checkin-grid-bg fixed inset-0 -z-10" />

      <div className="px-5 sm:px-8 py-6 sm:py-8 max-w-[1180px] mx-auto flex flex-col gap-6">
        <header className="flex flex-col gap-5">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <BrandLogos />
            <Link to="/admin" className="text-white/55 hover:text-white no-underline font-semibold text-[13px]">
              &larr; {ADMIN_TITLE}
            </Link>
          </div>
          <div>
            <div className="font-mono text-[11px] sm:text-xs tracking-[0.14em] text-white/55">CHECK-IN</div>
            <h1 className="font-display text-[clamp(26px,4vw,44px)] font-extrabold uppercase tracking-[0.01em] leading-[1.1] m-0 mt-1.5 text-glow">
              {ACTIVE_EVENT.name}
            </h1>
            <p className="m-0 mt-1.5 text-white/65 text-[15px]">{ACTIVE_EVENT.dateLabel}</p>
          </div>
          {stats && (
            <div
              className="glass-panel rounded-2xl p-4 sm:p-5 flex items-center gap-5 sm:gap-7 max-w-[760px]"
              aria-live="polite"
            >
              <div className="shrink-0">
                <div className="font-display text-[34px] sm:text-[40px] font-extrabold leading-none tabular-nums">
                  {stats.checkedIn}
                  <span className="ml-1.5 text-[18px] font-semibold text-white/40">/ {stats.registered}</span>
                </div>
                <div className="mt-1 font-heading text-[11px] font-semibold uppercase tracking-[0.12em] text-white/50">
                  Arrived
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <div className="h-2.5 rounded-full bg-white/10 overflow-hidden" aria-hidden="true">
                  <div
                    className="h-full rounded-full bg-emerald-400 transition-[width] duration-500"
                    style={{ width: `${percent}%` }}
                  />
                </div>
                <div className="mt-2 text-[13px] text-white/55">
                  {percent}% checked in &middot; {Math.max(0, stats.registered - stats.checkedIn)} still to arrive
                </div>
              </div>
            </div>
          )}
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] lg:grid-rows-[auto_1fr] gap-5 items-start">
          {/* The welcome comes first on small screens, so the answer is visible without scrolling past the camera. */}
          <section aria-live="polite" aria-label="Last scan" className="order-1 lg:col-start-2 lg:row-start-1">
            <WelcomeCard outcome={outcome} onUndo={undo} />
          </section>

          <section
            className="order-2 glass-panel p-4 flex flex-col gap-3 lg:col-start-1 lg:row-start-1 lg:row-span-2"
            aria-label="QR scanner"
          >
            <div className="relative aspect-[4/3] w-full overflow-hidden rounded-xl bg-black">
              <video ref={videoRef} playsInline muted className="absolute inset-0 w-full h-full object-cover" />
              <canvas ref={canvasRef} className="hidden" />
              {camera === "running" && (
                <div className="absolute inset-0 grid place-items-center pointer-events-none" aria-hidden="true">
                  <div className="relative w-[58%] aspect-square shadow-[0_0_0_9999px_rgba(0,0,0,0.45)] rounded-2xl">
                    <span className="absolute -top-0.5 -left-0.5 w-9 h-9 rounded-tl-2xl border-t-4 border-l-4 border-white" />
                    <span className="absolute -top-0.5 -right-0.5 w-9 h-9 rounded-tr-2xl border-t-4 border-r-4 border-white" />
                    <span className="absolute -bottom-0.5 -left-0.5 w-9 h-9 rounded-bl-2xl border-b-4 border-l-4 border-white" />
                    <span className="absolute -bottom-0.5 -right-0.5 w-9 h-9 rounded-br-2xl border-b-4 border-r-4 border-white" />
                  </div>
                </div>
              )}
              {camera === "running" && (
                <div className="absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-full bg-black/55 px-2.5 py-1 text-[11px] font-semibold text-white/90">
                  <span aria-hidden="true" className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  Scanning
                </div>
              )}
              {camera !== "running" && (
                <div className="absolute inset-0 grid place-items-center p-6 text-center">
                  {camera === "starting" ? (
                    <p className="text-white/70 m-0">Starting camera&hellip;</p>
                  ) : (
                    <div className="flex flex-col gap-3 items-center">
                      {cameraError && (
                        <p role="alert" className="text-red-300 text-sm m-0 max-w-[420px]">
                          {cameraError}
                        </p>
                      )}
                      <button
                        type="button"
                        onClick={() => startCamera()}
                        className="btn-primary px-6 py-3 rounded-full text-white font-bold text-[15px] border-none cursor-pointer"
                      >
                        {camera === "error" ? "Try again" : "Start camera"}
                      </button>
                      {camera === "idle" && (
                        <p className="text-white/45 text-[13px] m-0">Your browser will ask to use the camera.</p>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
            <div className="flex items-start justify-between gap-4">
              <p className="text-[13px] leading-[1.5] text-white/60 m-0">
                Hold your QR code about 20&ndash;30&nbsp;cm from the camera, with your screen brightness turned up.
              </p>
              {camera === "running" && (
                <button
                  type="button"
                  onClick={() => {
                    stopCamera();
                    setCamera("idle");
                  }}
                  className="shrink-0 text-gates-link bg-transparent border-none cursor-pointer p-0 font-semibold text-[13px]"
                >
                  Stop camera
                </button>
              )}
            </div>
          </section>

          {/* Staff controls and anything that lists other people's names live here, folded away by default. */}
          <section className="order-3 glass-panel lg:col-start-2 lg:row-start-2" aria-label="Staff tools">
            <button
              type="button"
              aria-expanded={staffOpen}
              aria-controls="staff-tools"
              onClick={() => toggleStaffOpen(!staffOpen)}
              className="w-full flex items-center justify-between gap-3 px-4 py-3.5 bg-transparent border-none cursor-pointer text-left text-white"
            >
              <span className="text-[15px] font-semibold">
                Staff tools
                <span className="ml-2 text-[12px] font-normal text-white/45">station, search, recent check-ins</span>
              </span>
              <span aria-hidden="true" className={`text-white/55 transition-transform ${staffOpen ? "rotate-180" : ""}`}>
                &#9662;
              </span>
            </button>
            {staffOpen && (
              <div id="staff-tools" className="px-4 pb-4 flex flex-col gap-5 border-t border-white/10 pt-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <label className="flex flex-col gap-1.5">
                    <span className="text-[12px] text-white/60 font-semibold">Station name (optional)</span>
                    <input
                      value={station}
                      maxLength={40}
                      onChange={(e) => onStationChange(e.target.value)}
                      placeholder="e.g. Main door, Laptop 2"
                      className="w-full px-3 py-2.5 rounded-lg border border-white/16 bg-white/5 text-white/94 text-[14px] placeholder:text-white/35 focus:outline-none focus:ring-2 focus:ring-gates-blue"
                    />
                  </label>
                  <label className="flex flex-col gap-1.5">
                    <span className="text-[12px] text-white/60 font-semibold">Camera</span>
                    <select
                      value={deviceId}
                      disabled={devices.length < 2}
                      onChange={(e) => {
                        setDeviceId(e.target.value);
                        startCamera(e.target.value);
                      }}
                      className="w-full px-3 py-2.5 rounded-lg border border-white/16 bg-white/5 text-white/94 text-[14px] focus:outline-none focus:ring-2 focus:ring-gates-blue disabled:opacity-60"
                    >
                      {devices.length === 0 && <option value="">—</option>}
                      {devices.map((d, i) => (
                        <option key={d.deviceId} value={d.deviceId} className="bg-[#0e0f13]">
                          {d.label || `Camera ${i + 1}`}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>
                <label className="flex items-center gap-2 cursor-pointer text-[13px] text-white/70">
                  <input
                    type="checkbox"
                    checked={sound}
                    onChange={(e) => setSound(e.target.checked)}
                    className="w-4 h-4 accent-gates-link"
                  />
                  Beep on scan
                </label>

                <div className="flex flex-col gap-3">
                  <div className="flex items-baseline justify-between gap-3">
                    <h2 className="text-[14px] font-semibold m-0">No QR code? Find them by name</h2>
                    <span className="hidden sm:inline text-[11px] text-white/35">
                      Press <kbd className="rounded border border-white/20 px-1.5 py-0.5 font-mono text-[10px]">/</kbd>
                    </span>
                  </div>
                  <form onSubmit={onSubmitQuery}>
                    <input
                      ref={searchRef}
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      placeholder="Name, nickname, email or agency — or paste / scan an ID"
                      autoComplete="off"
                      className="w-full px-3 py-2.5 rounded-lg border border-white/16 bg-white/5 text-white/94 text-[14px] placeholder:text-white/35 focus:outline-none focus:ring-2 focus:ring-gates-blue"
                    />
                  </form>
                  {hits && hits.length === 0 && <p className="text-white/50 text-sm m-0">No matches.</p>}
                  {hits && hits.length > 0 && (
                    <ul className="list-none m-0 p-0 flex flex-col divide-y divide-white/8">
                      {hits.map((hit) => (
                        <li key={hit.id} className="py-2.5 flex items-center justify-between gap-3">
                          <div className="min-w-0">
                            <div className="text-[15px] font-semibold truncate">
                              {hit.name}
                              {hit.nickname && (
                                <span className="text-white/55 font-normal"> &ldquo;{hit.nickname}&rdquo;</span>
                              )}
                            </div>
                            <div className="text-[12px] text-white/50 truncate">
                              {[hit.agency, maskEmail(hit.email)].filter(Boolean).join(" · ")}
                            </div>
                          </div>
                          {hit.checkedInAt ? (
                            <span className="text-[12px] text-emerald-300 whitespace-nowrap">
                              In at {clock(hit.checkedInAt)}
                            </span>
                          ) : (
                            <button
                              type="button"
                              onClick={() => checkInFromSearch(hit)}
                              className="glass-panel px-4 py-1.5 rounded-full text-[13px] font-semibold text-white cursor-pointer whitespace-nowrap"
                            >
                              Check in
                            </button>
                          )}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                <div className="flex flex-col gap-2">
                  <h2 className="text-[14px] font-semibold m-0">Recent check-ins</h2>
                  {recent === null ? (
                    <p className="text-white/45 text-sm m-0">Loading&hellip;</p>
                  ) : recent.length === 0 ? (
                    <p className="text-white/45 text-sm m-0">No one has arrived yet.</p>
                  ) : (
                    <ul className="list-none m-0 p-0 flex flex-col divide-y divide-white/8">
                      {recent.map((person) => (
                        <li key={person.id} className="py-2 flex items-center justify-between gap-3">
                          <div className="min-w-0">
                            <div className="text-[14px] font-semibold truncate">
                              {person.name}
                              {person.nickname && (
                                <span className="text-white/50 font-normal"> &ldquo;{person.nickname}&rdquo;</span>
                              )}
                            </div>
                            <div className="text-[12px] text-white/45 truncate">{person.agency}</div>
                          </div>
                          <div className="shrink-0 text-right text-[12px] text-white/55">
                            <div className="font-mono tabular-nums text-emerald-300">
                              {person.checkedInAt ? clock(person.checkedInAt) : ""}
                            </div>
                            {person.checkedInBy && <div className="text-white/40">{person.checkedInBy}</div>}
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}

/** "ana.reyes@dost.gov.ph" -> "a•••@dost.gov.ph": enough to tell two people apart, not enough to read off a screen. */
function maskEmail(email: string) {
  const [user, domain] = email.split("@");
  return domain ? `${user.slice(0, 1)}•••@${domain}` : email;
}

const ICON_PATHS = {
  ok: "M5 12.5l4.5 4.5L19 7.5",
  already: "M12 7v6m0 3.5v.01",
  error: "M7 7l10 10M17 7L7 17",
} as const;

/** What arriving participants see after a scan — so it greets them, and keeps staff-only controls small. */
function WelcomeCard({ outcome, onUndo }: { outcome: Outcome | null; onUndo: (attendee: Attendee) => void }) {
  if (!outcome) {
    return (
      <div className="glass-panel glass-panel-strong rounded-2xl p-6 sm:p-7 flex items-center gap-5">
        <div aria-hidden="true" className="w-14 h-14 shrink-0 rounded-full border-2 border-dashed border-white/25" />
        <div>
          <div className="font-display text-[clamp(22px,3vw,30px)] font-extrabold leading-tight">Welcome!</div>
          <div className="text-[15px] text-white/65 mt-1">
            Show the QR code from your confirmation email to the camera to check in.
          </div>
        </div>
      </div>
    );
  }

  const kind = outcome.kind === "checked_in" ? "ok" : outcome.kind === "already" ? "already" : "error";
  const theme = {
    ok: { box: "border-emerald-400/55 bg-emerald-400/10", icon: "bg-emerald-400 text-emerald-950", label: "text-emerald-300" },
    already: { box: "border-amber-400/55 bg-amber-400/10", icon: "bg-amber-400 text-amber-950", label: "text-amber-300" },
    error: { box: "border-gates-error/55 bg-gates-error/10", icon: "bg-red-400 text-red-950", label: "text-red-300" },
  }[kind];

  return (
    <div className={`rounded-2xl border p-6 sm:p-7 flex items-start gap-5 backdrop-blur-sm ${theme.box}`}>
      <div className={`w-14 h-14 shrink-0 rounded-full grid place-items-center ${theme.icon}`} aria-hidden="true">
        <svg
          viewBox="0 0 24 24"
          className="w-8 h-8"
          fill="none"
          stroke="currentColor"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d={ICON_PATHS[kind]} />
        </svg>
      </div>
      <div className="min-w-0 flex flex-col gap-1.5">
        {outcome.kind === "error" ? (
          <>
            <div className={`text-[12px] font-semibold uppercase tracking-[0.1em] ${theme.label}`}>Not checked in</div>
            <p className="text-xl m-0">{outcome.message}</p>
          </>
        ) : (
          <>
            <div className={`text-[12px] font-semibold uppercase tracking-[0.1em] ${theme.label}`}>
              {outcome.kind === "checked_in"
                ? `Checked in${outcome.attendee.checkedInAt ? ` · ${clock(outcome.attendee.checkedInAt)}` : ""}`
                : `Already checked in${outcome.attendee.checkedInAt ? ` at ${clock(outcome.attendee.checkedInAt)}` : ""}`}
            </div>
            <div className="font-display text-[clamp(28px,4.4vw,48px)] font-extrabold leading-[1.05] text-glow">
              {outcome.kind === "checked_in" ? "Welcome" : "Welcome back"},{" "}
              {outcome.attendee.nickname || outcome.attendee.firstName || outcome.attendee.name}!
            </div>
            <div className="text-white/85 text-[17px] font-semibold">{outcome.attendee.name}</div>
            <div className="text-white/65 text-[15px]">
              {[outcome.attendee.agency, outcome.attendee.division, outcome.attendee.designation]
                .filter(Boolean)
                .join(" · ")}
            </div>
            {outcome.kind === "checked_in" && outcome.kit === "sending" && (
              <div className="text-[14px] text-emerald-200/90 mt-1">Your virtual kit is on its way to your email.</div>
            )}
            {outcome.kind === "checked_in" && (
              <button
                type="button"
                onClick={() => onUndo(outcome.attendee)}
                className="self-start mt-2 text-white/40 hover:text-white bg-transparent border-none cursor-pointer p-0 text-[12px] underline"
              >
                Staff: wrong person? Undo check-in
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}
