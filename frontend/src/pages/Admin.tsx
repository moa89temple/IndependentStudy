import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { api, type AdminAnalytics, type AdminCourseRollup, type AdminDailyActivity, type AdminUx } from "../api";
import { DEMO_ADMIN_ANALYTICS } from "../data/adminDemoData";
import { AnalyticsVisualSection, DailyActivitySparkline } from "../components/admin/AnalyticsDiagrams";

const DEMO_STORAGE_KEY = "lizard-admin-demo";

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

function UxHeatmapPanel({ ux }: { ux: AdminUx }) {
  const { heatmap } = ux;
  const max = Math.max(1, heatmap.max_count);
  const cellMap = useMemo(() => {
    const m = new Map<string, number>();
    for (const c of heatmap.cells) m.set(`${c.gx}-${c.gy}`, c.count);
    return m;
  }, [heatmap.cells]);

  const tiles = useMemo(() => {
    const out: { key: string; gx: number; gy: number; count: number }[] = [];
    for (let gy = 0; gy < heatmap.rows; gy++) {
      for (let gx = 0; gx < heatmap.columns; gx++) {
        const count = cellMap.get(`${gx}-${gy}`) ?? 0;
        out.push({ key: `${gx}-${gy}`, gx, gy, count });
      }
    }
    return out;
  }, [cellMap, heatmap.columns, heatmap.rows]);

  return (
    <div className="card" style={{ marginBottom: 0 }}>
      <h3 style={{ margin: "0 0 0.5rem", fontSize: "1rem" }}>UX click heatmap</h3>
      <p style={{ margin: "0 0 0.75rem", color: "var(--muted)", fontSize: "0.9rem", lineHeight: 1.5 }}>
        Clicks on buttons and links are normalized to the viewport (0–1) and bucketed into a {heatmap.columns}×{heatmap.rows}{" "}
        grid. Brighter cells indicate more activity in that screen region (last {ux.window_days} days, {ux.total_clicks}{" "}
        events).
      </p>
      <div style={{ display: "flex", flexWrap: "wrap", gap: "1rem", alignItems: "flex-start" }}>
        <div
          style={{
            width: "100%",
            maxWidth: 520,
            aspectRatio: `${heatmap.columns} / ${heatmap.rows}`,
            display: "grid",
            gridTemplateColumns: `repeat(${heatmap.columns}, minmax(0, 1fr))`,
            gridTemplateRows: `repeat(${heatmap.rows}, minmax(0, 1fr))`,
            gap: 2,
            padding: 8,
            background: "var(--bg)",
            border: "1px solid var(--border)",
            borderRadius: 12,
          }}
        >
          {tiles.map((t) => {
            const intensity = t.count / max;
            const bg = t.count ? `rgba(34, 197, 94, ${0.1 + intensity * 0.9})` : "rgba(255,255,255,0.03)";
            return (
              <div
                key={t.key}
                title={t.count ? `${t.count} click(s) near column ${t.gx + 1}, row ${t.gy + 1}` : "No data"}
                style={{ background: bg, borderRadius: 3, minHeight: 8 }}
              />
            );
          })}
        </div>
        <div>
          <h4 style={{ margin: "0 0 0.5rem", fontSize: "0.95rem", color: "var(--muted)" }}>Top tracked targets</h4>
          {ux.top_elements.length === 0 ? (
            <p style={{ color: "var(--muted)", margin: 0 }}>No UI clicks recorded yet. Navigate the app to populate this view.</p>
          ) : (
            <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
              {ux.top_elements.map((el) => (
                <li
                  key={el.element_key}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    gap: "0.75rem",
                    padding: "0.45rem 0",
                    borderBottom: "1px solid var(--border)",
                    fontSize: "0.88rem",
                  }}
                >
                  <span style={{ fontFamily: "var(--font-mono)", wordBreak: "break-all" }}>{el.element_key}</span>
                  <span style={{ color: "var(--muted)", whiteSpace: "nowrap" }}>
                    {el.clicks} · <span style={{ fontSize: "0.8rem" }}>{el.last_path}</span>
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
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
  const [demoMode, setDemoMode] = useState(() => localStorage.getItem(DEMO_STORAGE_KEY) === "1");
  const [data, setData] = useState<AdminAnalytics | null>(() =>
    localStorage.getItem(DEMO_STORAGE_KEY) === "1" ? { ...DEMO_ADMIN_ANALYTICS, generated_at: new Date().toISOString() } : null,
  );
  const [loading, setLoading] = useState(() => localStorage.getItem(DEMO_STORAGE_KEY) !== "1");
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
    if (demoMode) {
      setData({ ...DEMO_ADMIN_ANALYTICS, generated_at: new Date().toISOString() });
      setLoading(false);
      setError(null);
      return;
    }
    load();
  }, [demoMode, load]);

  const refresh = useCallback(() => {
    if (demoMode) {
      setData({ ...DEMO_ADMIN_ANALYTICS, generated_at: new Date().toISOString() });
      return;
    }
    load();
  }, [demoMode, load]);

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
        <div style={{ display: "flex", alignItems: "center", gap: "1rem", flexWrap: "wrap", justifyContent: "flex-end" }}>
          <label
            data-no-ux-track
            style={{ display: "flex", alignItems: "center", gap: "0.45rem", cursor: "pointer", userSelect: "none", color: "var(--muted)", fontSize: "0.9rem" }}
          >
            <input
              type="checkbox"
              checked={demoMode}
              onChange={(e) => {
                const v = e.target.checked;
                localStorage.setItem(DEMO_STORAGE_KEY, v ? "1" : "0");
                setDemoMode(v);
              }}
            />
            Demonstration data
          </label>
          <button type="button" className="secondary" onClick={refresh} disabled={loading && !demoMode}>
            Refresh
          </button>
        </div>
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
          {demoMode ? (
            <div className="card" style={{ marginBottom: "1rem", borderColor: "var(--accent)", background: "rgba(34, 197, 94, 0.07)" }}>
              <strong>Demonstration mode</strong>
              <p style={{ margin: "0.35rem 0 0", color: "var(--muted)", lineHeight: 1.55 }}>
                Metrics, insights, and the UX heatmap below use curated sample data for walkthroughs. Disable the toggle to load live
                telemetry from the API.
              </p>
            </div>
          ) : null}
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

          <AnalyticsVisualSection data={data} />

          <h2 style={{ fontSize: "1.05rem", margin: "1.5rem 0 0.75rem" }}>Suggested actions</h2>
          <div style={{ marginBottom: "1.25rem" }}>
            {data.insights.map((i, idx) => (
              <InsightCard key={`${idx}-${i.title}`} title={i.title} detail={i.detail} tone={i.tone} />
            ))}
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1.1fr) minmax(0, 0.9fr)", gap: "1rem" }}>
            <div className="card" style={{ marginBottom: 0 }}>
              <h3 style={{ margin: "0 0 0.75rem", fontSize: "1rem" }}>Study volume (30d)</h3>
              <DailyActivitySparkline rows={data.daily_activity} />
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

          <h2 style={{ fontSize: "1.05rem", margin: "1.5rem 0 0.75rem" }}>Product UX</h2>
          <UxHeatmapPanel ux={data.ux} />

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
