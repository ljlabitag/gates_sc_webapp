import { Fragment, useMemo, useState } from "react";
import { Chip, FilterPills, RowMenu, adminInputClass, formatDateTime, formatTime, type MenuItem } from "./AdminUi";
import { hasSpecialNeeds, splitChecklist, type Registration } from "./types";

type Filter = "all" | "in" | "out" | "kit" | "needs";
type Sort = "newest" | "name" | "arrival";

const PAGE_SIZE = 50;

function matches(r: Registration, q: string) {
  if (!q) return true;
  const haystack = [r.name, r.nickname, r.email, r.mobile, r.agency, r.division, r.designation]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  return q.split(/\s+/).every((word) => haystack.includes(word));
}

function NeedsChips({ r }: { r: Registration }) {
  const diet = splitChecklist(r.dietaryPreferences);
  const assist = splitChecklist(r.specialAssistance);
  if (!hasSpecialNeeds(r)) return <span className="text-white/30">—</span>;
  return (
    <div className="flex flex-wrap gap-1.5">
      {diet.map((d) => (
        <Chip key={d} tone="diet">
          {d}
        </Chip>
      ))}
      {r.foodAllergies && (
        <Chip tone="diet" title={r.foodAllergies}>
          Diet / allergy note
        </Chip>
      )}
      {assist.map((a) => (
        <Chip key={a} tone="assist">
          {a.replace("Person with disability (PWD)", "PWD")}
        </Chip>
      ))}
      {r.assistanceNeeded && (
        <Chip tone="assist" title={r.assistanceNeeded}>
          Assistance note
        </Chip>
      )}
    </div>
  );
}

function StatusCell({ r }: { r: Registration }) {
  if (!r.checkedInAt) {
    return <span className="text-white/45 text-[13px]">Not yet arrived</span>;
  }
  return (
    <div className="flex flex-col gap-1">
      <span className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-emerald-300">
        <span aria-hidden="true" className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
        Arrived {formatTime(r.checkedInAt)}
      </span>
      {r.checkedInBy && <span className="text-[12px] text-white/45">{r.checkedInBy}</span>}
      <span className={`text-[12px] ${r.kitSentAt ? "text-white/45" : "text-amber-300"}`}>
        {r.kitSentAt ? "Kit sent" : "Kit not sent"}
      </span>
    </div>
  );
}

function Details({ r }: { r: Registration }) {
  const rows: [string, string | null][] = [
    ["Mobile", r.mobile],
    ["Position", r.designation],
    ["Division / section", r.division],
    ["Dietary", [r.dietaryPreferences, r.foodAllergies].filter(Boolean).join(" · ") || null],
    ["Special assistance", [r.specialAssistance, r.assistanceNeeded].filter(Boolean).join(" · ") || null],
    ["Photo / video consent", r.documentationConsent ? "Yes" : "No"],
    ["Privacy notice", r.privacyNoticeVersion],
    ["Registration ID", r.id],
  ];
  return (
    <dl className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-x-8 gap-y-3 m-0 text-[13px]">
      {rows.map(([term, value]) => (
        <div key={term} className="min-w-0">
          <dt className="text-white/45 text-[11px] font-semibold uppercase tracking-[0.1em]">{term}</dt>
          <dd className="m-0 mt-0.5 text-white/85 break-words">{value || <span className="text-white/30">—</span>}</dd>
        </div>
      ))}
    </dl>
  );
}

export interface RegistrationActions {
  onEdit: (r: Registration) => void;
  onResend: (r: Registration) => void;
  onResendKit: (r: Registration) => void;
  onDelete: (r: Registration) => void;
}

function menuItems(r: Registration, actions: RegistrationActions): MenuItem[] {
  return [
    { label: "View QR code", href: `/api/registrations/${r.id}/qr.png` },
    { label: "Re-send confirmation", onSelect: () => actions.onResend(r) },
    ...(r.checkedInAt ? [{ label: r.kitSentAt ? "Re-send virtual kit" : "Send virtual kit", onSelect: () => actions.onResendKit(r) }] : []),
    { label: "Delete registration…", onSelect: () => actions.onDelete(r), danger: true },
  ];
}

function RowActions({ r, actions }: { r: Registration; actions: RegistrationActions }) {
  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={() => actions.onEdit(r)}
        className="rounded-lg border border-white/16 bg-white/6 px-3 py-1.5 text-[13px] font-semibold text-white/90 hover:bg-white/12 cursor-pointer"
      >
        Edit
      </button>
      <RowMenu label={`More actions for ${r.name}`} items={menuItems(r, actions)} />
    </div>
  );
}

function Person({ r }: { r: Registration }) {
  return (
    <div className="min-w-0">
      <div className="font-semibold text-[14px] text-white/95">
        {r.name}
        {r.nickname && <span className="font-normal text-white/50"> &ldquo;{r.nickname}&rdquo;</span>}
      </div>
      <div className="text-[13px] text-white/60 truncate" title={r.email}>
        {r.email}
      </div>
    </div>
  );
}

function Affiliation({ r }: { r: Registration }) {
  return (
    <div className="min-w-0">
      <div className="text-[14px] text-white/90">{r.agency || <span className="text-white/30">—</span>}</div>
      <div className="text-[12px] text-white/50">{[r.division, r.designation].filter(Boolean).join(" · ")}</div>
    </div>
  );
}

export default function RegistrationsPanel({
  registrations,
  actions,
}: {
  registrations: Registration[] | null;
  actions: RegistrationActions;
}) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [sort, setSort] = useState<Sort>("newest");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [shown, setShown] = useState(PAGE_SIZE);

  const q = query.trim().toLowerCase();

  const counts = useMemo(() => {
    const rows = registrations ?? [];
    return {
      all: rows.length,
      in: rows.filter((r) => r.checkedInAt).length,
      out: rows.filter((r) => !r.checkedInAt).length,
      kit: rows.filter((r) => r.checkedInAt && !r.kitSentAt).length,
      needs: rows.filter(hasSpecialNeeds).length,
    };
  }, [registrations]);

  const rows = useMemo(() => {
    const list = (registrations ?? []).filter((r) => {
      if (!matches(r, q)) return false;
      if (filter === "in") return Boolean(r.checkedInAt);
      if (filter === "out") return !r.checkedInAt;
      if (filter === "kit") return Boolean(r.checkedInAt) && !r.kitSentAt;
      if (filter === "needs") return hasSpecialNeeds(r);
      return true;
    });
    const sorted = [...list];
    if (sort === "name") sorted.sort((a, b) => (a.lastName ?? a.name).localeCompare(b.lastName ?? b.name));
    else if (sort === "arrival") sorted.sort((a, b) => (b.checkedInAt ?? 0) - (a.checkedInAt ?? 0));
    else sorted.sort((a, b) => b.createdAt - a.createdAt);
    return sorted;
  }, [registrations, q, filter, sort]);

  const visible = rows.slice(0, shown);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col lg:flex-row gap-3 lg:items-center lg:justify-between">
        <input
          type="search"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setShown(PAGE_SIZE);
          }}
          placeholder="Search name, email, agency, position…"
          aria-label="Search registrations"
          className={`${adminInputClass} lg:max-w-[420px]`}
        />
        <div className="flex items-center gap-3 flex-wrap">
          <label className="flex items-center gap-2 text-[13px] text-white/55">
            Sort
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as Sort)}
              className="rounded-lg border border-white/16 bg-white/5 px-2.5 py-1.5 text-[13px] text-white/90 focus:outline-none focus:ring-2 focus:ring-gates-blue"
            >
              <option value="newest" className="bg-[#0e0f13]">Newest first</option>
              <option value="name" className="bg-[#0e0f13]">Last name A–Z</option>
              <option value="arrival" className="bg-[#0e0f13]">Latest arrival</option>
            </select>
          </label>
          <a
            href="/api/admin/registrations/export"
            className="rounded-full border border-white/16 bg-white/6 px-4 py-2 text-[13px] font-semibold text-white/90 no-underline hover:bg-white/12"
          >
            Export CSV
          </a>
        </div>
      </div>

      <FilterPills
        label="Filter registrations"
        value={filter}
        onChange={(next) => {
          setFilter(next);
          setShown(PAGE_SIZE);
        }}
        options={[
          { id: "all", label: "All", count: counts.all },
          { id: "in", label: "Arrived", count: counts.in },
          { id: "out", label: "Not yet arrived", count: counts.out },
          { id: "kit", label: "Kit not sent", count: counts.kit },
          { id: "needs", label: "Dietary / assistance", count: counts.needs },
        ]}
      />

      <div className="text-[13px] text-white/50" aria-live="polite">
        {registrations === null ? "Loading registrations…" : `Showing ${visible.length} of ${rows.length}${rows.length !== counts.all ? ` (filtered from ${counts.all})` : ""}`}
      </div>

      {registrations !== null && rows.length === 0 && (
        <div className="glass-panel rounded-2xl p-8 text-center text-white/55">
          {counts.all === 0 ? "No registrations yet." : "No registrations match your search or filter."}
        </div>
      )}

      {/* Wide screens: a table. */}
      {rows.length > 0 && (
        <div className="hidden lg:block glass-panel rounded-2xl overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/10 text-[11px] font-semibold uppercase tracking-[0.1em] text-white/45">
                <th className="px-4 py-3 font-semibold w-[24%]">Registrant</th>
                <th className="px-4 py-3 font-semibold w-[24%]">Agency / position</th>
                <th className="px-4 py-3 font-semibold w-[16%]">Needs</th>
                <th className="px-4 py-3 font-semibold w-[15%]">Status</th>
                <th className="px-4 py-3 font-semibold w-[10%]">Registered</th>
                <th className="px-4 py-3 font-semibold w-[11%]">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {visible.map((r) => {
                const open = expanded === r.id;
                return (
                  <Fragment key={r.id}>
                    <tr className={`align-top border-b border-white/6 ${open ? "bg-white/[0.035]" : "hover:bg-white/[0.025]"}`}>
                      <td className="px-4 py-3.5">
                        <div className="flex items-start gap-2">
                          <button
                            type="button"
                            aria-expanded={open}
                            aria-label={`${open ? "Hide" : "Show"} details for ${r.name}`}
                            onClick={() => setExpanded(open ? null : r.id)}
                            className="mt-0.5 w-5 h-5 shrink-0 grid place-items-center rounded text-white/45 hover:text-white bg-transparent border-none cursor-pointer"
                          >
                            <span aria-hidden="true" className={`inline-block transition-transform ${open ? "rotate-90" : ""}`}>
                              &#9656;
                            </span>
                          </button>
                          <Person r={r} />
                        </div>
                      </td>
                      <td className="px-4 py-3.5">
                        <Affiliation r={r} />
                      </td>
                      <td className="px-4 py-3.5">
                        <NeedsChips r={r} />
                      </td>
                      <td className="px-4 py-3.5">
                        <StatusCell r={r} />
                      </td>
                      <td className="px-4 py-3.5 text-[12px] text-white/50 whitespace-nowrap">{formatDateTime(r.createdAt)}</td>
                      <td className="px-4 py-3.5">
                        <RowActions r={r} actions={actions} />
                      </td>
                    </tr>
                    {open && (
                      <tr className="border-b border-white/6 bg-white/[0.035]">
                        <td colSpan={6} className="px-4 pb-5 pt-1 pl-11">
                          <Details r={r} />
                        </td>
                      </tr>
                    )}
                  </Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Narrower screens: cards. */}
      {rows.length > 0 && (
        <ul className="lg:hidden list-none m-0 p-0 flex flex-col gap-3">
          {visible.map((r) => {
            const open = expanded === r.id;
            return (
              <li key={r.id} className="glass-panel rounded-2xl p-4 flex flex-col gap-3">
                <div className="flex items-start justify-between gap-3">
                  <Person r={r} />
                  <RowActions r={r} actions={actions} />
                </div>
                <Affiliation r={r} />
                <NeedsChips r={r} />
                <div className="flex items-end justify-between gap-3 border-t border-white/8 pt-3">
                  <StatusCell r={r} />
                  <span className="text-[12px] text-white/45">{formatDateTime(r.createdAt)}</span>
                </div>
                <button
                  type="button"
                  aria-expanded={open}
                  onClick={() => setExpanded(open ? null : r.id)}
                  className="self-start text-gates-link bg-transparent border-none cursor-pointer p-0 text-[13px] font-semibold"
                >
                  {open ? "Hide details" : "Show details"}
                </button>
                {open && <Details r={r} />}
              </li>
            );
          })}
        </ul>
      )}

      {rows.length > shown && (
        <button
          type="button"
          onClick={() => setShown((n) => n + PAGE_SIZE)}
          className="self-center rounded-full border border-white/16 bg-white/6 px-5 py-2 text-[13px] font-semibold text-white/90 hover:bg-white/12 cursor-pointer"
        >
          Show {Math.min(PAGE_SIZE, rows.length - shown)} more
        </button>
      )}
    </div>
  );
}
