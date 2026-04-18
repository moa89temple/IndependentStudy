import { useMemo } from "react";
import type { AdminAnalytics, AdminCounts, AdminDailyActivity } from "../../api";

const ACCENT = "var(--accent)";
const ACCENT_DIM = "var(--accent-dim)";
const MUTED = "var(--muted)";
const BORDER = "var(--border)";

function pctLabel(correct: number, total: number): string {
  if (!total) return "—";
  return `${Math.round((100 * correct) / total)}%`;
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
        Bar width is proportional to each stage versus the largest stage in this snapshot.
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
                    background: `linear-gradient(90deg, ${ACCENT_DIM}, ${ACCENT})`,
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
  const { fc, q, total, fcCorrect, qCorrect } = useMemo(() => {
    const fcRow = types.find((t) => t.target_type === "flashcard");
    const qRow = types.find((t) => t.target_type === "question");
    const fc = fcRow?.total ?? 0;
    const q = qRow?.total ?? 0;
    return {
      fc,
      q,
      total: fc + q,
      fcCorrect: fcRow?.correct ?? 0,
      qCorrect: qRow?.correct ?? 0,
    };
  }, [types]);

  if (!total) {
    return (
      <div className="card" style={{ marginBottom: 0, minHeight: 200, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <p style={{ color: MUTED, margin: 0 }}>No study interactions in this snapshot — the split chart appears once attempts exist.</p>
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
      <h3 style={{ margin: "0 0 0.35rem", fontSize: "1rem" }}>Mode split (from interactions)</h3>
      <p style={{ margin: "0 0 0.75rem", color: MUTED, fontSize: "0.88rem", lineHeight: 1.5 }}>Share of recorded attempts by modality.</p>
      <div style={{ display: "flex", alignItems: "center", gap: "1.5rem", flexWrap: "wrap" }}>
        {donut}
        <div style={{ flex: "1 1 160px" }}>
          <div style={{ marginBottom: "0.5rem" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <span style={{ width: 10, height: 10, borderRadius: 2, background: ACCENT }} />
              <span style={{ fontSize: "0.9rem", textTransform: "capitalize" }}>Flashcards</span>
              <span style={{ fontFamily: "var(--font-mono)", color: MUTED, marginLeft: "auto" }}>{fc}</span>
            </div>
            <div style={{ fontSize: "0.8rem", color: MUTED, marginTop: 4, paddingLeft: 18 }}>
              {fcCorrect} correct · {pctLabel(fcCorrect, fc)} accuracy
            </div>
          </div>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <span style={{ width: 10, height: 10, borderRadius: 2, background: "#3b82f6" }} />
              <span style={{ fontSize: "0.9rem", textTransform: "capitalize" }}>Questions</span>
              <span style={{ fontFamily: "var(--font-mono)", color: MUTED, marginLeft: "auto" }}>{q}</span>
            </div>
            <div style={{ fontSize: "0.8rem", color: MUTED, marginTop: 4, paddingLeft: 18 }}>
              {qCorrect} correct · {pctLabel(qCorrect, q)} accuracy
            </div>
          </div>
          <p style={{ margin: "0.75rem 0 0", fontSize: "0.8rem", color: MUTED }}>Total attempts: {total}</p>
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
        <span style={{ fontSize: "0.8rem", color: MUTED }}>Trend (daily totals)</span>
        <span style={{ fontSize: "0.75rem", color: MUTED }}>green = attempts · blue = daily accuracy</span>
      </div>
      <svg viewBox="0 0 100 44" preserveAspectRatio="none" style={{ width: "100%", height: 72, display: "block" }}>
        <rect x="0" y="0" width="100" height="44" fill="transparent" />
        <polyline fill="none" stroke={ACCENT} strokeWidth="1.4" strokeLinejoin="round" strokeLinecap="round" points={pointsTotal} />
        <polyline fill="none" stroke="#60a5fa" strokeWidth="1.1" strokeLinejoin="round" strokeLinecap="round" points={pointsAcc} opacity={0.95} />
      </svg>
    </div>
  );
}

/** Charts derived only from the current analytics payload (same source as KPIs and tables). */
export function AnalyticsVisualSection({ data }: { data: AdminAnalytics }) {
  return (
    <>
      <h2 style={{ fontSize: "1.05rem", margin: "1.5rem 0 0.75rem" }}>Data visualizations</h2>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 280px), 1fr))",
          gap: "1rem",
          marginBottom: "1.25rem",
        }}
      >
        <ContentFunnelVisual counts={data.counts} interactionsTotal={data.study.interactions_total} />
        <StudyModeDonut types={data.interaction_types} />
      </div>
    </>
  );
}
