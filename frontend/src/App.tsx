import { Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import CourseDetail from "./pages/CourseDetail";
import Study from "./pages/Study";
import Admin from "./pages/Admin";
import { UxClickTracker } from "./components/UxClickTracker";
import { AppShell } from "@/components/blocks/AppShell";

function App() {
  return (
    <>
      <UxClickTracker />
      <AppShell>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="/courses/:courseId" element={<CourseDetail />} />
          <Route path="/courses/:courseId/study" element={<Study />} />
        </Routes>
      </AppShell>
    </>
  );
}

export default App;
