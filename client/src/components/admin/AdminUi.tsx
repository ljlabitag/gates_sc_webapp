import { useEffect, useRef, useState, type ReactNode } from "react";

// Small building blocks shared by the admin panels.

export const adminInputClass =
  "w-full px-3.5 py-2.5 rounded-xl border border-white/16 bg-white/5 text-white/94 text-[14px] font-sans placeholder:text-white/35 focus:outline-none focus:ring-2 focus:ring-gates-blue focus:border-gates-blue";

export const formatDateTime = (ms: number) =>
  new Date(ms).toLocaleString([], { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });

export const formatTime = (ms: number) => new Date(ms).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });

/** A headline number with a label, an optional sub-line, and an optional progress bar. */
export function StatCard({
  label,
  value,
  of,
  note,
  progress,
  tone = "default",
}: {
  label: string;
  value: ReactNode;
  /** Denominator, shown dimmed after the value ("/ 210"). */
  of?: ReactNode;
  note?: ReactNode;
  /** 0–1 */
  progress?: number;
  tone?: "default" | "good" | "warn";
}) {
  const bar = tone === "good" ? "bg-emerald-400" : tone === "warn" ? "bg-amber-400" : "bg-gates-link";
  return (
    <div className="glass-panel rounded-2xl p-4 sm:p-5 flex flex-col gap-1.5">
      <div className="font-heading text-[11px] font-semibold uppercase tracking-[0.12em] text-white/50">{label}</div>
      <div className="font-display text-[28px] sm:text-[32px] font-extrabold leading-none tabular-nums">
        {value}
        {of !== undefined && <span className="ml-1.5 text-[16px] font-semibold text-white/40">/ {of}</span>}
      </div>
      {progress !== undefined && (
        <div className="h-1.5 rounded-full bg-white/10 overflow-hidden mt-1" aria-hidden="true">
          <div className={`h-full rounded-full ${bar}`} style={{ width: `${Math.round(Math.min(1, progress) * 100)}%` }} />
        </div>
      )}
      {note && <div className="text-[12px] text-white/50">{note}</div>}
    </div>
  );
}

const chipTones = {
  neutral: "border-white/14 bg-white/6 text-white/70",
  diet: "border-teal-300/25 bg-teal-300/10 text-teal-100",
  assist: "border-orange-300/25 bg-orange-300/10 text-orange-100",
  good: "border-emerald-300/25 bg-emerald-300/10 text-emerald-200",
  warn: "border-amber-300/30 bg-amber-300/10 text-amber-200",
} as const;

export function Chip({ tone = "neutral", children, title }: { tone?: keyof typeof chipTones; children: ReactNode; title?: string }) {
  return (
    <span
      title={title}
      className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium leading-tight whitespace-nowrap ${chipTones[tone]}`}
    >
      {children}
    </span>
  );
}

export interface MenuItem {
  label: string;
  onSelect?: () => void;
  href?: string;
  danger?: boolean;
}

/** A "⋯" button that opens a small menu; closes on outside click or Escape. */
export function RowMenu({ items, label }: { items: MenuItem[]; label: string }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (event: MouseEvent) => {
      if (!ref.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const itemClass = (danger?: boolean) =>
    `block w-full text-left px-3.5 py-2 text-[13px] bg-transparent border-none cursor-pointer no-underline hover:bg-white/8 ${
      danger ? "text-red-300" : "text-white/85"
    }`;

  return (
    <div ref={ref} className="relative inline-block">
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={label}
        onClick={() => setOpen((o) => !o)}
        className="grid place-items-center w-8 h-8 rounded-lg border border-white/14 bg-white/5 text-white/75 hover:text-white hover:bg-white/10 cursor-pointer text-lg leading-none"
      >
        <span aria-hidden="true">&#8943;</span>
      </button>
      {open && (
        <div
          role="menu"
          className="absolute right-0 top-full mt-1.5 z-30 min-w-[190px] overflow-hidden rounded-xl border border-white/14 bg-[#101116] shadow-2xl py-1"
        >
          {items.map((item) =>
            item.href ? (
              <a
                key={item.label}
                role="menuitem"
                href={item.href}
                target="_blank"
                rel="noreferrer"
                onClick={() => setOpen(false)}
                className={itemClass(item.danger)}
              >
                {item.label}
              </a>
            ) : (
              <button
                key={item.label}
                type="button"
                role="menuitem"
                onClick={() => {
                  setOpen(false);
                  item.onSelect?.();
                }}
                className={itemClass(item.danger)}
              >
                {item.label}
              </button>
            ),
          )}
        </div>
      )}
    </div>
  );
}

/** A row of single-select filter pills with counts. */
export function FilterPills<T extends string>({
  value,
  onChange,
  options,
  label,
}: {
  value: T;
  onChange: (next: T) => void;
  options: { id: T; label: string; count?: number }[];
  label: string;
}) {
  return (
    <div role="group" aria-label={label} className="flex flex-wrap gap-2">
      {options.map((option) => {
        const active = option.id === value;
        return (
          <button
            key={option.id}
            type="button"
            aria-pressed={active}
            onClick={() => onChange(option.id)}
            className={`rounded-full border px-3.5 py-1.5 text-[13px] font-semibold cursor-pointer transition-colors ${
              active
                ? "border-gates-link/60 bg-gates-link/18 text-white"
                : "border-white/14 bg-white/4 text-white/65 hover:text-white hover:bg-white/8"
            }`}
          >
            {option.label}
            {option.count !== undefined && (
              <span className={`ml-1.5 tabular-nums ${active ? "text-white/80" : "text-white/40"}`}>{option.count}</span>
            )}
          </button>
        );
      })}
    </div>
  );
}
