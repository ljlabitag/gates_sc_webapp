import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import AdminRegistrationEditor from "../components/AdminRegistrationEditor";
import RegistrationsPanel from "../components/admin/RegistrationsPanel";
import SubmissionsPanel from "../components/admin/SubmissionsPanel";
import { StatCard, adminInputClass, formatTime } from "../components/admin/AdminUi";
import type { HackathonSubmission, Registration } from "../components/admin/types";

type Status = "checking" | "loginRequired" | "authenticated";
type Tab = "registrations" | "hackathon";
type Notice = { kind: "ok" | "error"; text: string } | null;

const NOTICE_MS = 8000;

export default function Admin() {
  const [status, setStatus] = useState<Status>("checking");
  const [loginUser, setLoginUser] = useState("");
  const [loginPass, setLoginPass] = useState("");
  const [loginError, setLoginError] = useState("");
  const [signingIn, setSigningIn] = useState(false);

  const [registrations, setRegistrations] = useState<Registration[] | null>(null);
  const [submissions, setSubmissions] = useState<HackathonSubmission[] | null>(null);
  const [updatedAt, setUpdatedAt] = useState<number | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [editing, setEditing] = useState<Registration | null>(null);
  const [notice, setNotice] = useState<Notice>(null);
  const [tab, setTab] = useState<Tab>(() => (window.location.hash === "#hackathon" ? "hackathon" : "registrations"));

  const loadData = useCallback(async () => {
    setRefreshing(true);
    try {
      const [regRes, subRes] = await Promise.all([
        fetch("/api/admin/registrations", { credentials: "include" }),
        fetch("/api/admin/hackathon-submissions", { credentials: "include" }),
      ]);
      if (regRes.status === 401 || subRes.status === 401) {
        setStatus("loginRequired");
        return;
      }
      if (!regRes.ok || !subRes.ok) throw new Error("Failed to load admin data.");
      setRegistrations(await regRes.json());
      setSubmissions(await subRes.json());
      setUpdatedAt(Date.now());
      setStatus("authenticated");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load admin data.");
      setStatus("loginRequired");
    } finally {
      setRefreshing(false);
    }
  }, []);

  // The session lives in an httpOnly cookie the browser controls, not
  // anything readable from JS — so "are we logged in" is only knowable by
  // asking a protected endpoint, not by checking local state on mount.
  useEffect(() => {
    loadData();
  }, [loadData]);

  // Success messages fade on their own; errors stay until dismissed.
  useEffect(() => {
    if (notice?.kind !== "ok") return;
    const timer = setTimeout(() => setNotice(null), NOTICE_MS);
    return () => clearTimeout(timer);
  }, [notice]);

  const chooseTab = (next: Tab) => {
    setTab(next);
    window.history.replaceState(null, "", next === "hackathon" ? "#hackathon" : window.location.pathname);
  };

  const handleLogin = async (e: FormEvent) => {
    e.preventDefault();
    setSigningIn(true);
    setLoginError("");
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: loginUser, password: loginPass }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setLoginError(body.error ?? "Invalid credentials.");
        return;
      }
      await loadData();
    } catch {
      setLoginError("Could not reach the server.");
    } finally {
      setSigningIn(false);
    }
  };

  // Row actions. Each one calls the admin API (cookie-authenticated, audit-
  // logged server-side) and reports the outcome in the notice banner rather
  // than with alert() popups.
  const handleResend = async (r: Registration) => {
    if (!window.confirm(`Re-send the confirmation email to ${r.email}?`)) return;
    setNotice(null);
    const res = await fetch(`/api/admin/registrations/${r.id}/resend`, { method: "POST", credentials: "include" });
    const data = await res.json().catch(() => ({}));
    setNotice(
      res.ok
        ? { kind: "ok", text: `Confirmation re-sent to ${r.email}.` }
        : { kind: "error", text: data.error ?? "Could not re-send the confirmation." },
    );
  };

  const handleResendKit = async (r: Registration) => {
    if (!window.confirm(`Send the virtual kit email to ${r.email}?`)) return;
    setNotice(null);
    const res = await fetch(`/api/admin/registrations/${r.id}/resend-kit`, { method: "POST", credentials: "include" });
    const data = await res.json().catch(() => ({}));
    if (res.ok) {
      setRegistrations((rows) => rows?.map((row) => (row.id === r.id ? { ...row, kitSentAt: Date.now() } : row)) ?? null);
      setNotice({ kind: "ok", text: `Virtual kit sent to ${r.email}.` });
    } else {
      setNotice({ kind: "error", text: data.error ?? "Could not send the virtual kit." });
    }
  };

  const handleDelete = async (r: Registration) => {
    if (
      !window.confirm(
        `Permanently delete the registration of ${r.name} (${r.email})?

This erases all their data and invalidates their QR code. It cannot be undone.`,
      )
    )
      return;
    setNotice(null);
    const res = await fetch(`/api/admin/registrations/${r.id}`, { method: "DELETE", credentials: "include" });
    if (res.ok) {
      setRegistrations((rows) => rows?.filter((row) => row.id !== r.id) ?? null);
      setNotice({ kind: "ok", text: `Deleted the registration of ${r.name}.` });
    } else {
      const data = await res.json().catch(() => ({}));
      setNotice({ kind: "error", text: data.error ?? "Could not delete the registration." });
    }
  };

  const handleLogout = async () => {
    await fetch("/api/admin/logout", { method: "POST", credentials: "include" });
    setRegistrations(null);
    setSubmissions(null);
    setStatus("loginRequired");
  };

  const stats = useMemo(() => {
    const rows = registrations ?? [];
    const arrived = rows.filter((r) => r.checkedInAt).length;
    const kitsSent = rows.filter((r) => r.checkedInAt && r.kitSentAt).length;
    return { registered: rows.length, arrived, kitsSent, kitsPending: arrived - kitsSent };
  }, [registrations]);

  if (status === "checking") {
    return <div className="min-h-screen flex items-center justify-center text-white/50">Loading…</div>;
  }

  if (status === "loginRequired") {
    return (
      <div className="min-h-screen flex items-center justify-center px-5 sm:px-8 py-8">
        <form className="glass-panel p-6 sm:p-8 w-full max-w-[380px] flex flex-col gap-4" onSubmit={handleLogin}>
          <h1 className="font-display text-2xl font-extrabold uppercase tracking-[0.01em] m-0">GATES Admin</h1>
          <p className="text-[13px] text-white/50 m-0 -mt-2">Sign in to manage registrations and check-in.</p>
          {error && <div className="text-gates-error text-[13px]">{error}</div>}
          <div className="flex flex-col gap-2">
            <label htmlFor="admin-user" className="text-[13px] text-white/60 font-semibold">
              Username
            </label>
            <input
              id="admin-user"
              className={adminInputClass}
              type="text"
              autoComplete="username"
              value={loginUser}
              onChange={(e) => setLoginUser(e.target.value)}
              autoFocus
            />
          </div>
          <div className="flex flex-col gap-2">
            <label htmlFor="admin-pass" className="text-[13px] text-white/60 font-semibold">
              Password
            </label>
            <input
              id="admin-pass"
              className={adminInputClass}
              type="password"
              autoComplete="current-password"
              value={loginPass}
              onChange={(e) => setLoginPass(e.target.value)}
            />
          </div>
          {loginError && (
            <div role="alert" className="text-gates-error text-[13px]">
              {loginError}
            </div>
          )}
          <button
            type="submit"
            disabled={signingIn}
            className="btn-primary px-[26px] py-3.5 rounded-full text-white font-bold text-[15px] border-none cursor-pointer disabled:opacity-60"
          >
            {signingIn ? "Signing in…" : "Sign in"}
          </button>
        </form>
      </div>
    );
  }

  const arrivedShare = stats.registered ? stats.arrived / stats.registered : 0;

  return (
    <div className="min-h-screen px-5 sm:px-8 py-6 sm:py-9 max-w-[1280px] mx-auto flex flex-col gap-6 sm:gap-7">
      <header className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-extrabold uppercase tracking-[0.01em] m-0">GATES Admin</h1>
          <p className="m-0 mt-1 text-[13px] text-white/45">
            {updatedAt ? `Updated ${formatTime(updatedAt)}` : ""}
            <button
              type="button"
              onClick={loadData}
              disabled={refreshing}
              className="ml-3 text-gates-link bg-transparent border-none cursor-pointer p-0 text-[13px] font-semibold disabled:opacity-50"
            >
              {refreshing ? "Refreshing…" : "Refresh"}
            </button>
          </p>
        </div>
        <nav aria-label="Admin" className="flex items-center gap-4 flex-wrap">
          <Link
            to="/admin/checkin"
            className="btn-primary px-5 py-2.5 rounded-full text-sm text-white font-semibold no-underline"
          >
            Open check-in scanner
          </Link>
          <button
            type="button"
            onClick={handleLogout}
            className="text-gates-link no-underline text-sm font-semibold bg-transparent border-none cursor-pointer p-0"
          >
            Log out
          </button>
          <Link to="/" className="text-gates-link no-underline text-sm font-semibold">
            &larr; Back to site
          </Link>
        </nav>
      </header>

      {error && <div className="text-gates-error text-sm">{error}</div>}

      <section aria-label="Overview" className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <StatCard label="Registered" value={stats.registered} note="Confirmed attendees" />
        <StatCard
          label="Arrived"
          value={stats.arrived}
          of={stats.registered}
          progress={arrivedShare}
          tone="good"
          note={stats.registered ? `${Math.round(arrivedShare * 100)}% checked in` : "No registrations yet"}
        />
        <StatCard
          label="Kits sent"
          value={stats.kitsSent}
          of={stats.arrived}
          tone={stats.kitsPending > 0 ? "warn" : "default"}
          progress={stats.arrived ? stats.kitsSent / stats.arrived : 0}
          note={stats.kitsPending > 0 ? `${stats.kitsPending} not sent — see the “Kit not sent” filter` : "All arrivals have their kit"}
        />
        <StatCard label="Hackathon" value={submissions?.length ?? "—"} note="Proposals submitted" />
      </section>

      {notice && (
        <div
          role={notice.kind === "error" ? "alert" : "status"}
          className={`flex items-start justify-between gap-4 rounded-xl border px-4 py-3 text-[14px] ${
            notice.kind === "error"
              ? "border-gates-error/40 bg-gates-error/10 text-red-200"
              : "border-emerald-300/30 bg-emerald-300/10 text-emerald-100"
          }`}
        >
          <span>{notice.text}</span>
          <button
            type="button"
            aria-label="Dismiss message"
            onClick={() => setNotice(null)}
            className="bg-transparent border-none cursor-pointer text-current opacity-70 hover:opacity-100 text-lg leading-none p-0"
          >
            &times;
          </button>
        </div>
      )}

      <div role="tablist" aria-label="Admin sections" className="flex gap-1 border-b border-white/10">
        {(
          [
            ["registrations", "Registrations", registrations?.length],
            ["hackathon", "Hackathon submissions", submissions?.length],
          ] as const
        ).map(([id, label, count]) => {
          const active = tab === id;
          return (
            <button
              key={id}
              type="button"
              role="tab"
              id={`tab-${id}`}
              aria-selected={active}
              aria-controls={`panel-${id}`}
              onClick={() => chooseTab(id)}
              className={`-mb-px border-b-2 px-4 py-2.5 text-[14px] font-semibold bg-transparent cursor-pointer transition-colors ${
                active ? "border-gates-link text-white" : "border-transparent text-white/50 hover:text-white/80"
              }`}
            >
              {label}
              {count !== undefined && <span className="ml-2 text-[12px] font-normal text-white/45 tabular-nums">{count}</span>}
            </button>
          );
        })}
      </div>

      <div role="tabpanel" id={`panel-${tab}`} aria-labelledby={`tab-${tab}`}>
        {tab === "registrations" ? (
          <RegistrationsPanel
            registrations={registrations}
            actions={{
              onEdit: setEditing,
              onResend: handleResend,
              onResendKit: handleResendKit,
              onDelete: handleDelete,
            }}
          />
        ) : (
          <SubmissionsPanel submissions={submissions} />
        )}
      </div>

      {editing && (
        <AdminRegistrationEditor
          registration={editing}
          onClose={() => setEditing(null)}
          onSaved={(updated) => {
            setRegistrations((rows) => rows?.map((row) => (row.id === updated.id ? { ...row, ...updated } : row)) ?? null);
            setNotice({ kind: "ok", text: `Saved changes to ${updated.name}.` });
            setEditing(null);
          }}
        />
      )}
    </div>
  );
}
