import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { api, type AdminAnalytics, type AdminCourseRollup, type AdminDailyActivity } from "../api";

function pct(part: number, whole: number): string {
  if (!whole) return "—";
  return `${Math.round((100 * part) / whole)}%`;
}

function StatCard({ label, value, hint }: { label: string; value: string | number; hint?: string }) {
  return (
    <div className="card" style={{ marginBottom: 0 }}>
      <div style={{ color: "var(--muted)", fontSize: "0.8rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.04em" }}>
        {label}
      </div>
      <div style={{ fontSize: "1.75rem", fontWeight: 800, marginTop: "0.35rem", fontFamily: "var(--font-mono)" }}>{value}</div>
      {hint ? (
        <div style={{ color: "var(--muted)", fontSize: "0.85rem", marginTop: "0.35rem" }}>{hint}</div>
      ) : null}
    </div>
  );
}

function InsightCard({ title, detail, tone }: { title: string; detail: string; tone: string }) {
  const border =
    tone === "positive" ? "var(--right)" : tone === "warning" ? "var(--wrong)" : "var(--border)";
  return (
    <div className="card" style={{ marginBottom: "0.75rem", borderLeft: `4px solid ${border}` }}>
      <strong style={{ display: "block", marginBottom: "0.35rem" }}>{title}</strong>
      <p style={{ margin: 0, color: "var(--muted)", lineHeight: 1.55 }}>{detail}</p>
    </div>
  );
}

function ActivityChart({ rows }: { rows: AdminDailyActivity[] }) {
  const max = useMemo(() => Math.max(1, ...rows.map((r) => r.total)), [rows]);
  if (!rows.length) {
    return <p style={{ color: "var(--muted)", margin: 0 }}>No study events in the last 30 days.</p>;
  }
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.45rem" }}>
      {rows.map((r) => (
        <div key={r.day} style={{ display: "grid", gridTemplateColumns: "92px 1fr 48px", gap: "0.65rem", alignItems: "center" }}>
          <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.8rem", color: "var(--muted)" }}>{r.day}</span>
          <div style={{ height: 10, background: "var(--bg)", borderRadius: 999, overflow: "hidden", border: "1px solid var(--border)" }}>
            <div
              title={`${r.total} attempts, ${pct(r.correct, r.total)} correct`}
              style={{
                height: "100%",
                width: `${(100 * r.total) / max}%`,
                background: "linear-gradient(90deg, var(--accent-dim), var(--accent))",
                borderRadius: 999,
              }}
            />
          </div>
          <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.8rem", textAlign: "right" }}>{r.total}</span>
        </div>
      ))}
    </div>
  );
}

function CourseTable({ courses }: { courses: AdminCourseRollup[] }) {
  if (!courses.length) return <p style={{ color: "var(--muted)", margin: 0 }}>No courses.</p>;
  return (
    <div style={{ overflowX: "auto" }}>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.9rem" }}>
        <thead>
          <tr style={{ textAlign: "left", color: "var(--muted)" }}>
            <th style={{ padding: "0.5rem 0.35rem" }}>Course</th>
            <th style={{ padding: "0.5rem 0.35rem" }}>Materials</th>
            <th style={{ padding: "0.5rem 0.35rem" }}>Concepts</th>
            <th style={{ padding: "0.5rem 0.35rem" }}>FC / Q</th>
            <th style={{ padding: "0.5rem 0.35rem" }}>Study events</th>
          </tr>
        </thead>
        <tbody>
          {courses.map((c) => (
            <tr key={c.course_id} style={{ borderTop: "1px solid var(--border)" }}>
              <td style={{ padding: "0.55rem 0.35rem" }}>
                <Link to={`/courses/${c.course_id}`} style={{ fontWeight: 600, color: "var(--text)" }}>
                  {c.name}
                </Link>
                <div style={{ color: "var(--muted)", fontSize: "0.8rem" }}>/{c.slug}</div>
              </td>
              <td style={{ padding: "0.55rem 0.35rem", fontFamily: "var(--font-mono)" }}>{c.materials}</td>
              <td style={{ padding: "0.55rem 0.35rem", fontFamily: "var(--font-mono)" }}>{c.concepts}</td>
              <td style={{ padding: "0.55rem 0.35rem", fontFamily: "var(--font-mono)", whiteSpace: "nowrap" }}>
                {c.flashcards} / {c.practice_questions}
              </td>
              <td style={{ padding: "0.55rem 0.35rem", fontFamily: "var(--font-mono)" }}>{c.study_interactions}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function Admin() {
  const [data, setData] = useState<AdminAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    setError(null);
    api.admin
      .analytics()
      .then(setData)
      .catch((e) => setError((e as Error).message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const accLabel = data?.study.accuracy == null ? "—" : `${Math.round(data.study.accuracy * 1000) / 10}%`;

  return (
    <div className="container" style={{ maxWidth: 1100 }}>
      <div className="page-header">
        <div>
          <h1 style={{ margin: 0 }}>Analytics</h1>
          <p style={{ margin: "0.35rem 0 0", color: "var(--muted)" }}>
            Product and learner signals to prioritize what to build next. Data is read-only and best-effort.
          </p>
        </div>
        <button type="button" className="secondary" onClick={load} disabled={loading}>
          Refresh
        </button>
      </div>

      {loading && !data ? <p style={{ color: "var(--muted)" }}>Loading…</p> : null}
      {error ? (
        <div className="card" style={{ borderColor: "var(--wrong)" }}>
          <strong>Could not load analytics</strong>
          <p style={{ margin: "0.5rem 0 0", color: "var(--muted)" }}>{error}</p>
        </div>
      ) : null}

      {data ? (
        <>
          <p style={{ color: "var(--muted)", fontSize: "0.85rem", marginTop: 0 }}>
            Snapshot: {data.generated_at}
          </p>

          <h2 style={{ fontSize: "1.05rem", margin: "1.5rem 0 0.75rem" }}>Application health</h2>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
              gap: "0.75rem",
              marginBottom: "1.25rem",
            }}
          >
            <StatCard label="Courses" value={data.counts.courses} />
            <StatCard label="Materials" value={data.counts.materials} hint={`${data.counts.text_chunks} chunks indexed`} />
            <StatCard label="Concepts" value={data.counts.concepts} />
            <StatCard label="Study items" value={data.counts.flashcards + data.counts.practice_questions} hint="Flashcards + questions" />
          </div>

          <h2 style={{ fontSize: "1.05rem", margin: "1.5rem 0 0.75rem" }}>Learner behavior</h2>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
              gap: "0.75rem",
              marginBottom: "1.25rem",
            }}
          >
            <StatCard label="Study attempts" value={data.study.interactions_total} hint={`${data.study.interactions_last_7d} in last 7d`} />
            <StatCard label="Accuracy" value={accLabel} hint={`${data.study.correct_total} correct`} />
            <StatCard label="Distinct users" value={data.study.distinct_users} hint="By interaction user_id" />
          </div>

          <h2 style={{ fontSize: "1.05rem", margin: "1.5rem 0 0.75rem" }}>Suggested actions</h2>
          <div style={{ marginBottom: "1.25rem" }}>
            {data.insights.map((i, idx) => (
              <InsightCard key={`${idx}-${i.title}`} title={i.title} detail={i.detail} tone={i.tone} />
            ))}
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1.1fr) minmax(0, 0.9fr)", gap: "1rem" }}>
            <div className="card" style={{ marginBottom: 0 }}>
              <h3 style={{ margin: "0 0 0.75rem", fontSize: "1rem" }}>Study volume (30d)</h3>
              <ActivityChart rows={data.daily_activity} />
            </div>
            <div className="card" style={{ marginBottom: 0 }}>
              <h3 style={{ margin: "0 0 0.75rem", fontSize: "1rem" }}>Mode mix</h3>
              <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
                {data.interaction_types.map((t) => (
                  <li key={t.target_type} style={{ display: "flex", justifyContent: "space-between", padding: "0.4rem 0", borderBottom: "1px solid var(--border)" }}>
                    <span style={{ textTransform: "capitalize" }}>{t.target_type}</span>
                    <span style={{ fontFamily: "var(--font-mono)", color: "var(--muted)" }}>
                      {t.total} · {pct(t.correct, t.total)} correct
                    </span>
                  </li>
                ))}
                {data.interaction_types.length === 0 ? (
                  <li style={{ color: "var(--muted)" }}>No interactions yet.</li>
                ) : null}
              </ul>
            </div>
          </div>

          <div className="card" style={{ marginTop: "1rem" }}>
            <h3 style={{ margin: "0 0 0.75rem", fontSize: "1rem" }}>Users (top by attempts)</h3>
            {data.users.length === 0 ? (
              <p style={{ color: "var(--muted)", margin: 0 }}>No user buckets yet.</p>
            ) : (
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.9rem" }}>
                  <thead>
                    <tr style={{ textAlign: "left", color: "var(--muted)" }}>
                      <th style={{ padding: "0.5rem 0.35rem" }}>user_id</th>
                      <th style={{ padding: "0.5rem 0.35rem" }}>Attempts</th>
                      <th style={{ padding: "0.5rem 0.35rem" }}>Correct</th>
                      <th style={{ padding: "0.5rem 0.35rem" }}>Accuracy</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.users.map((u) => (
                      <tr key={u.user_id} style={{ borderTop: "1px solid var(--border)" }}>
                        <td style={{ padding: "0.55rem 0.35rem", fontFamily: "var(--font-mono)", fontSize: "0.85rem" }}>{u.user_id}</td>
                        <td style={{ padding: "0.55rem 0.35rem", fontFamily: "var(--font-mono)" }}>{u.total}</td>
                        <td style={{ padding: "0.55rem 0.35rem", fontFamily: "var(--font-mono)" }}>{u.correct}</td>
                        <td style={{ padding: "0.55rem 0.35rem", fontFamily: "var(--font-mono)" }}>{pct(u.correct, u.total)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div className="card" style={{ marginTop: "1rem" }}>
            <h3 style={{ margin: "0 0 0.75rem", fontSize: "1rem" }}>Courses (recent)</h3>
            <CourseTable courses={data.courses} />
          </div>
        </>
      ) : null}
    </div>
  );
}
