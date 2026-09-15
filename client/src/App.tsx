import { lazy, Suspense } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import Home from "./pages/Home";
import Program from "./pages/Program";
import Conference from "./pages/Conference";
import Registration from "./pages/Registration";
import Hackathon from "./pages/Hackathon";
import Privacy from "./pages/Privacy";

// Code-split: ~300 lines used by two people, no reason to ship it in every
// public page's bundle (brief §10 performance pass).
const Admin = lazy(() => import("./pages/Admin"));

// Early-access gate: Home/Program/Conference/Registration aren't signed off
// for production yet, so every path except /hackathon, /privacy, and /admin
// redirects to /hackathon there (nav links included, since they route
// through here too). Same build runs on every environment — no separate
// staging build exists (worker:deploy and worker:deploy:staging both just
// run `npm run build -w client`) — so this is a runtime hostname check, not
// a build-time flag. Defaults to GATE ACTIVE for any host not explicitly
// listed here, including an unrecognized future production domain — the
// failure mode that matters is "gate stays on by mistake" (annoying), never
// "gate silently turns off in production" (a real content leak).
const EARLY_ACCESS_GATE_DISABLED_HOSTS = new Set([
  "localhost",
  "127.0.0.1",
  "gates-sc-webapp-staging.dost-gates.workers.dev",
]);

function isEarlyAccessGateActive(): boolean {
  if (typeof window === "undefined") return true;
  return !EARLY_ACCESS_GATE_DISABLED_HOSTS.has(window.location.hostname);
}

function App() {
  // Cloudflare serves the Worker at the domain root, and _redirects/native
  // SPA fallback handle deep links — no --base sub-path or basename needed
  // (that was for the old GitHub Pages project-path deployment).
  const gateActive = isEarlyAccessGateActive();

  return (
    <BrowserRouter>
      <Routes>
        {!gateActive && (
          <>
            <Route path="/" element={<Home />} />
            <Route path="/program" element={<Program />} />
            <Route path="/conference" element={<Conference />} />
            <Route path="/registration" element={<Registration />} />
          </>
        )}
        <Route path="/hackathon" element={<Hackathon />} />
        <Route path="/privacy" element={<Privacy />} />
        <Route
          path="/admin"
          element={
            <Suspense fallback={null}>
              <Admin />
            </Suspense>
          }
        />
        {/* React Router ranks literal paths above wildcards regardless of
            declaration order, so Home/Program/Conference/Registration above
            and this catch-all must be mutually exclusive — both present at
            once would mean the catch-all never fires for those paths and
            the gate silently does nothing. */}
        {gateActive && <Route path="*" element={<Navigate to="/hackathon" replace />} />}
      </Routes>
    </BrowserRouter>
  );
}

export default App;
