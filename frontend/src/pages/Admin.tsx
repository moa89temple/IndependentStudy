import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { BarChart3, BookOpen, RefreshCw, Sparkles, Users } from "lucide-react";
import { api, type AdminAnalytics, type AdminCourseRollup, type AdminDailyActivity, type AdminUx } from "../api";
import { DEMO_ADMIN_ANALYTICS } from "../data/adminDemoData";
import { AnalyticsVisualSection, DailyActivitySparkline } from "../components/admin/AnalyticsDiagrams";
import { PageHeader } from "@/components/lms/PageHeader";
import { StatCard } from "@/components/lms/StatCard";
import { Section } from "@/components/lms/Section";
import { cn } from "@/lib/utils";

const DEMO_STORAGE_KEY = "lizard-admin-demo";

function pct(part: number, whole: number): string {
  if (!whole) return "—";
  return `${Math.round((100 * part) / whole)}%`;
}

function InsightCard({ title, detail, tone }: { title: string; detail: string; tone: string }) {
  const borderClass =
    tone === "positive"
      ? "border-l-[var(--success)]"
      : tone === "warning"
        ? "border-l-amber-500"
        : "border-l-[var(--border)]";
  return (
    <div
      className={cn(
        "lms-card border-l-4 pl-4",
        borderClass
      )}
    >
      <strong className="block text-sm font-semibold text-[var(--foreground)]">{title}</strong>
      <p className="mt-1.5 text-sm leading-relaxed text-[var(--muted-foreground)]">{detail}</p>
    </div>
  );
}

function ActivityChart({ rows }: { rows: AdminDailyActivity[] }) {
  const max = useMemo(() => Math.max(1, ...rows.map((r) => r.total)), [rows]);
  if (!rows.length) {
    return <p className="m-0 text-sm text-[var(--muted-foreground)]">No study events in the last 30 days.</p>;
  }
  return (
    <div className="flex flex-col gap-2">
      {rows.map((r) => (
        <div
          key={r.day}
          className="grid grid-cols-[5.5rem_1fr_3rem] items-center gap-2 sm:grid-cols-[6.5rem_1fr_3rem]"
        >
          <span className="font-mono text-xs text-[var(--muted-foreground)]">{r.day}</span>
          <div className="h-2.5 overflow-hidden rounded-full border border-[var(--border)] bg-[var(--muted)]">
            <div
              title={`${r.total} attempts, ${pct(r.correct, r.total)} correct`}
              className="h-full rounded-full bg-[var(--primary)]"
              style={{ width: `${(100 * r.total) / max}%` }}
            />
          </div>
          <span className="text-right font-mono text-xs tabular-nums text-[var(--foreground)]">{r.total}</span>
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
    <div className="lms-card space-y-4">
      <h3 className="m-0 text-base font-bold text-[var(--foreground)]">UX click heatmap</h3>
      <p className="m-0 text-sm leading-relaxed text-[var(--muted-foreground)]">
        Clicks on buttons and links are normalized to the viewport (0–1) and bucketed into a {heatmap.columns}×{heatmap.rows} grid. Brighter
        cells indicate more activity in that screen region (last {ux.window_days} days, {ux.total_clicks} events).
      </p>
      <div className="flex flex-col flex-wrap items-start gap-6 lg:flex-row">
        <div
          className="grid w-full max-w-lg gap-0.5 rounded-xl border border-[var(--border)] bg-[var(--muted)]/50 p-2"
          style={{
            aspectRatio: `${heatmap.columns} / ${heatmap.rows}`,
            gridTemplateColumns: `repeat(${heatmap.columns}, minmax(0, 1fr))`,
            gridTemplateRows: `repeat(${heatmap.rows}, minmax(0, 1fr))`,
          }}
        >
          {tiles.map((t) => {
            const intensity = t.count / max;
            const bg = t.count
              ? `color-mix(in srgb, var(--primary) ${Math.round(20 + intensity * 80)}%, transparent)`
              : "color-mix(in srgb, var(--foreground) 4%, transparent)";
            return (
              <div
                key={t.key}
                title={t.count ? `${t.count} click(s) near column ${t.gx + 1}, row ${t.gy + 1}` : "No data"}
                className="min-h-2 rounded-sm"
                style={{ background: bg }}
              />
            );
          })}
        </div>
        <div className="min-w-0 flex-1">
          <h4 className="m-0 mb-2 text-sm font-semibold text-[var(--muted-foreground)]">Top tracked targets</h4>
          {ux.top_elements.length === 0 ? (
            <p className="m-0 text-sm text-[var(--muted-foreground)]">No UI clicks recorded yet. Navigate the app to populate this view.</p>
          ) : (
            <ul className="m-0 list-none space-y-0 p-0">
              {ux.top_elements.map((el) => (
                <li
                  key={el.element_key}
                  className="flex flex-col justify-between gap-1 border-b border-[var(--border)] py-2.5 text-sm last:border-0 sm:flex-row sm:items-center"
                >
                  <span className="break-all font-mono text-xs text-[var(--foreground)]">{el.element_key}</span>
                  <span className="shrink-0 text-xs text-[var(--muted-foreground)]">
                    {el.clicks} · {el.last_path}
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
  if (!courses.length) return <p className="m-0 text-sm text-[var(--muted-foreground)]">No courses.</p>;
  return (
    <div className="overflow-x-auto rounded-lg border border-[var(--border)]">
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="border-b border-[var(--border)] bg-[var(--muted)]/50 text-left text-xs font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">
            <th className="px-3 py-2.5">Course</th>
            <th className="px-3 py-2.5">Materials</th>
            <th className="px-3 py-2.5">Concepts</th>
            <th className="px-3 py-2.5">FC / Q</th>
            <th className="px-3 py-2.5">Study events</th>
          </tr>
        </thead>
        <tbody>
          {courses.map((c) => (
            <tr key={c.course_id} className="border-b border-[var(--border)] last:border-0">
              <td className="px-3 py-2.5">
                <Link
                  to={`/courses/${c.course_id}`}
                  className="font-semibold text-[var(--foreground)] no-underline hover:text-[var(--primary)]"
                >
                  {c.name}
                </Link>
                <div className="font-mono text-xs text-[var(--muted-foreground)]">/{c.slug}</div>
              </td>
              <td className="px-3 py-2.5 font-mono tabular-nums">{c.materials}</td>
              <td className="px-3 py-2.5 font-mono tabular-nums">{c.concepts}</td>
              <td className="px-3 py-2.5 font-mono tabular-nums whitespace-nowrap">
                {c.flashcards} / {c.practice_questions}
              </td>
              <td className="px-3 py-2.5 font-mono tabular-nums">{c.study_interactions}</td>
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
    localStorage.getItem(DEMO_STORAGE_KEY) === "1" ? { ...DEMO_ADMIN_ANALYTICS, generated_at: new Date().toISOString() } : null
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
    <div className="lms-container max-w-6xl space-y-10">
      <PageHeader
        title="Analytics"
        description="Product and learner signals to prioritize what to build next. Read-only, best-effort telemetry."
        actions={
          <div className="flex flex-wrap items-center gap-3">
            <label
              data-no-ux-track
              className="flex cursor-pointer items-center gap-2 text-sm text-[var(--muted-foreground)] select-none"
            >
              <input
                type="checkbox"
                checked={demoMode}
                onChange={(e) => {
                  const v = e.target.checked;
                  localStorage.setItem(DEMO_STORAGE_KEY, v ? "1" : "0");
                  setDemoMode(v);
                }}
                className="rounded border-[var(--border)]"
              />
              Demo data
            </label>
            <button
              type="button"
              className="btn-secondary inline-flex items-center gap-2"
              onClick={refresh}
              disabled={loading && !demoMode}
              data-analytics="admin-refresh"
            >
              <RefreshCw className={cn("h-4 w-4", loading && !demoMode && "animate-spin")} aria-hidden />
              Refresh
            </button>
          </div>
        }
      />

      {loading && !data ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-24 animate-pulse rounded-xl border border-[var(--border)] bg-[var(--muted)]/40" />
          ))}
        </div>
      ) : null}

      {error ? (
        <div className="lms-card border-[var(--destructive)]/40 bg-[var(--destructive)]/5">
          <strong className="text-[var(--foreground)]">Could not load analytics</strong>
          <p className="mt-1 text-sm text-[var(--muted-foreground)]">{error}</p>
        </div>
      ) : null}

      {data ? (
        <>
          {demoMode ? (
            <div className="flex gap-3 rounded-xl border border-[var(--primary)]/35 bg-[var(--accent)]/50 px-4 py-3 text-sm">
              <Sparkles className="mt-0.5 h-5 w-5 shrink-0 text-[var(--primary)]" aria-hidden />
              <div>
                <strong className="text-[var(--foreground)]">Demonstration mode</strong>
                <p className="mt-1 leading-relaxed text-[var(--muted-foreground)]">
                  Metrics and heatmap use curated sample data. Turn off the toggle to load live telemetry from the API.
                </p>
              </div>
            </div>
          ) : null}

          <p className="text-xs text-[var(--muted-foreground)]">Snapshot: {data.generated_at}</p>

          <Section title="Application health" description="Content and indexing footprint across the workspace.">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <StatCard label="Courses" value={data.counts.courses} icon={BookOpen} />
              <StatCard
                label="Materials"
                value={data.counts.materials}
                hint={`${data.counts.text_chunks} chunks indexed`}
              />
              <StatCard label="Concepts" value={data.counts.concepts} icon={BarChart3} />
              <StatCard
                label="Study items"
                value={data.counts.flashcards + data.counts.practice_questions}
                hint="Flashcards + questions"
              />
            </div>
          </Section>

          <Section title="Learner behavior" description="Engagement and accuracy signals from study interactions.">
            <div className="grid gap-4 sm:grid-cols-3">
              <StatCard
                label="Study attempts"
                value={data.study.interactions_total}
                hint={`${data.study.interactions_last_7d} in last 7d`}
              />
              <StatCard label="Accuracy" value={accLabel} hint={`${data.study.correct_total} correct`} />
              <StatCard label="Distinct users" value={data.study.distinct_users} icon={Users} hint="By interaction user_id" />
            </div>
          </Section>

          <AnalyticsVisualSection data={data} />

          <Section title="Suggested actions" description="Heuristic insights based on current usage.">
            <div className="space-y-3">
              {data.insights.map((i, idx) => (
                <InsightCard key={`${idx}-${i.title}`} title={i.title} detail={i.detail} tone={i.tone} />
              ))}
            </div>
          </Section>

          <div className="lms-card space-y-4">
            <h3 className="m-0 text-base font-bold text-[var(--foreground)]">Study volume (30d)</h3>
            <DailyActivitySparkline rows={data.daily_activity} />
            <ActivityChart rows={data.daily_activity} />
          </div>

          <Section title="Product UX" description="Where learners click and how often.">
            <UxHeatmapPanel ux={data.ux} />
          </Section>

          <Section title="Users (top by attempts)" description="Identify power users and cohorts.">
            <div className="lms-card overflow-hidden p-0">
              {data.users.length === 0 ? (
                <p className="p-4 text-sm text-[var(--muted-foreground)]">No user buckets yet.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse text-sm">
                    <thead>
                      <tr className="border-b border-[var(--border)] bg-[var(--muted)]/50 text-left text-xs font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">
                        <th className="px-3 py-2.5">user_id</th>
                        <th className="px-3 py-2.5">Attempts</th>
                        <th className="px-3 py-2.5">Correct</th>
                        <th className="px-3 py-2.5">Accuracy</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.users.map((u) => (
                        <tr key={u.user_id} className="border-b border-[var(--border)] last:border-0">
                          <td className="px-3 py-2.5 font-mono text-xs">{u.user_id}</td>
                          <td className="px-3 py-2.5 font-mono tabular-nums">{u.total}</td>
                          <td className="px-3 py-2.5 font-mono tabular-nums">{u.correct}</td>
                          <td className="px-3 py-2.5 font-mono tabular-nums">{pct(u.correct, u.total)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </Section>

          <Section title="Courses (recent)" description="Rollups per course for content and study activity.">
            <CourseTable courses={data.courses} />
          </Section>
        </>
      ) : null}
    </div>
  );
}
