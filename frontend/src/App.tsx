import { Routes, Route, Link } from "react-router-dom";
import Home from "./pages/Home";
import CourseDetail from "./pages/CourseDetail";
import Study from "./pages/Study";
import Admin from "./pages/Admin";

function App() {
  return (
    <>
      <nav
        style={{
          borderBottom: "1px solid var(--border)",
          padding: "0.75rem 1.5rem",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "1rem",
        }}
      >
        <div>
          <Link to="/" style={{ fontWeight: 700, color: "var(--text)" }}>
            Lizard
          </Link>
          <span style={{ color: "var(--muted)", marginLeft: "0.5rem" }}>— Skip the Library</span>
        </div>
        <Link to="/admin" style={{ fontWeight: 600, fontSize: "0.95rem" }}>
          Admin
        </Link>
      </nav>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/admin" element={<Admin />} />
        <Route path="/courses/:courseId" element={<CourseDetail />} />
        <Route path="/courses/:courseId/study" element={<Study />} />
      </Routes>
    </>
  );
}

export default App;
