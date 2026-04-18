import { useEffect, useState } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { api, type Course, type Concept } from "../api";

export default function CourseDetail() {
  const { courseId } = useParams<{ courseId: string }>();
  const navigate = useNavigate();
  const id = Number(courseId);
  const [course, setCourse] = useState<Course | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [concepts, setConcepts] = useState<Concept[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (!id || isNaN(id)) return;
    Promise.all([
      api.courses.list().then((list) => list.find((c) => c.id === id) ?? null),
      api.learning.concepts(id).catch(() => []),
    ]).then(([c, concepts]) => {
      setCourse(c ?? null);
      setConcepts(concepts);
    }).finally(() => setLoading(false));
  }, [id]);

  const upload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !id || uploading) return;
    setUploading(true);
    setUploadSuccess(null);
    const filename = file.name;
    try {
      await api.materials.upload(id, file);
      setFile(null);
      setUploadSuccess(filename);
      setTimeout(() => setUploadSuccess(null), 5000);
      setLoading(true);
      api.learning.concepts(id).then(setConcepts).finally(() => setLoading(false));
    } catch (err) {
      alert((err as Error).message);
    } finally {
      setUploading(false);
    }
  };

  const process = async () => {
    if (!id || processing) return;
    setProcessing(true);
    try {
      await api.learning.process(id);
      const list = await api.learning.concepts(id);
      setConcepts(list);
    } catch (err) {
      alert((err as Error).message);
    } finally {
      setProcessing(false);
    }
  };

  const deleteCourse = async () => {
    if (!id || deleting) return;
    if (!confirm(`Delete "${course?.name}"? This cannot be undone.`)) return;
    setDeleting(true);
    try {
      await api.courses.delete(id);
      navigate("/");
    } catch (err) {
      alert((err as Error).message);
    } finally {
      setDeleting(false);
    }
  };

  if (loading && !course) return <div className="container">Loading…</div>;
  if (!course) return <div className="container">Course not found.</div>;

  return (
    <div className="container">
      <div className="page-header">
        <h1>{course.name}</h1>
        <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
          <Link to={`/courses/${id}/study`}>
            <button type="button" className="secondary" data-analytics="course-study">
              Study
            </button>
          </Link>
          <button
            type="button"
            className="secondary"
            data-analytics="course-delete"
            onClick={deleteCourse}
            disabled={deleting}
            style={{ color: "var(--wrong)" }}
          >
            {deleting ? "Deleting…" : "Delete course"}
          </button>
        </div>
      </div>

      <div className="card">
        <h2 style={{ margin: "0 0 0.75rem", fontSize: "1.1rem" }}>Upload material</h2>
        <p style={{ color: "var(--muted)", margin: "0 0 0.75rem", fontSize: "0.9rem" }}>
          PDF, TXT, or PPTX. Then run “Process” to extract concepts and generate flashcards and questions.
        </p>
        <form onSubmit={upload} style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
          <input
            type="file"
            accept=".pdf,.txt,.pptx"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          />
          <button type="submit" disabled={!file || uploading} data-analytics="course-upload">
            {uploading ? "Uploading…" : "Upload"}
          </button>
        </form>
        {uploadSuccess && (
          <p style={{ margin: "0.75rem 0 0", fontSize: "0.9rem", color: "var(--accent)" }}>
            Uploaded: {uploadSuccess}
          </p>
        )}
      </div>

      <div className="card">
        <h2 style={{ margin: "0 0 0.75rem", fontSize: "1.1rem" }}>Process course</h2>
        <p style={{ color: "var(--muted)", margin: "0 0 0.75rem", fontSize: "0.9rem" }}>
          Extract concepts from uploaded materials and generate study content (uses AI; requires OPENAI_API_KEY).
          Large files are processed in batches; run again to process more.
        </p>
        <button type="button" onClick={process} disabled={processing} data-analytics="course-process">
          {processing ? "Processing… (1–2 min, please wait)" : "Process"}
        </button>
      </div>

      <h2 style={{ fontSize: "1.1rem", marginBottom: "0.5rem" }}>Concepts ({concepts.length})</h2>
      {concepts.length === 0 ? (
        <p style={{ color: "var(--muted)" }}>No concepts yet. Upload materials and run Process.</p>
      ) : (
        <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
          {concepts.map((c) => (
            <li key={c.id} className="card">
              <strong>{c.name}</strong>
              {c.source_span && (
                <span style={{ color: "var(--muted)", marginLeft: "0.5rem" }}>({c.source_span})</span>
              )}
              <p style={{ margin: "0.5rem 0 0", fontSize: "0.9rem", color: "var(--muted)" }}>
                {c.explanation}
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
