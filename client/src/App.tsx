import { lazy, Suspense } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import Hackathon from "./pages/Hackathon";
import Privacy from "./pages/Privacy";

// Code-split: ~300 lines used by two people, no reason to ship it in every
// public page's bundle (brief §10 performance pass).
const Admin = lazy(() => import("./pages/Admin"));

function App() {
  // Cloudflare serves the Worker at the domain root, and _redirects/native
  // SPA fallback handle deep links — no --base sub-path or basename needed
  // (that was for the old GitHub Pages project-path deployment).
  //
  // Early-access gate: Home/Program/Conference/Registration aren't final
  // yet, so every path except /hackathon, /privacy, and /admin redirects to
  // /hackathon (nav links included, since they route through here too).
  // Revert by restoring their <Route> entries once those pages are ready.
  return (
    <BrowserRouter>
      <Routes>
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
        <Route path="*" element={<Navigate to="/hackathon" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
