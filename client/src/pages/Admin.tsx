import { useEffect, useState, type FormEvent } from "react";
import { Link } from "react-router-dom";

interface Registration {
  id: string;
  name: string;
  email: string;
  organization: string | null;
  dietaryAccessibility: string | null;
  createdAt: number;
}

interface HackathonSubmission {
  id: string;
  team: string;
  title: string;
  domain: string | null;
  agency: string | null;
  leaderName: string | null;
  leaderEmail: string | null;
  fileName: string | null;
  createdAt: number;
}

const adminInputClass =
  "w-full px-3.5 py-3 rounded-xl border border-white/16 bg-white/5 text-white/94 text-[15px] font-sans focus:outline-none focus:ring-2 focus:ring-gates-blue focus:border-gates-blue";

function formatDate(ms: number) {
  return new Date(ms).toLocaleString();
}

type Status = "checking" | "loginRequired" | "authenticated";

export default function Admin() {
  const [status, setStatus] = useState<Status>("checking");
  const [loginUser, setLoginUser] = useState("");
  const [loginPass, setLoginPass] = useState("");
  const [loginError, setLoginError] = useState("");
  const [signingIn, setSigningIn] = useState(false);

  const [registrations, setRegistrations] = useState<Registration[] | null>(null);
  const [submissions, setSubmissions] = useState<HackathonSubmission[] | null>(null);
  const [error, setError] = useState("");

  async function loadData() {
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
      setStatus("authenticated");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load admin data.");
      setStatus("loginRequired");
    }
  }

  // The session lives in an httpOnly cookie the browser controls, not
  // anything readable from JS — so "are we logged in" is only knowable by
  // asking a protected endpoint, not by checking local state on mount.
  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

  const handleLogout = async () => {
    await fetch("/api/admin/logout", { method: "POST", credentials: "include" });
    setRegistrations(null);
    setSubmissions(null);
    setStatus("loginRequired");
  };

  if (status === "checking") {
    return <div className="min-h-screen flex items-center justify-center text-white/50">Loading…</div>;
  }

  if (status === "loginRequired") {
    return (
      <div className="min-h-screen flex items-center justify-center px-5 sm:px-8 py-8">
        <form className="glass-panel p-6 sm:p-8 w-full max-w-[360px] flex flex-col gap-4" onSubmit={handleLogin}>
          <h1 className="font-display text-2xl font-extrabold uppercase tracking-[0.01em] m-0">GATES Admin</h1>
          <div className="flex flex-col gap-2">
            <label className="text-[13px] text-white/60 font-semibold">Username</label>
            <input
              className={adminInputClass}
              type="text"
              value={loginUser}
              onChange={(e) => setLoginUser(e.target.value)}
              autoFocus
            />
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-[13px] text-white/60 font-semibold">Password</label>
            <input
              className={adminInputClass}
              type="password"
              value={loginPass}
              onChange={(e) => setLoginPass(e.target.value)}
            />
          </div>
          {loginError && <div className="text-gates-error text-[13px]">{loginError}</div>}
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

  return (
    <div className="min-h-screen px-5 sm:px-8 py-8 sm:py-10 max-w-[1200px] mx-auto flex flex-col gap-8 sm:gap-10">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <h1 className="font-display text-3xl font-extrabold uppercase tracking-[0.01em] m-0">GATES Admin</h1>
        <div className="flex items-center gap-5">
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
        </div>
      </div>

      {error && <div className="text-gates-error text-sm">{error}</div>}

      <section className="flex flex-col gap-4">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <h2 className="text-xl font-semibold m-0">Registrations {registrations ? `(${registrations.length})` : ""}</h2>
          <a
            href="/api/admin/registrations/export"
            className="glass-panel px-4 py-2 rounded-full text-sm text-white/90 no-underline"
          >
            Export CSV
          </a>
        </div>
        <div className="glass-panel overflow-x-auto">
          <table className="w-full min-w-[760px] text-sm text-left border-collapse">
            <thead>
              <tr className="border-b border-white/10 text-white/50">
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">Email</th>
                <th className="px-4 py-3 font-medium">Organization / Role</th>
                <th className="px-4 py-3 font-medium">Dietary / Accessibility</th>
                <th className="px-4 py-3 font-medium">Submitted</th>
              </tr>
            </thead>
            <tbody>
              {registrations === null && (
                <tr>
                  <td className="px-4 py-6 text-white/40" colSpan={5}>
                    Loading registrations…
                  </td>
                </tr>
              )}
              {registrations?.map((r) => (
                <tr key={r.id} className="border-b border-white/5">
                  <td className="px-4 py-3">{r.name}</td>
                  <td className="px-4 py-3">{r.email}</td>
                  <td className="px-4 py-3">{r.organization || "—"}</td>
                  <td className="px-4 py-3">{r.dietaryAccessibility || "—"}</td>
                  <td className="px-4 py-3 text-white/60">{formatDate(r.createdAt)}</td>
                </tr>
              ))}
              {registrations?.length === 0 && (
                <tr>
                  <td className="px-4 py-6 text-white/40" colSpan={5}>
                    No registrations yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="flex flex-col gap-4">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <h2 className="text-xl font-semibold m-0">
            Hackathon Submissions {submissions ? `(${submissions.length})` : ""}
          </h2>
          <a
            href="/api/admin/hackathon-submissions/export"
            className="glass-panel px-4 py-2 rounded-full text-sm text-white/90 no-underline"
          >
            Export CSV
          </a>
        </div>
        <div className="glass-panel overflow-x-auto">
          <table className="w-full min-w-[920px] text-sm text-left border-collapse">
            <thead>
              <tr className="border-b border-white/10 text-white/50">
                <th className="px-4 py-3 font-medium">Team</th>
                <th className="px-4 py-3 font-medium">Project Title</th>
                <th className="px-4 py-3 font-medium">Domain</th>
                <th className="px-4 py-3 font-medium">Team Leader</th>
                <th className="px-4 py-3 font-medium">Proposal</th>
                <th className="px-4 py-3 font-medium">Submitted</th>
              </tr>
            </thead>
            <tbody>
              {submissions === null && (
                <tr>
                  <td className="px-4 py-6 text-white/40" colSpan={6}>
                    Loading submissions…
                  </td>
                </tr>
              )}
              {submissions?.map((s) => (
                <tr key={s.id} className="border-b border-white/5">
                  <td className="px-4 py-3">{s.team}</td>
                  <td className="px-4 py-3">{s.title}</td>
                  <td className="px-4 py-3 max-w-[220px]">{s.domain || "—"}</td>
                  <td className="px-4 py-3">
                    {s.leaderName ? (
                      <span className="flex flex-col">
                        <span>{s.leaderName}</span>
                        {s.leaderEmail && <span className="text-white/45 text-[12px]">{s.leaderEmail}</span>}
                      </span>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {s.fileName ? (
                      <a
                        href={`/api/admin/hackathon-submissions/${s.id}/file`}
                        className="text-gates-link no-underline text-sm"
                      >
                        {s.fileName}
                      </a>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td className="px-4 py-3 text-white/60">{formatDate(s.createdAt)}</td>
                </tr>
              ))}
              {submissions?.length === 0 && (
                <tr>
                  <td className="px-4 py-6 text-white/40" colSpan={6}>
                    No submissions yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
