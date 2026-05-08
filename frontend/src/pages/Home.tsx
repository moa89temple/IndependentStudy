import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowRight,
  BookOpen,
  FolderOpen,
  Plus,
  Sparkles,
  Upload,
} from "lucide-react";
import { api, type Course } from "../api";
import { PageHeader } from "@/components/lms/PageHeader";
import { StatCard } from "@/components/lms/StatCard";
import { EmptyState } from "@/components/lms/EmptyState";
import { cn } from "@/lib/utils";

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
    <div className="lms-container space-y-10">
      <div className="relative overflow-hidden rounded-2xl border border-[var(--border)] bg-gradient-to-br from-[var(--card)] via-[var(--card)] to-[var(--accent)]/30 p-6 shadow-[var(--shadow-md)] sm:p-8">
        <div className="relative z-10 max-w-2xl space-y-3">
          <p className="inline-flex items-center gap-1.5 rounded-full border border-[var(--border)] bg-[var(--card)]/80 px-3 py-1 text-xs font-semibold text-[var(--primary)]">
            <Sparkles className="h-3.5 w-3.5" aria-hidden />
            AI-powered study
          </p>
          <h1 className="text-2xl font-extrabold tracking-tight text-[var(--foreground)] sm:text-3xl">
            Turn your course materials into concepts, flashcards, and practice
          </h1>
          <p className="text-sm leading-relaxed text-[var(--muted-foreground)] sm:text-base">
            Create a course, upload your PDFs, notes, or slides, then run Process. Lizard organizes the key ideas into study material you can use right away.
          </p>
        </div>
        <div
          className="pointer-events-none absolute -right-8 -top-8 h-40 w-40 rounded-full bg-[var(--primary)]/10 blur-3xl"
          aria-hidden
        />
      </div>

      <PageHeader
        title="Dashboard"
        description="Organize courses, manage uploads, and jump into study mode from one place."
      />

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-28 animate-pulse rounded-xl border border-[var(--border)] bg-[var(--muted)]/50"
            />
          ))}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <StatCard
            label="Active courses"
            value={courses.length}
            icon={BookOpen}
            hint="Each course holds materials and generated study content."
          />
          <StatCard
            label="Workflow"
            value="3 steps"
            icon={FolderOpen}
            hint="Create -> Upload and process -> Study"
          />
          <StatCard
            label="Supported files"
            value="PDF -> TXT -> PPTX"
            icon={Upload}
            hint="Larger files may take a few minutes to process."
          />
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="lms-card lms-card-elevated space-y-4">
          <h2 className="text-base font-bold text-[var(--foreground)]">Create a new course</h2>
          <p className="text-sm text-[var(--muted-foreground)]">
            Name your course and start adding materials right away.
          </p>
          <form onSubmit={createCourse} className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <label className="flex-1 space-y-1.5">
              <span className="text-xs font-semibold text-[var(--muted-foreground)]">Course name</span>
              <input
                type="text"
                placeholder="e.g. Organic Chemistry II"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                className="w-full"
              />
            </label>
            <button
              type="submit"
              disabled={creating || !newName.trim()}
              data-analytics="home-create-course"
              className="btn-primary inline-flex items-center justify-center gap-2 whitespace-nowrap"
            >
              <Plus className="h-4 w-4" aria-hidden />
              {creating ? "Creating..." : "Create course"}
            </button>
          </form>
        </div>

        <div className="lms-card space-y-3 border-dashed">
          <h2 className="text-base font-bold text-[var(--foreground)]">Quick tips</h2>
          <ul className="space-y-2.5 text-sm text-[var(--muted-foreground)]">
            <li className="flex gap-2">
              <span className="mt-0.5 font-mono text-xs text-[var(--primary)]">1.</span>
              After upload, use <strong className="text-[var(--foreground)]">Process</strong> to generate
              concepts and study items (requires API keys on the server).
            </li>
            <li className="flex gap-2">
              <span className="mt-0.5 font-mono text-xs text-[var(--primary)]">2.</span>
              Open <strong className="text-[var(--foreground)]">Study</strong> for flashcards and
              self-check questions tied to your materials.
            </li>
            <li className="flex gap-2">
              <span className="mt-0.5 font-mono text-xs text-[var(--primary)]">3.</span>
              Re-run Process when you add more files or want to refresh content.
            </li>
          </ul>
        </div>
      </div>

      <section className="space-y-4">
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-lg font-bold tracking-tight text-[var(--foreground)]">Your courses</h2>
          {!loading && courses.length > 0 ? (
            <span className="text-sm text-[var(--muted-foreground)]">{courses.length} total</span>
          ) : null}
        </div>

        {loading ? (
          <p className="text-sm text-[var(--muted-foreground)]">Loading courses...</p>
        ) : courses.length === 0 ? (
          <EmptyState
            icon={BookOpen}
            title="No courses yet"
            description="Create your first course above, then upload readings or lecture decks to generate study tools."
          />
        ) : (
          <ul className="grid gap-4 sm:grid-cols-2">
            {courses.map((c) => (
              <li key={c.id}>
                <div
                  className={cn(
                    "flex flex-col rounded-xl border border-[var(--border)] bg-[var(--card)] p-5 shadow-[var(--shadow-sm)] transition",
                    "hover:border-[var(--primary)]/35 hover:shadow-[var(--shadow-md)]"
                  )}
                >
                  <Link
                    to={`/courses/${c.id}`}
                    data-analytics="home-open-course"
                    className="group flex items-start justify-between gap-3 no-underline"
                  >
                    <div className="min-w-0 space-y-1">
                      <p className="truncate font-semibold text-[var(--foreground)] group-hover:text-[var(--primary)]">
                        {c.name}
                      </p>
                      <p className="font-mono text-xs text-[var(--muted-foreground)]">/{c.slug}</p>
                    </div>
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[var(--muted)] text-[var(--primary)] transition group-hover:bg-[var(--primary)]/15">
                      <ArrowRight className="h-4 w-4" aria-hidden />
                    </span>
                  </Link>
                  <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-[var(--border)] pt-4">
                    <Link
                      to={`/courses/${c.id}/study`}
                      className="btn-secondary inline-flex items-center gap-1.5 px-3 py-2 text-xs no-underline"
                      data-analytics="home-study-shortcut"
                    >
                      Study
                    </Link>
                    <span className="text-xs text-[var(--muted-foreground)]">
                      Course workspace for uploads & processing
                    </span>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
