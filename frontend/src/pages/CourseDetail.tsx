import { useEffect, useState } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import {
  AlertTriangle,
  BookMarked,
  GraduationCap,
  Loader2,
  Trash2,
  Upload,
  Wand2,
} from "lucide-react";
import { api, type Course, type Concept, type ProcessJob, type ShortVideo } from "../api";
import { PageHeader } from "@/components/lms/PageHeader";
import { Section } from "@/components/lms/Section";
import { EmptyState } from "@/components/lms/EmptyState";
import { cn } from "@/lib/utils";

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
  const [processJob, setProcessJob] = useState<ProcessJob | null>(null);
  const [shorts, setShorts] = useState<ShortVideo[]>([]);
  const [file, setFile] = useState<File | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (!id || isNaN(id)) return;
    Promise.all([
      api.courses.list().then((list) => list.find((c) => c.id === id) ?? null),
      api.learning.concepts(id).catch(() => []),
      api.learning.shorts(id).catch(() => []),
      api.learning.processLatest(id).catch(() => null),
    ]).then(([c, conceptList, shortsList, latestJob]) => {
      setCourse(c ?? null);
      setConcepts(conceptList);
      setShorts(shortsList);
      setProcessJob(latestJob);
      setProcessing(!!latestJob && ["queued", "processing"].includes(latestJob.status));
    }).finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    if (!id || !processJob) return;
    if (!["queued", "processing"].includes(processJob.status)) return;
    const timer = setInterval(async () => {
      try {
        const [job, conceptList, shortsList] = await Promise.all([
          api.learning.processJob(id, processJob.job_id),
          api.learning.concepts(id).catch(() => concepts),
          api.learning.shorts(id).catch(() => shorts),
        ]);
        setProcessJob(job);
        setConcepts(conceptList);
        setShorts(shortsList);
        if (!["queued", "processing"].includes(job.status)) {
          setProcessing(false);
          if (job.status === "failed" && job.error) {
            alert(job.error);
          }
        }
      } catch {
        // Keep polling; transient errors should not kill process tracking.
      }
    }, 2500);
    return () => clearInterval(timer);
  }, [id, processJob]);

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
      const job = await api.learning.process(id);
      setProcessJob(job);
      setProcessing(["queued", "processing"].includes(job.status));
    } catch (err) {
      alert((err as Error).message);
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

  if (loading && !course) {
    return (
      <div className="lms-container flex min-h-[40vh] items-center justify-center">
        <div className="flex items-center gap-2 text-sm text-[var(--muted-foreground)]">
          <Loader2 className="h-5 w-5 animate-spin text-[var(--primary)]" aria-hidden />
          Loading course…
        </div>
      </div>
    );
  }
  if (!course) {
    return (
      <div className="lms-container">
        <EmptyState
          title="Course not found"
          description="This course may have been deleted or the link is invalid."
          action={
            <Link to="/" className="btn-primary no-underline">
              Back to dashboard
            </Link>
          }
        />
      </div>
    );
  }

  const hasConcepts = concepts.length > 0;
  const shortsDone = shorts.filter((s) => s.status.toLowerCase() === "completed" && !!s.video_url).length;
  const shortsPending = shorts.filter((s) => ["queued", "processing"].includes(s.status.toLowerCase())).length;

  return (
    <div className="lms-container space-y-10">
      <PageHeader
        title={course.name}
        description="Upload materials, run AI processing, and review generated concepts before you study."
        breadcrumbs={[
          { label: "Dashboard", to: "/" },
          { label: course.name },
        ]}
        actions={
          <>
            <Link
              to={`/courses/${id}/study`}
              className="btn-primary inline-flex items-center gap-2 no-underline"
              data-analytics="course-study"
            >
              <GraduationCap className="h-4 w-4" aria-hidden />
              Open study
            </Link>
            <button
              type="button"
              className="btn-secondary inline-flex items-center gap-2 text-[var(--destructive)]"
              data-analytics="course-delete"
              onClick={deleteCourse}
              disabled={deleting}
            >
              <Trash2 className="h-4 w-4" aria-hidden />
              {deleting ? "Deleting…" : "Delete course"}
            </button>
          </>
        }
      />

      <ol className="grid gap-3 sm:grid-cols-3">
        {[
          { step: 1, title: "Upload", desc: "Add PDF, TXT, or PPTX files.", active: !hasConcepts },
          { step: 2, title: "Process", desc: "Extract concepts & study items.", active: !hasConcepts },
          {
            step: 3,
            title: "Study",
            desc: "Flashcards, questions, and shorts.",
            active: hasConcepts,
          },
        ].map((s) => (
          <li
            key={s.step}
            className={cn(
              "flex gap-3 rounded-xl border p-4 transition-colors",
              hasConcepts
                ? "border-[var(--primary)]/25 bg-[var(--accent)]/35"
                : s.active
                  ? "border-[var(--primary)]/45 bg-[var(--card)] ring-1 ring-[var(--primary)]/20"
                  : "border-[var(--border)] bg-[var(--card)]"
            )}
          >
            <span
              className={cn(
                "flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold",
                hasConcepts || s.active
                  ? "bg-[var(--primary)] text-[var(--primary-foreground)]"
                  : "bg-[var(--muted)] text-[var(--muted-foreground)]"
              )}
            >
              {hasConcepts ? "✓" : s.step}
            </span>
            <div>
              <p className="font-semibold text-[var(--foreground)]">{s.title}</p>
              <p className="text-xs text-[var(--muted-foreground)]">{s.desc}</p>
            </div>
          </li>
        ))}
      </ol>

      <div className="grid gap-6 lg:grid-cols-2">
        <Section
          title="Materials"
          description="Upload readings, slides, or notes. Supported: PDF, TXT, PPTX."
        >
          <div className="lms-card space-y-4">
            <form onSubmit={upload} className="space-y-3">
              <label className="block">
                <span className="mb-2 block text-xs font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">
                  Choose file
                </span>
                <input
                  type="file"
                  accept=".pdf,.txt,.pptx"
                  onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                  className="cursor-pointer text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-[var(--muted)] file:px-3 file:py-2 file:text-sm file:font-medium file:text-[var(--foreground)]"
                />
              </label>
              <button
                type="submit"
                disabled={!file || uploading}
                data-analytics="course-upload"
                className="btn-primary inline-flex w-full items-center justify-center gap-2 sm:w-auto"
              >
                {uploading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                    Uploading…
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4" aria-hidden />
                    Upload
                  </>
                )}
              </button>
            </form>
            {uploadSuccess ? (
              <div
                className="flex items-center gap-2 rounded-lg border border-[var(--success)]/40 bg-[var(--success)]/10 px-3 py-2 text-sm text-[var(--foreground)]"
                role="status"
              >
                <Upload className="h-4 w-4 text-[var(--success)]" aria-hidden />
                Uploaded: <span className="font-medium">{uploadSuccess}</span>
              </div>
            ) : null}
          </div>
        </Section>

        <Section
          title="AI processing"
          description="Batch extraction with RAG. Requires server-side OpenAI and Redis. Large files may take 1–2 minutes."
        >
          <div className="lms-card space-y-4">
            <div className="flex gap-2 rounded-lg border border-[var(--border)] bg-[var(--muted)]/30 p-3 text-sm text-[var(--muted-foreground)]">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" aria-hidden />
              <p className="m-0 leading-relaxed">
                Run Process after uploading. You can run again when you add more materials or need to refresh content.
              </p>
            </div>
            <button
              type="button"
              onClick={process}
              disabled={processing || processJob?.status === "queued" || processJob?.status === "processing"}
              data-analytics="course-process"
              className="btn-primary inline-flex w-full items-center justify-center gap-2"
            >
              {processing || processJob?.status === "queued" || processJob?.status === "processing" ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                  Processing in background…
                </>
              ) : (
                <>
                  <Wand2 className="h-4 w-4" aria-hidden />
                  Process course
                </>
              )}
            </button>
            {processJob ? (
              <p className="text-xs text-[var(--muted-foreground)]">
                Job status: <span className="font-semibold">{processJob.status}</span>
                {processJob.status === "failed" && processJob.error ? ` - ${processJob.error}` : ""}
              </p>
            ) : null}
            <p className="text-xs text-[var(--muted-foreground)]">
              Shorts progress: {shortsDone}/{shorts.length} completed
              {shortsPending > 0 ? ` · ${shortsPending} still processing` : ""}
            </p>
          </div>
        </Section>
      </div>

      <Section
        id="concepts"
        title={`Concepts (${concepts.length})`}
        description="Key ideas extracted from your materials. These power flashcards, practice questions, and shorts."
      >
        {loading ? (
          <p className="text-sm text-[var(--muted-foreground)]">Refreshing concepts…</p>
        ) : concepts.length === 0 ? (
          <EmptyState
            icon={BookMarked}
            title="No concepts yet"
            description="Upload at least one material, then run Process to populate this list."
          />
        ) : (
          <ul className="space-y-3">
            {concepts.map((c) => (
              <li key={c.id} className="lms-card">
                <div className="flex flex-wrap items-baseline gap-2">
                  <h3 className="text-base font-semibold text-[var(--foreground)]">{c.name}</h3>
                  {c.source_span ? (
                    <span className="rounded-md bg-[var(--muted)] px-2 py-0.5 font-mono text-xs text-[var(--muted-foreground)]">
                      {c.source_span}
                    </span>
                  ) : null}
                </div>
                <p className="mt-2 text-sm leading-relaxed text-[var(--muted-foreground)]">{c.explanation}</p>
              </li>
            ))}
          </ul>
        )}
      </Section>
    </div>
  );
}
