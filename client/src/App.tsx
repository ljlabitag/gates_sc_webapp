import { BrowserRouter, Route, Routes } from "react-router-dom";
import PreviewBanner from "./components/PreviewBanner";
import Home from "./pages/Home";
import Program from "./pages/Program";
import Conference from "./pages/Conference";
import Registration from "./pages/Registration";
import Hackathon from "./pages/Hackathon";
import Admin from "./pages/Admin";

function App() {
  // basename follows Vite's --base, so the same build works at a domain root and
  // under a GitHub Pages project path like /sc2026_webapp/.
  return (
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <PreviewBanner />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/program" element={<Program />} />
        <Route path="/conference" element={<Conference />} />
        <Route path="/registration" element={<Registration />} />
        <Route path="/hackathon" element={<Hackathon />} />
        <Route path="/admin" element={<Admin />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
