import { useMemo, useState } from "react";
import { Chip, adminInputClass, formatDateTime } from "./AdminUi";
import type { HackathonSubmission } from "./types";

const formatSize = (bytes: number | null) => {
  if (!bytes) return "";
  return bytes >= 1024 * 1024 ? `${(bytes / (1024 * 1024)).toFixed(1)} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB`;
};

function matches(s: HackathonSubmission, q: string) {
  if (!q) return true;
  const haystack = [s.team, s.title, s.domain, s.agency, s.leaderName, s.leaderEmail].filter(Boolean).join(" ").toLowerCase();
  return q.split(/\s+/).every((word) => haystack.includes(word));
}

function Proposal({ s }: { s: HackathonSubmission }) {
  if (!s.fileName) return <span className="text-white/30">—</span>;
  return (
    <a
      href={`/api/admin/hackathon-submissions/${s.id}/file`}
      className="text-gates-link no-underline text-[13px] font-semibold break-all"
    >
      {s.fileName}
      {s.fileSize ? <span className="ml-1.5 font-normal text-white/45">{formatSize(s.fileSize)}</span> : null}
    </a>
  );
}

function Leader({ s }: { s: HackathonSubmission }) {
  if (!s.leaderName) return <span className="text-white/30">—</span>;
  return (
    <div className="min-w-0">
      <div className="text-[14px] text-white/90">{s.leaderName}</div>
      <div className="text-[12px] text-white/50 truncate" title={s.leaderEmail ?? undefined}>
        {[s.leaderPosition, s.leaderEmail].filter(Boolean).join(" · ")}
      </div>
    </div>
  );
}

export default function SubmissionsPanel({ submissions }: { submissions: HackathonSubmission[] | null }) {
  const [query, setQuery] = useState("");
  const q = query.trim().toLowerCase();
  const rows = useMemo(
    () => (submissions ?? []).filter((s) => matches(s, q)).sort((a, b) => b.createdAt - a.createdAt),
    [submissions, q],
  );

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search team, project, domain, leader…"
          aria-label="Search hackathon submissions"
          className={`${adminInputClass} sm:max-w-[420px]`}
        />
        <a
          href="/api/admin/hackathon-submissions/export"
          className="self-start rounded-full border border-white/16 bg-white/6 px-4 py-2 text-[13px] font-semibold text-white/90 no-underline hover:bg-white/12"
        >
          Export CSV
        </a>
      </div>

      <div className="text-[13px] text-white/50" aria-live="polite">
        {submissions === null ? "Loading submissions…" : `Showing ${rows.length} of ${submissions.length}`}
      </div>

      {submissions !== null && rows.length === 0 && (
        <div className="glass-panel rounded-2xl p-8 text-center text-white/55">
          {submissions.length === 0 ? "No submissions yet." : "No submissions match your search."}
        </div>
      )}

      {rows.length > 0 && (
        <div className="hidden lg:block glass-panel rounded-2xl overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/10 text-[11px] font-semibold uppercase tracking-[0.1em] text-white/45">
                <th className="px-4 py-3 font-semibold w-[28%]">Team / project</th>
                <th className="px-4 py-3 font-semibold w-[16%]">Domain</th>
                <th className="px-4 py-3 font-semibold w-[22%]">Team leader</th>
                <th className="px-4 py-3 font-semibold w-[22%]">Proposal</th>
                <th className="px-4 py-3 font-semibold w-[12%]">Submitted</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((s) => (
                <tr key={s.id} className="align-top border-b border-white/6 hover:bg-white/[0.025]">
                  <td className="px-4 py-3.5">
                    <div className="font-semibold text-[14px] text-white/95">{s.team}</div>
                    <div className="text-[13px] text-white/60">{s.title}</div>
                    {s.agency && <div className="text-[12px] text-white/45 mt-0.5">{s.agency}</div>}
                  </td>
                  <td className="px-4 py-3.5">{s.domain ? <Chip>{s.domain}</Chip> : <span className="text-white/30">—</span>}</td>
                  <td className="px-4 py-3.5">
                    <Leader s={s} />
                  </td>
                  <td className="px-4 py-3.5">
                    <Proposal s={s} />
                  </td>
                  <td className="px-4 py-3.5 text-[12px] text-white/50 whitespace-nowrap">{formatDateTime(s.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {rows.length > 0 && (
        <ul className="lg:hidden list-none m-0 p-0 flex flex-col gap-3">
          {rows.map((s) => (
            <li key={s.id} className="glass-panel rounded-2xl p-4 flex flex-col gap-2.5">
              <div>
                <div className="font-semibold text-[15px] text-white/95">{s.team}</div>
                <div className="text-[13px] text-white/60">{s.title}</div>
              </div>
              <div className="flex flex-wrap gap-2 items-center">
                {s.domain && <Chip>{s.domain}</Chip>}
                {s.agency && <span className="text-[12px] text-white/50">{s.agency}</span>}
              </div>
              <Leader s={s} />
              <div className="flex items-end justify-between gap-3 border-t border-white/8 pt-3">
                <Proposal s={s} />
                <span className="text-[12px] text-white/45 whitespace-nowrap">{formatDateTime(s.createdAt)}</span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
