import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  BookOpen,
  Check,
  ChevronLeft,
  HelpCircle,
  Keyboard,
  Layers,
  Loader2,
  X,
} from "lucide-react";
import { api, type Flashcard, type PracticeQuestion, type ReviewData } from "../api";
import { PageHeader } from "@/components/lms/PageHeader";
import { EmptyState } from "@/components/lms/EmptyState";
import { cn } from "@/lib/utils";

export default function Study() {
  const { courseId } = useParams<{ courseId: string }>();
  const id = Number(courseId);
  const [data, setData] = useState<ReviewData | null>(null);
  const [loading, setLoading] = useState(true);
  const [fcIndex, setFcIndex] = useState(0);
  const [showBack, setShowBack] = useState(false);
  const [qIndex, setQIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [tab, setTab] = useState<"flashcards" | "questions">("flashcards");

  useEffect(() => {
    if (!id || isNaN(id)) return;
    api.learning.review(id).then(setData).finally(() => setLoading(false));
  }, [id]);

  const recordFlashcard = (correct: boolean) => {
    const fc = data?.flashcards[fcIndex];
    if (fc) api.interactions.record({ target_type: "flashcard", target_id: fc.id, correct });
  };

  const recordQuestion = (correct: boolean) => {
    const q = data?.questions[qIndex];
    if (q) api.interactions.record({ target_type: "question", target_id: q.id, correct });
  };

  if (loading || !data) {
    return (
      <div className="lms-container flex min-h-[50vh] flex-col items-center justify-center gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-[var(--primary)]" aria-hidden />
        <p className="text-sm text-[var(--muted-foreground)]">Loading study set…</p>
      </div>
    );
  }

  const flashcards = data.flashcards;
  const questions = data.questions;
  const hasFlashcards = flashcards.length > 0;
  const hasQuestions = questions.length > 0;

  return (
    <div className="lms-container space-y-8 pb-12">
      <PageHeader
        title="Study session"
        description="Review flashcards and practice questions generated from your course materials."
        breadcrumbs={[
          { label: "Dashboard", to: "/" },
          { label: "Course", to: `/courses/${id}` },
          { label: "Study" },
        ]}
        actions={
          <Link
            to={`/courses/${id}`}
            className="btn-secondary inline-flex items-center gap-2 no-underline"
            data-analytics="study-back-course"
          >
            <ChevronLeft className="h-4 w-4" aria-hidden />
            Course
          </Link>
        }
      />

      {!hasFlashcards && !hasQuestions ? (
        <EmptyState
          icon={BookOpen}
          title="Nothing to study yet"
          description="Upload materials on the course page and run Process to generate flashcards and questions."
          action={
            <Link to={`/courses/${id}`} className="btn-primary no-underline">
              Go to course
            </Link>
          }
        />
      ) : (
        <>
          <div
            className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"
            role="tablist"
            aria-label="Study mode"
          >
            <div className="inline-flex rounded-xl border border-[var(--border)] bg-[var(--card)] p-1 shadow-sm">
              <button
                type="button"
                role="tab"
                aria-selected={tab === "flashcards"}
                disabled={!hasFlashcards}
                onClick={() => {
                  setTab("flashcards");
                  setShowBack(false);
                }}
                data-analytics="study-tab-flashcards"
                className={cn(
                  "inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition",
                  tab === "flashcards"
                    ? "bg-[var(--primary)] text-[var(--primary-foreground)] shadow-sm"
                    : "text-[var(--muted-foreground)] hover:bg-[var(--muted)]",
                  !hasFlashcards && "cursor-not-allowed opacity-40"
                )}
              >
                <Layers className="h-4 w-4" aria-hidden />
                Flashcards
                <span className="rounded-full bg-black/10 px-2 py-0.5 text-xs font-mono tabular-nums dark:bg-white/15">
                  {flashcards.length}
                </span>
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={tab === "questions"}
                disabled={!hasQuestions}
                onClick={() => {
                  setTab("questions");
                  setShowAnswer(false);
                }}
                data-analytics="study-tab-questions"
                className={cn(
                  "inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition",
                  tab === "questions"
                    ? "bg-[var(--primary)] text-[var(--primary-foreground)] shadow-sm"
                    : "text-[var(--muted-foreground)] hover:bg-[var(--muted)]",
                  !hasQuestions && "cursor-not-allowed opacity-40"
                )}
              >
                <HelpCircle className="h-4 w-4" aria-hidden />
                Questions
                <span className="rounded-full bg-black/10 px-2 py-0.5 text-xs font-mono tabular-nums dark:bg-white/15">
                  {questions.length}
                </span>
              </button>
            </div>
            <p className="flex items-center gap-2 text-xs text-[var(--muted-foreground)]">
              <Keyboard className="h-3.5 w-3.5 shrink-0" aria-hidden />
              Tip: Space flips cards when focused · Enter submits ratings after reveal
            </p>
          </div>

          {tab === "flashcards" && hasFlashcards && (
            <FlashcardView
              flashcards={flashcards}
              index={fcIndex}
              setIndex={setFcIndex}
              showBack={showBack}
              setShowBack={setShowBack}
              onRate={recordFlashcard}
            />
          )}

          {tab === "questions" && hasQuestions && (
            <QuestionsView
              questions={questions}
              index={qIndex}
              setIndex={setQIndex}
              showAnswer={showAnswer}
              setShowAnswer={setShowAnswer}
              onRate={recordQuestion}
            />
          )}
        </>
      )}
    </div>
  );
}

function FlashcardView({
  flashcards,
  index,
  setIndex,
  showBack,
  setShowBack,
  onRate,
}: {
  flashcards: Flashcard[];
  index: number;
  setIndex: (n: number) => void;
  showBack: boolean;
  setShowBack: (b: boolean) => void;
  onRate: (correct: boolean) => void;
}) {
  const fc = flashcards[index];
  const total = flashcards.length;

  const next = () => {
    setShowBack(false);
    setIndex((index + 1) % flashcards.length);
  };

  const flip = () => setShowBack(!showBack);
  const progressPct = total ? Math.round(((index + 1) / total) * 100) : 0;

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="space-y-2">
        <div className="flex justify-between text-xs font-medium text-[var(--muted-foreground)]">
          <span>
            Card {index + 1} / {total}
          </span>
          <span>{progressPct}% through deck</span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-[var(--muted)]">
          <div
            className="h-full rounded-full bg-[var(--primary)] transition-all duration-300"
            style={{ width: `${progressPct}%` }}
          />
        </div>
      </div>

      <div className="lms-card lms-card-elevated overflow-hidden p-0">
        <div
          data-flashcard="true"
          role="button"
          tabIndex={0}
          data-analytics="study-flip-card"
          onClick={flip}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              flip();
            }
          }}
          className="flashcard min-h-[200px] rounded-none border-0"
        >
          {!showBack ? (
            <div className="px-4 text-lg font-medium leading-snug text-[var(--foreground)]">{fc.front}</div>
          ) : (
            <div className="back px-4 text-[var(--foreground)]">{fc.back}</div>
          )}
        </div>
      </div>

      <p className="text-center text-xs text-[var(--muted-foreground)]">Click the card or press Space to flip</p>

      {showBack && (
        <div className="flex flex-wrap justify-center gap-3">
          <button
            type="button"
            data-analytics="study-flashcard-incorrect"
            className="btn-danger inline-flex min-w-[8rem] items-center justify-center gap-2"
            onClick={() => {
              onRate(false);
              next();
            }}
          >
            <X className="h-4 w-4" aria-hidden />
            Again
          </button>
          <button
            type="button"
            data-analytics="study-flashcard-correct"
            className="btn-success inline-flex min-w-[8rem] items-center justify-center gap-2"
            onClick={() => {
              onRate(true);
              next();
            }}
          >
            <Check className="h-4 w-4" aria-hidden />
            Got it
          </button>
        </div>
      )}
    </div>
  );
}

function QuestionsView({
  questions,
  index,
  setIndex,
  showAnswer,
  setShowAnswer,
  onRate,
}: {
  questions: PracticeQuestion[];
  index: number;
  setIndex: (n: number) => void;
  showAnswer: boolean;
  setShowAnswer: (b: boolean) => void;
  onRate: (correct: boolean) => void;
}) {
  const q = questions[index];
  const total = questions.length;
  const pct = total ? Math.round(((index + (showAnswer ? 1 : 0)) / total) * 100) : 0;

  const next = () => {
    setShowAnswer(false);
    setIndex((index + 1) % questions.length);
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="space-y-2">
        <div className="flex justify-between text-xs font-medium text-[var(--muted-foreground)]">
          <span>
            Question {index + 1} / {total}
          </span>
          <span>{Math.min(100, pct)}% complete</span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-[var(--muted)]">
          <div
            className="h-full rounded-full bg-[var(--primary)] transition-all duration-300"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>

      <div className="lms-card lms-card-elevated space-y-6">
        <div className="question-block mb-0">
          <h3>Prompt</h3>
          <p className="m-0 text-base leading-relaxed text-[var(--foreground)]">{q.question}</p>
        </div>

        {!showAnswer ? (
          <button
            type="button"
            data-analytics="study-show-answer"
            className="btn-primary w-full sm:w-auto"
            onClick={() => setShowAnswer(true)}
          >
            Reveal suggested answer
          </button>
        ) : (
          <>
            <div className="question-block border-t border-[var(--border)] pt-6">
              <h3>Suggested answer</h3>
              <div className="answer m-0 border-l-[var(--primary)]">{q.expected_answer}</div>
            </div>
            <div className="flex flex-wrap gap-3 border-t border-[var(--border)] pt-6">
              <button
                type="button"
                data-analytics="study-question-incorrect"
                className="btn-danger inline-flex flex-1 items-center justify-center gap-2 sm:flex-none"
                onClick={() => {
                  onRate(false);
                  next();
                }}
              >
                <X className="h-4 w-4" aria-hidden />
                Needs work
              </button>
              <button
                type="button"
                data-analytics="study-question-correct"
                className="btn-success inline-flex flex-1 items-center justify-center gap-2 sm:flex-none"
                onClick={() => {
                  onRate(true);
                  next();
                }}
              >
                <Check className="h-4 w-4" aria-hidden />
                Nailed it
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
