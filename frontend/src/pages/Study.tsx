import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { api, type Flashcard, type PracticeQuestion, type ReviewData } from "../api";

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
      <div className="container">
        <p style={{ color: "var(--muted)" }}>Loading…</p>
      </div>
    );
  }

  const flashcards = data.flashcards;
  const questions = data.questions;
  const hasFlashcards = flashcards.length > 0;
  const hasQuestions = questions.length > 0;

  return (
    <div className="container">
      <div className="page-header">
        <h1>Study</h1>
        <Link to={`/courses/${id}`}>
          <button className="secondary">Back to course</button>
        </Link>
      </div>

      {!hasFlashcards && !hasQuestions ? (
        <div className="card">
          <p style={{ margin: 0, color: "var(--muted)" }}>
            No study materials yet. Upload materials and run Process on the course page.
          </p>
        </div>
      ) : (
        <>
          <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1rem" }}>
            <button
              className={tab === "flashcards" ? "" : "secondary"}
              onClick={() => setTab("flashcards")}
              disabled={!hasFlashcards}
            >
              Flashcards ({flashcards.length})
            </button>
            <button
              className={tab === "questions" ? "" : "secondary"}
              onClick={() => setTab("questions")}
              disabled={!hasQuestions}
            >
              Practice questions ({questions.length})
            </button>
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
  const next = () => {
    setShowBack(false);
    setIndex((index + 1) % flashcards.length);
  };
  const flip = () => setShowBack((b) => !b);

  return (
    <div className="card">
      <p style={{ color: "var(--muted)", margin: "0 0 0.5rem", fontSize: "0.85rem" }}>
        Card {index + 1} of {flashcards.length}
      </p>
      <div className="flashcard" onClick={flip}>
        {!showBack ? <div>{fc.front}</div> : <div className="back">{fc.back}</div>}
      </div>
      <p style={{ fontSize: "0.85rem", color: "var(--muted)", margin: "0.5rem 0 0" }}>
        Click card to flip
      </p>
      {showBack && (
        <div style={{ display: "flex", gap: "0.5rem", marginTop: "1rem" }}>
          <button
            onClick={() => {
              onRate(false);
              next();
            }}
            style={{ background: "var(--wrong)" }}
          >
            Incorrect
          </button>
          <button
            onClick={() => {
              onRate(true);
              next();
            }}
            style={{ background: "var(--right)" }}
          >
            Correct
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
  const next = () => {
    setShowAnswer(false);
    setIndex((index + 1) % questions.length);
  };

  return (
    <div className="card">
      <p style={{ color: "var(--muted)", margin: "0 0 0.5rem", fontSize: "0.85rem" }}>
        Question {index + 1} of {questions.length}
      </p>
      <div className="question-block">
        <h3>Question</h3>
        <p style={{ margin: 0 }}>{q.question}</p>
      </div>
      {!showAnswer ? (
        <button onClick={() => setShowAnswer(true)}>Show answer</button>
      ) : (
        <>
          <div className="question-block">
            <h3>Expected answer</h3>
            <div className="answer">{q.expected_answer}</div>
          </div>
          <div style={{ display: "flex", gap: "0.5rem", marginTop: "1rem" }}>
            <button
              onClick={() => {
                onRate(false);
                next();
              }}
              style={{ background: "var(--wrong)" }}
            >
              Incorrect
            </button>
            <button
              onClick={() => {
                onRate(true);
                next();
              }}
              style={{ background: "var(--right)" }}
            >
              Correct
            </button>
          </div>
        </>
      )}
    </div>
  );
}
