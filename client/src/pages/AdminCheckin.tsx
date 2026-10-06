import { useCallback, useEffect, useRef, useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import jsQR from "jsqr";

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
const STATS_REFRESH_MS = 20_000;

interface Attendee {
  id: string;
  name: string;
  nickname: string | null;
  agency: string | null;
  division: string | null;
  designation: string | null;
  checkedInAt: number | null;
  checkedInBy: string | null;
}

type Outcome =
  | { kind: "checked_in"; attendee: Attendee }
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

export default function AdminCheckin() {
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

  // Other stations check people in too, so the count is read from the server
  // — after every scan below, and on this timer — rather than tallied locally.
  useEffect(() => {
    loadStats();
    const timer = setInterval(loadStats, STATS_REFRESH_MS);
    return () => clearInterval(timer);
  }, [loadStats]);

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
          setOutcome({ kind: "checked_in", attendee: data.attendee });
          loadStats();
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
    [beep, loadStats],
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

  const tone =
    outcome?.kind === "checked_in"
      ? "border-emerald-400/50 bg-emerald-400/10"
      : outcome?.kind === "already"
        ? "border-amber-400/50 bg-amber-400/10"
        : "border-gates-error/50 bg-gates-error/10";

  return (
    <div className="min-h-screen px-5 sm:px-8 py-6 sm:py-8 max-w-[1100px] mx-auto flex flex-col gap-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="font-display text-2xl sm:text-3xl font-extrabold uppercase tracking-[0.01em] m-0">Check-in</h1>
        <div className="flex items-center gap-5 text-sm">
          {stats && (
            <span className="font-mono tabular-nums text-white/80" aria-live="polite">
              <strong className="text-white">{stats.checkedIn}</strong> / {stats.registered} arrived
            </span>
          )}
          <Link to="/admin" className="text-gates-link no-underline font-semibold">
            &larr; Admin
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] gap-5 items-start">
        <section className="glass-panel p-4 flex flex-col gap-3" aria-label="QR scanner">
          <div className="relative aspect-[4/3] w-full overflow-hidden rounded-xl bg-black">
            <video ref={videoRef} playsInline muted className="absolute inset-0 w-full h-full object-cover" />
            <canvas ref={canvasRef} className="hidden" />
            {camera === "running" && (
              <div className="absolute inset-0 grid place-items-center pointer-events-none" aria-hidden="true">
                <div className="w-[58%] aspect-square rounded-2xl border-2 border-white/70 shadow-[0_0_0_9999px_rgba(0,0,0,0.35)]" />
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
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <label className="flex flex-col gap-1.5">
              <span className="text-[12px] text-white/60 font-semibold">Station name (optional)</span>
              <input
                value={station}
                maxLength={40}
                onChange={(e) => onStationChange(e.target.value)}
                placeholder="e.g. Main door, Laptop 2"
                className="w-full px-3 py-2.5 rounded-lg border border-white/16 bg-white/5 text-white/94 text-[14px] focus:outline-none focus:ring-2 focus:ring-gates-blue"
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
          <div className="flex items-center justify-between gap-3 text-[13px] text-white/60">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={sound}
                onChange={(e) => setSound(e.target.checked)}
                className="w-4 h-4 accent-gates-link"
              />
              Beep on scan
            </label>
            {camera === "running" && (
              <button
                type="button"
                onClick={() => {
                  stopCamera();
                  setCamera("idle");
                }}
                className="text-gates-link bg-transparent border-none cursor-pointer p-0 font-semibold text-[13px]"
              >
                Stop camera
              </button>
            )}
          </div>
          <p className="text-[12px] leading-[1.5] text-white/45 m-0">
            Hold the code about 20&ndash;30&nbsp;cm from the camera with the screen brightness up. If a phone is hard
            to read, tilt it slightly to avoid glare.
          </p>
        </section>

        <div className="flex flex-col gap-5">
          <section aria-live="polite" aria-label="Last scan">
            {outcome ? (
              <div className={`rounded-2xl border p-5 flex flex-col gap-1.5 ${tone}`}>
                {outcome.kind === "error" ? (
                  <>
                    <div className="text-[12px] font-semibold uppercase tracking-[0.1em] text-red-300">Not checked in</div>
                    <p className="text-lg m-0">{outcome.message}</p>
                  </>
                ) : (
                  <>
                    <div
                      className={`text-[12px] font-semibold uppercase tracking-[0.1em] ${
                        outcome.kind === "checked_in" ? "text-emerald-300" : "text-amber-300"
                      }`}
                    >
                      {outcome.kind === "checked_in"
                        ? "Checked in"
                        : `Already checked in${
                            outcome.attendee.checkedInAt ? ` at ${clock(outcome.attendee.checkedInAt)}` : ""
                          }${outcome.attendee.checkedInBy ? ` · ${outcome.attendee.checkedInBy}` : ""}`}
                    </div>
                    <div className="font-display text-2xl sm:text-3xl font-extrabold leading-tight">
                      {outcome.attendee.name}
                      {outcome.attendee.nickname && (
                        <span className="text-white/60 font-semibold"> &ldquo;{outcome.attendee.nickname}&rdquo;</span>
                      )}
                    </div>
                    <div className="text-white/70 text-[15px]">
                      {[outcome.attendee.agency, outcome.attendee.division, outcome.attendee.designation]
                        .filter(Boolean)
                        .join(" · ")}
                    </div>
                    {outcome.kind === "checked_in" && (
                      <button
                        type="button"
                        onClick={() => undo(outcome.attendee)}
                        className="self-start mt-2 text-white/55 hover:text-white bg-transparent border-none cursor-pointer p-0 text-[13px] underline"
                      >
                        Wrong person? Undo check-in
                      </button>
                    )}
                  </>
                )}
              </div>
            ) : (
              <div className="glass-panel p-5 text-white/55 text-[15px]">Scan a QR code to check someone in.</div>
            )}
          </section>

          <section className="glass-panel p-4 flex flex-col gap-3" aria-label="Find a registrant">
            <h2 className="text-[15px] font-semibold m-0">No QR code? Find them by name</h2>
            <form onSubmit={onSubmitQuery}>
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Name, nickname, email or agency — or paste / scan an ID"
                autoComplete="off"
                className="w-full px-3 py-2.5 rounded-lg border border-white/16 bg-white/5 text-white/94 text-[14px] focus:outline-none focus:ring-2 focus:ring-gates-blue"
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
                        {hit.nickname && <span className="text-white/55 font-normal"> &ldquo;{hit.nickname}&rdquo;</span>}
                      </div>
                      <div className="text-[12px] text-white/50 truncate">
                        {[hit.agency, hit.email].filter(Boolean).join(" · ")}
                      </div>
                    </div>
                    {hit.checkedInAt ? (
                      <span className="text-[12px] text-emerald-300 whitespace-nowrap">In at {clock(hit.checkedInAt)}</span>
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
          </section>
        </div>
      </div>
    </div>
  );
}
