# Lizard MVP — Plan

## Vision (from Deliverable 1)
- **Lizard** = AI-agentic study platform; students study from course materials without passive methods.
- Upload: slides, readings, assignments, videos, diagrams.
- System: convert materials → structured, course-specific learning environment.
- Concepts: extract only when supported by evidence; map each concept back to source.
- Study materials: explanations, flashcards, practice questions — scoped context, less hallucination, instructor terminology.
- Track student interaction for review/reinforcement and exam prep.

---

## MVP Scope

| Area | In scope | Out of scope (later) |
|------|----------|----------------------|
| Upload | PDF, TXT, PPTX | Video/audio transcription, images as first-class |
| Processing | Chunking, text extraction, source tagging | Full RAG retrieval at query time |
| Concepts | Extract concepts + evidence + source refs per chunk | Multi-doc dedup, ontology |
| Study gen | Flashcards, short explanations, practice Q&A (from concepts) | Full adaptive spaced repetition, multiple question types |
| Tracking | Per-user view/correct/incorrect on cards & questions | Full analytics, spaced repetition algorithm |
| Auth | Single-user or simple API key | Full auth, multi-tenant |

---

## Stack

- **Backend**: Python 3.11+, FastAPI
- **DB**: SQLite (MVP), SQLAlchemy 2
- **Parsing**: PyMuPDF (PDF), python-pptx (PPTX), built-in (TXT)
- **AI**: OpenAI-compatible API (e.g. OpenAI) for extraction + generation; prompts scoped to course content
- **Frontend**: React + Vite, minimal UI: courses, upload, concepts, flashcards, practice questions, basic tracking
- **Infra**: Docker (backend + frontend dev), `.env.example`, `requirements.txt`, README with run instructions

---

## Data Model (high level)

- **Course**: name, slug, created_at
- **Material**: course_id, file path, type (pdf/txt/pptx), title, parsed text chunks with (content, page/slide, start/end)
- **Concept**: course_id, name, explanation, source_material_id, source_span (e.g. chunk id or page)
- **Flashcard**: concept_id, front, back
- **PracticeQuestion**: concept_id, question, expected_answer, source_ref
- **Interaction**: user_id (or session), target_type (flashcard/question), target_id, correct, at

---

## API Surface (MVP)

- `POST /courses` — create course
- `GET /courses` — list courses
- `POST /courses/{id}/materials` — upload file (PDF/TXT/PPTX)
- `POST /courses/{id}/process` — run extraction + concept + flashcard + question generation
- `GET /courses/{id}/concepts` — list concepts with sources
- `GET /courses/{id}/flashcards` — list flashcards (option: random/subset for session)
- `GET /courses/{id}/questions` — list practice questions
- `POST /interactions` — record view/correct/incorrect (flashcard or question)
- `GET /courses/{id}/review` — get items to review (e.g. wrong answers, or all)

---

## Implementation Order

1. Project layout, `requirements.txt`, `.env.example`, DB models, migrations (or create_all).
2. Upload endpoint + parsers (PDF, TXT, PPTX) → store raw text + chunks with source.
3. Concept extraction (LLM) with source mapping; store Concept + link to Material/Chunk.
4. Generate flashcards and practice questions from concepts (LLM, scoped prompts).
5. Interaction recording and simple “review” (e.g. filter by incorrect).
6. Frontend: course list, upload, process, view concepts, flashcards (flip), practice Q&A, record interactions.
7. Docker + README.

---

## File Layout

```
Independent Study/
├── MVP_PLAN.md
├── README.md
├── .env.example
├── docker-compose.yml
├── backend/
│   ├── requirements.txt
│   ├── Dockerfile
│   ├── .env.example -> ../.env.example
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py
│   │   ├── config.py
│   │   ├── database.py
│   │   ├── models/
│   │   ├── schemas/
│   │   ├── api/
│   │   ├── services/   # upload, parse, extract, generate
│   │   └── prompts/
│   └── uploads/        # stored files
├── frontend/
│   ├── package.json
│   ├── Dockerfile
│   ├── index.html
│   ├── vite.config.ts
│   └── src/
│       ├── App.tsx
│       ├── api.ts
│       ├── components/
│       └── pages/
└── ...
```

Implementing next: backend skeleton, DB, upload + parse, then extraction + generation, then API, then frontend, then Docker + README.
