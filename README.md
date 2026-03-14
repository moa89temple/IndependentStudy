# Lizard — Skip the Library

MVP of an AI-agentic study platform: upload course materials (PDF, TXT, PPTX), extract evidence-backed concepts, and study with generated flashcards and practice questions. Student interactions are recorded for review.

## Stack

- **Backend**: Python 3.11+, FastAPI, SQLAlchemy 2 (SQLite), PyMuPDF, python-pptx, OpenAI API, **Redis** (RAG)
- **Frontend**: React 18, TypeScript, Vite
- **Infra**: Docker Compose (backend + frontend)

## Quick start (local, no Docker)

### Backend

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate   # Windows
# source .venv/bin/activate   # macOS/Linux
pip install -r requirements.txt
cp ../.env.example .env
# Edit .env: OPENAI_API_KEY, and REDIS_URL for RAG (default redis://localhost:6379/0)
# Start Redis locally (e.g. docker run -p 6379:6379 redis) then:
uvicorn app.main:app --reload --port 8000
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

- Frontend: http://localhost:5173  
- API: http://localhost:8000  
- Vite proxies `/api` and `/health` to the backend.

### Using the app

1. Create a **course** (e.g. "MIS 3582").
2. **Upload** one or more PDF, TXT, or PPTX files.
3. Click **Process** to extract concepts and generate flashcards and practice questions (requires `OPENAI_API_KEY`).
4. Open **Study** to practice with flashcards and questions; rate correct/incorrect to record interactions.

## Run with Docker

```bash
# From repo root. Set OPENAI_API_KEY in .env for processing.
cp .env.example .env
docker compose up --build
```

- App: http://localhost:3000 (frontend proxies to backend).
- Backend only: http://localhost:8000.

## RAG and Redis

Processing uses a **RAG (retrieval-augmented generation)** pipeline when Redis is available:

1. **Extract text** from uploaded files (PDF, TXT, PPTX) and split into chunks (already in the DB).
2. **Embed** chunk text with OpenAI `text-embedding-3-small` and **store in Redis** (key `lizard:chunk:{id}`, set `lizard:course_chunks:{course_id}`).
3. **Retrieve** the top‑k chunks most similar to a query like “key concepts and definitions” (cosine similarity in Python).
4. **Generate** concepts, flashcards, and practice questions from the retrieved passages in one or few LLM calls.

Processing **requires Redis**. Install and run Redis (e.g. `docker run -p 6379:6379 redis`) and set `REDIS_URL` in `.env`.

## Environment

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | SQLite: `sqlite+aiosqlite:///./lizard.db` (or `./data/lizard.db` in Docker) |
| `OPENAI_API_KEY` | Required for Process (concept extraction and study generation). |
| `REDIS_URL` | Redis connection URL for RAG (default `redis://localhost:6379/0`). Required for Process. |
| `UPLOAD_DIR` | Directory for uploaded files (default `./uploads`). |
| `CORS_ORIGINS` | Comma-separated origins for CORS. |

## API (MVP)

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/courses` | Create course (`{ "name": "..." }`) |
| GET | `/api/courses` | List courses |
| POST | `/api/courses/{id}/materials` | Upload file (multipart `file`) |
| POST | `/api/courses/{id}/process` | Extract concepts and generate flashcards + questions |
| GET | `/api/courses/{id}/concepts` | List concepts |
| GET | `/api/courses/{id}/flashcards` | List flashcards |
| GET | `/api/courses/{id}/questions` | List practice questions |
| GET | `/api/courses/{id}/review` | Flashcards + questions for study |
| POST | `/api/interactions` | Record interaction (`target_type`, `target_id`, `correct`) |

## Plan

See [MVP_PLAN.md](MVP_PLAN.md) for scope, data model, and implementation notes.
