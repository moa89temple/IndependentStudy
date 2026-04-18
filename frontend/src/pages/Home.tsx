import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api, type Course } from "../api";

export default function Home() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [newName, setNewName] = useState("");
  const [creating, setCreating] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    api.courses.list().then(setCourses).finally(() => setLoading(false));
  }, []);

  const createCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || creating) return;
    setCreating(true);
    try {
      const c = await api.courses.create(newName.trim());
      setCourses((prev) => [c, ...prev]);
      setNewName("");
      navigate(`/courses/${c.id}`);
    } catch (err) {
      alert((err as Error).message);
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="container">
      <div className="page-header">
        <h1>Courses</h1>
        <form onSubmit={createCourse} style={{ display: "flex", gap: "0.5rem" }}>
          <input
            type="text"
            placeholder="New course name"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
          />
          <button type="submit" disabled={creating || !newName.trim()} data-analytics="home-create-course">
            Create
          </button>
        </form>
      </div>
      {loading ? (
        <p style={{ color: "var(--muted)" }}>Loading…</p>
      ) : courses.length === 0 ? (
        <div className="card">
          <p style={{ color: "var(--muted)", margin: 0 }}>
            No courses yet. Create one and upload PDF, TXT, or PPTX materials to get started.
          </p>
        </div>
      ) : (
        <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
          {courses.map((c) => (
            <li key={c.id}>
              <Link to={`/courses/${c.id}`} data-analytics="home-open-course" style={{ display: "block" }}>
                <div className="card" style={{ marginBottom: "0.5rem" }}>
                  <strong>{c.name}</strong>
                  <span style={{ color: "var(--muted)", marginLeft: "0.5rem" }}>/{c.slug}</span>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
