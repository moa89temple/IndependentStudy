import { useMemo } from "react";
import type { AdminAnalytics, AdminCounts, AdminDailyActivity, AdminUserRollup } from "../../api";

const ACCENT = "var(--accent)";
const ACCENT_DIM = "var(--accent-dim)";
const MUTED = "var(--muted)";
const BORDER = "var(--border)";
const SURFACE = "var(--surface)";
const WRONG = "var(--wrong)";
const TEXT = "var(--text)";

/** Static system diagram: how telemetry moves from client to admin. */
export function TelemetryPipelineDiagram() {
  return (
    <div className="card" style={{ marginBottom: 0 }}>
      <h3 style={{ margin: "0 0 0.35rem", fontSize: "1rem" }}>Telemetry pipeline</h3>
      <p style={{ margin: "0 0 0.75rem", color: MUTED, fontSize: "0.88rem", lineHeight: 1.5 }}>
        UI clicks are batched from the browser, persisted, then aggregated into the admin heatmap and top-target lists.
      </p>
      <svg viewBox="0 0 520 200" role="img" aria-label="Flow from browser to database to admin dashboard" style={{ width: "100%", maxHeight: 220, display: "block" }}>
        <defs>
          <marker id="admTelArrow" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto">
            <path d="M0,0 L8,4 L0,8 Z" fill={ACCENT} />
          </marker>
          <linearGradient id="boxGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#1f2937" />
            <stop offset="100%" stopColor="#111827" />
          </linearGradient>
        </defs>
        <rect x="8" y="68" width="120" height="64" rx="10" fill="url(#boxGrad)" stroke={BORDER} strokeWidth="1.5" />
        <text x="68" y="98" textAnchor="middle" fill={TEXT} fontSize="13" fontWeight="700">
          Browser
        </text>
        <text x="68" y="118" textAnchor="middle" fill={MUTED} fontSize="11">
          capture phase
        </text>

        <line x1="128" y1="100" x2="168" y2="100" stroke={ACCENT} strokeWidth="2" markerEnd="url(#admTelArrow)" />

        <rect x="168" y="56" width="132" height="88" rx="10" fill="url(#boxGrad)" stroke={ACCENT_DIM} strokeWidth="1.5" />
        <text x="234" y="88" textAnchor="middle" fill={TEXT} fontSize="13" fontWeight="700">
          POST /api/ux/clicks
        </text>
        <text x="234" y="108" textAnchor="middle" fill={MUTED} fontSize="11">
          batched JSON
        </text>
        <text x="234" y="128" textAnchor="middle" fill={MUTED} fontSize="11">
          path · element_key
        </text>

        <line x1="300" y1="100" x2="340" y2="100" stroke={ACCENT} strokeWidth="2" markerEnd="url(#admTelArrow)" />

        <rect x="340" y="62" width="120" height="76" rx="10" fill="url(#boxGrad)" stroke={BORDER} strokeWidth="1.5" />
        <text x="400" y="94" textAnchor="middle" fill={TEXT} fontSize="13" fontWeight="700">
          SQLite
        </text>
        <text x="400" y="114" textAnchor="middle" fill={MUTED} fontSize="11">
          ui_clicks
        </text>

        <line x1="400" y1="138" x2="400" y2="158" stroke={ACCENT} strokeWidth="2" markerEnd="url(#admTelArrow)" />

        <rect x="310" y="158" width="180" height="36" rx="8" fill={SURFACE} stroke={BORDER} strokeWidth="1.2" />
        <text x="400" y="181" textAnchor="middle" fill={TEXT} fontSize="12" fontWeight="600">
          GET /api/admin/analytics → heatmap
        </text>
      </svg>
    </div>
  );
}

/** Static user-journey flowchart aligned to the product UI. */
export function UserJourneyFlowchart() {
  return (
    <div className="card" style={{ marginBottom: 0 }}>
      <h3 style={{ margin: "0 0 0.35rem", fontSize: "1rem" }}>Primary user journey</h3>
      <p style={{ margin: "0 0 0.75rem", color: MUTED, fontSize: "0.88rem", lineHeight: 1.5 }}>
        Happy-path flow from discovery through content generation to measured study outcomes.
      </p>
      <svg viewBox="0 0 520 260" role="img" aria-label="User journey from courses to study to logged interactions" style={{ width: "100%", maxHeight: 280, display: "block" }}>
        <defs>
          <marker id="admJourneyArrow" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto">
            <path d="M0,0 L8,4 L0,8 Z" fill={ACCENT} />
          </marker>
        </defs>

        <rect x="190" y="12" width="140" height="44" rx="10" fill={SURFACE} stroke={BORDER} strokeWidth="1.5" />
        <text x="260" y="40" textAnchor="middle" fill={TEXT} fontSize="14" fontWeight="700">
          Courses
        </text>

        <line x1="260" y1="56" x2="260" y2="78" stroke={ACCENT} strokeWidth="2" markerEnd="url(#admJourneyArrow)" />

        <rect x="150" y="78" width="220" height="44" rx="10" fill={SURFACE} stroke={ACCENT_DIM} strokeWidth="1.5" />
        <text x="260" y="106" textAnchor="middle" fill={TEXT} fontSize="13" fontWeight="700">
          Upload material → Process
        </text>

        <line x1="260" y1="122" x2="260" y2="144" stroke={ACCENT} strokeWidth="2" markerEnd="url(#admJourneyArrow)" />

        <rect x="170" y="144" width="180" height="44" rx="10" fill={SURFACE} stroke={BORDER} strokeWidth="1.5" />
        <text x="260" y="172" textAnchor="middle" fill={TEXT} fontSize="13" fontWeight="700">
          Concepts + study items
        </text>

        <line x1="260" y1="188" x2="260" y2="210" stroke={ACCENT} strokeWidth="2" markerEnd="url(#admJourneyArrow)" />

        <rect x="200" y="210" width="120" height="40" rx="10" fill={SURFACE} stroke={BORDER} strokeWidth="1.5" />
        <text x="260" y="236" textAnchor="middle" fill={TEXT} fontSize="13" fontWeight="700">
          Study
        </text>

        <line x1="320" y1="230" x2="380" y2="230" stroke={ACCENT} strokeWidth="2" markerEnd="url(#admJourneyArrow)" />

        <rect x="380" y="206" width="120" height="48" rx="10" fill={SURFACE} stroke={WRONG} strokeWidth="1.2" opacity={0.95} />
        <text x="440" y="228" textAnchor="middle" fill={TEXT} fontSize="12" fontWeight="700">
          Interactions
        </text>
        <text x="440" y="246" textAnchor="middle" fill={MUTED} fontSize="10">
          accuracy · volume
        </text>
      </svg>
    </div>
  );
}

type FunnelStage = { label: string; value: number; hint?: string };

export function ContentFunnelVisual({ counts, interactionsTotal }: { counts: AdminCounts; interactionsTotal: number }) {
  const stages: FunnelStage[] = useMemo(
    () => [
      { label: "Courses", value: counts.courses },
      { label: "Materials", value: counts.materials, hint: "uploads" },
      { label: "Concepts", value: counts.concepts, hint: "extracted" },
      { label: "Study items", value: counts.flashcards + counts.practice_questions, hint: "FC + Q" },
      { label: "Study attempts", value: interactionsTotal, hint: "logged" },
    ],
    [counts, interactionsTotal],
  );
  const maxV = Math.max(1, ...stages.map((s) => s.value));

  return (
    <div className="card" style={{ marginBottom: 0 }}>
      <h3 style={{ margin: "0 0 0.35rem", fontSize: "1rem" }}>Content & engagement funnel</h3>
      <p style={{ margin: "0 0 0.75rem", color: MUTED, fontSize: "0.88rem", lineHeight: 1.5 }}>
        Relative width shows where inventory drops off from catalog breadth down to measured practice.
      </p>
      <div style={{ display: "flex", flexDirection: "column", gap: "0.55rem" }}>
        {stages.map((s) => {
          const w = Math.max(4, (100 * s.value) / maxV);
          return (
            <div key={s.label}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 4 }}>
                <span style={{ fontWeight: 600, fontSize: "0.9rem" }}>{s.label}</span>
                <span style={{ fontFamily: "var(--font-mono)", color: MUTED, fontSize: "0.85rem" }}>
                  {s.value}
                  {s.hint ? <span style={{ marginLeft: 6, opacity: 0.85 }}>({s.hint})</span> : null}
                </span>
              </div>
              <div style={{ height: 12, background: "var(--bg)", borderRadius: 999, border: `1px solid ${BORDER}`, overflow: "hidden" }}>
                <div
                  style={{
                    height: "100%",
                    width: `${w}%`,
                    borderRadius: 999,
                    background: "linear-gradient(90deg, var(--accent-dim), var(--accent))",
                    transition: "width 0.35s ease",
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function StudyModeDonut({ types }: { types: AdminAnalytics["interaction_types"] }) {
  const { fc, q, total } = useMemo(() => {
    const fcRow = types.find((t) => t.target_type === "flashcard");
    const qRow = types.find((t) => t.target_type === "question");
    const fc = fcRow?.total ?? 0;
    const q = qRow?.total ?? 0;
    return { fc, q, total: fc + q };
  }, [types]);

  if (!total) {
    return (
      <div className="card" style={{ marginBottom: 0, minHeight: 200, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <p style={{ color: MUTED, margin: 0 }}>No study interactions yet — donut will appear after learners practice.</p>
      </div>
    );
  }

  const fcPct = (100 * fc) / total;
  const qPct = 100 - fcPct;
  const donut = (
    <div
      style={{
        width: 140,
        height: 140,
        borderRadius: "50%",
        background: `conic-gradient(${ACCENT} 0 ${fcPct}%, #3b82f6 ${fcPct}% 100%)`,
        WebkitMask: "radial-gradient(farthest-side, transparent 56%, #000 57%)",
        mask: "radial-gradient(farthest-side, transparent 56%, #000 57%)",
      }}
      title={`Flashcards ${fcPct.toFixed(1)}% · Questions ${qPct.toFixed(1)}%`}
    />
  );

  return (
    <div className="card" style={{ marginBottom: 0 }}>
      <h3 style={{ margin: "0 0 0.35rem", fontSize: "1rem" }}>Mode split</h3>
      <p style={{ margin: "0 0 0.75rem", color: MUTED, fontSize: "0.88rem", lineHeight: 1.5 }}>Share of attempts by study modality.</p>
      <div style={{ display: "flex", alignItems: "center", gap: "1.5rem", flexWrap: "wrap" }}>
        {donut}
        <div style={{ flex: "1 1 160px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.5rem" }}>
            <span style={{ width: 10, height: 10, borderRadius: 2, background: ACCENT }} />
            <span style={{ fontSize: "0.9rem" }}>Flashcards</span>
            <span style={{ fontFamily: "var(--font-mono)", color: MUTED, marginLeft: "auto" }}>{fc}</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <span style={{ width: 10, height: 10, borderRadius: 2, background: "#3b82f6" }} />
            <span style={{ fontSize: "0.9rem" }}>Questions</span>
            <span style={{ fontFamily: "var(--font-mono)", color: MUTED, marginLeft: "auto" }}>{q}</span>
          </div>
          <p style={{ margin: "0.75rem 0 0", fontSize: "0.8rem", color: MUTED }}>Total attempts charted: {total}</p>
        </div>
      </div>
    </div>
  );
}

export function DailyActivitySparkline({ rows }: { rows: AdminDailyActivity[] }) {
  const { pointsTotal, pointsAcc } = useMemo(() => {
    if (!rows.length) return { pointsTotal: "", pointsAcc: "" };
    const totals = rows.map((r) => r.total);
    const accs = rows.map((r) => (r.total ? r.correct / r.total : 0));
    const maxY = Math.max(1, ...totals);
    const n = rows.length;
    const pad = 4;
    const w = 100 - pad * 2;
    const h = 36;
    const toX = (i: number) => pad + (w * i) / Math.max(1, n - 1);
    const toY = (v: number) => pad + h - (h * v) / maxY;
    const pointsTotal = totals.map((v, i) => `${toX(i).toFixed(2)},${toY(v).toFixed(2)}`).join(" ");
    const maxAcc = 1;
    const toYAcc = (a: number) => pad + h - (h * a) / maxAcc;
    const pointsAcc = accs.map((a, i) => `${toX(i).toFixed(2)},${toYAcc(a).toFixed(2)}`).join(" ");
    return { pointsTotal, pointsAcc };
  }, [rows]);

  if (!rows.length) {
    return null;
  }

  return (
    <div style={{ marginBottom: "0.85rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
        <span style={{ fontSize: "0.8rem", color: MUTED }}>Sparkline (30d)</span>
        <span style={{ fontSize: "0.75rem", color: MUTED }}>green = attempts · blue = accuracy</span>
      </div>
      <svg viewBox="0 0 100 44" preserveAspectRatio="none" style={{ width: "100%", height: 72, display: "block" }}>
        <rect x="0" y="0" width="100" height="44" fill="transparent" />
        <polyline fill="none" stroke={ACCENT} strokeWidth="1.4" strokeLinejoin="round" strokeLinecap="round" points={pointsTotal} />
        <polyline fill="none" stroke="#60a5fa" strokeWidth="1.1" strokeLinejoin="round" strokeLinecap="round" points={pointsAcc} opacity={0.95} />
      </svg>
    </div>
  );
}

export function UserAttemptsBars({ users }: { users: AdminUserRollup[] }) {
  const max = useMemo(() => Math.max(1, ...users.map((u) => u.total)), [users]);
  if (!users.length) {
    return (
      <div className="card" style={{ marginBottom: 0 }}>
        <h3 style={{ margin: "0 0 0.35rem", fontSize: "1rem" }}>Learner volume (relative)</h3>
        <p style={{ margin: 0, color: MUTED, fontSize: "0.9rem" }}>No user buckets yet — bars appear once interactions include user_id splits.</p>
      </div>
    );
  }
  const top = users.slice(0, 8);

  return (
    <div className="card" style={{ marginBottom: 0 }}>
      <h3 style={{ margin: "0 0 0.35rem", fontSize: "1rem" }}>Learner volume (relative)</h3>
      <p style={{ margin: "0 0 0.75rem", color: MUTED, fontSize: "0.88rem", lineHeight: 1.5 }}>Horizontal bars compare attempt counts across the top user buckets.</p>
      <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
        {top.map((u) => (
          <div key={u.user_id}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: "0.5rem", marginBottom: 4 }}>
              <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.78rem", wordBreak: "break-all" }}>{u.user_id}</span>
              <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.78rem", color: MUTED }}>{u.total}</span>
            </div>
            <div style={{ height: 8, background: "var(--bg)", borderRadius: 999, border: `1px solid ${BORDER}`, overflow: "hidden" }}>
              <div
                style={{
                  height: "100%",
                  width: `${(100 * u.total) / max}%`,
                  borderRadius: 999,
                  background: "linear-gradient(90deg, #15803d, var(--accent))",
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/** Learning loop: practice → signal → iterate (static). */
export function LearningLoopDiagram() {
  return (
    <div className="card" style={{ marginBottom: 0 }}>
      <h3 style={{ margin: "0 0 0.35rem", fontSize: "1rem" }}>Analytics feedback loop</h3>
      <p style={{ margin: "0 0 0.75rem", color: MUTED, fontSize: "0.88rem", lineHeight: 1.5 }}>
        How product telemetry closes the loop between learner behavior and your next iteration.
      </p>
      <svg viewBox="0 0 360 200" role="img" aria-label="Cycle from ship to observe to decide to ship" style={{ width: "100%", maxHeight: 220, display: "block" }}>
        <defs>
          <marker id="admLoopArrow" markerWidth="7" markerHeight="7" refX="6" refY="3.5" orient="auto">
            <path d="M0,0 L7,3.5 L0,7 Z" fill={ACCENT} />
          </marker>
        </defs>
        <ellipse cx="180" cy="100" rx="150" ry="78" fill="none" stroke={BORDER} strokeWidth="1.5" strokeDasharray="6 6" />

        <rect x="120" y="24" width="120" height="40" rx="10" fill={SURFACE} stroke={ACCENT_DIM} strokeWidth="1.2" />
        <text x="180" y="50" textAnchor="middle" fill={TEXT} fontSize="12" fontWeight="700">
          Ship / change UI
        </text>

        <path d="M240 44 C 300 44, 310 100, 260 140" fill="none" stroke={ACCENT} strokeWidth="1.8" markerEnd="url(#admLoopArrow)" />

        <rect x="228" y="132" width="112" height="40" rx="10" fill={SURFACE} stroke={BORDER} strokeWidth="1.2" />
        <text x="284" y="158" textAnchor="middle" fill={TEXT} fontSize="12" fontWeight="700">
          Observe metrics
        </text>

        <path d="M228 152 C 120 170, 60 120, 72 64" fill="none" stroke={ACCENT} strokeWidth="1.8" markerEnd="url(#admLoopArrow)" />

        <rect x="24" y="120" width="112" height="40" rx="10" fill={SURFACE} stroke={BORDER} strokeWidth="1.2" />
        <text x="80" y="146" textAnchor="middle" fill={TEXT} fontSize="12" fontWeight="700">
          Decide priorities
        </text>

        <path d="M80 120 C 40 80, 80 40, 140 44" fill="none" stroke={ACCENT} strokeWidth="1.8" markerEnd="url(#admLoopArrow)" />
      </svg>
    </div>
  );
}

export function AnalyticsVisualSection({ data }: { data: AdminAnalytics }) {
  return (
    <>
      <h2 style={{ fontSize: "1.05rem", margin: "1.5rem 0 0.75rem" }}>Diagrams & visual summaries</h2>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 320px), 1fr))",
          gap: "1rem",
          marginBottom: "1.25rem",
        }}
      >
        <TelemetryPipelineDiagram />
        <UserJourneyFlowchart />
      </div>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 280px), 1fr))",
          gap: "1rem",
          marginBottom: "1.25rem",
        }}
      >
        <LearningLoopDiagram />
        <ContentFunnelVisual counts={data.counts} interactionsTotal={data.study.interactions_total} />
        <StudyModeDonut types={data.interaction_types} />
      </div>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 280px), 1fr))",
          gap: "1rem",
          marginBottom: "1.25rem",
        }}
      >
        <UserAttemptsBars users={data.users} />
      </div>
    </>
  );
}
