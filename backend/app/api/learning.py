import asyncio
from datetime import datetime, timezone
from uuid import uuid4

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import AsyncSessionLocal, get_db
from app.models import Course, Concept, Flashcard, PracticeQuestion, ShortVideo
from app.schemas import ConceptOut, FlashcardOut, PracticeQuestionOut, ShortVideoOut
from app.services.extract import run_extraction

router = APIRouter()

ProcessStatus = str
PROCESS_JOBS: dict[str, dict] = {}
COURSE_ACTIVE_JOB: dict[int, str] = {}
COURSE_JOB_HISTORY: dict[int, list[str]] = {}


def _now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def _public_job(job: dict) -> dict:
    return {
        "job_id": job["job_id"],
        "course_id": job["course_id"],
        "status": job["status"],
        "error": job.get("error"),
        "created_at": job["created_at"],
        "started_at": job.get("started_at"),
        "completed_at": job.get("completed_at"),
    }


async def _run_process_job(job_id: str, course_id: int) -> None:
    job = PROCESS_JOBS[job_id]
    job["status"] = "processing"
    job["started_at"] = _now_iso()
    try:
        async with AsyncSessionLocal() as session:
            await run_extraction(session, course_id)
            await session.commit()
        job["status"] = "completed"
    except ValueError as e:
        job["status"] = "failed"
        job["error"] = str(e)
    except Exception as e:
        job["status"] = "failed"
        job["error"] = f"Unexpected processing failure: {e!s}"
    finally:
        job["completed_at"] = _now_iso()
        if COURSE_ACTIVE_JOB.get(course_id) == job_id:
            del COURSE_ACTIVE_JOB[course_id]


@router.post("/{course_id}/process")
async def process_course(course_id: int, db: AsyncSession = Depends(get_db)):
    r = await db.execute(select(Course).where(Course.id == course_id))
    if r.scalar_one_or_none() is None:
        raise HTTPException(404, "Course not found")

    active_job_id = COURSE_ACTIVE_JOB.get(course_id)
    if active_job_id:
        active = PROCESS_JOBS.get(active_job_id)
        if active and active["status"] in {"queued", "processing"}:
            return _public_job(active)

    job_id = uuid4().hex
    job = {
        "job_id": job_id,
        "course_id": course_id,
        "status": "queued",
        "error": None,
        "created_at": _now_iso(),
        "started_at": None,
        "completed_at": None,
    }
    PROCESS_JOBS[job_id] = job
    COURSE_ACTIVE_JOB[course_id] = job_id
    COURSE_JOB_HISTORY.setdefault(course_id, []).append(job_id)

    asyncio.create_task(_run_process_job(job_id, course_id))
    return _public_job(job)


@router.get("/{course_id}/process/latest")
async def get_latest_process_job(course_id: int, db: AsyncSession = Depends(get_db)):
    r = await db.execute(select(Course).where(Course.id == course_id))
    if r.scalar_one_or_none() is None:
        raise HTTPException(404, "Course not found")

    history = COURSE_JOB_HISTORY.get(course_id, [])
    if not history:
        return None
    latest = PROCESS_JOBS.get(history[-1])
    return _public_job(latest) if latest else None


@router.get("/{course_id}/process/jobs/{job_id}")
async def get_process_job(course_id: int, job_id: str, db: AsyncSession = Depends(get_db)):
    r = await db.execute(select(Course).where(Course.id == course_id))
    if r.scalar_one_or_none() is None:
        raise HTTPException(404, "Course not found")
    job = PROCESS_JOBS.get(job_id)
    if not job or job["course_id"] != course_id:
        raise HTTPException(404, "Process job not found")
    return _public_job(job)


@router.get("/{course_id}/concepts", response_model=list[ConceptOut])
async def list_concepts(course_id: int, db: AsyncSession = Depends(get_db)):
    r = await db.execute(
        select(Concept).where(Concept.course_id == course_id).order_by(Concept.id)
    )
    return list(r.scalars().all())


@router.get("/{course_id}/flashcards", response_model=list[FlashcardOut])
async def list_flashcards(course_id: int, db: AsyncSession = Depends(get_db)):
    r = await db.execute(
        select(Flashcard)
        .join(Concept)
        .where(Concept.course_id == course_id)
        .order_by(Flashcard.id)
    )
    return list(r.scalars().all())


@router.get("/{course_id}/questions", response_model=list[PracticeQuestionOut])
async def list_questions(course_id: int, db: AsyncSession = Depends(get_db)):
    r = await db.execute(
        select(PracticeQuestion)
        .join(Concept)
        .where(Concept.course_id == course_id)
        .order_by(PracticeQuestion.id)
    )
    return list(r.scalars().all())


@router.get("/{course_id}/shorts", response_model=list[ShortVideoOut])
async def list_shorts(course_id: int, db: AsyncSession = Depends(get_db)):
    r = await db.execute(
        select(ShortVideo)
        .where(ShortVideo.course_id == course_id)
        .order_by(ShortVideo.id)
    )
    return list(r.scalars().all())


@router.get("/{course_id}/review")
async def get_review_items(course_id: int, db: AsyncSession = Depends(get_db)):
    """Return flashcards and questions; optionally filter to previously incorrect (user_id could be query param)."""
    fc = await db.execute(
        select(Flashcard)
        .join(Concept)
        .where(Concept.course_id == course_id)
        .order_by(Flashcard.id)
    )
    q = await db.execute(
        select(PracticeQuestion)
        .join(Concept)
        .where(Concept.course_id == course_id)
        .order_by(PracticeQuestion.id)
    )
    s = await db.execute(
        select(ShortVideo)
        .where(ShortVideo.course_id == course_id)
        .order_by(ShortVideo.id)
    )
    return {
        "flashcards": [FlashcardOut.model_validate(x) for x in fc.scalars().all()],
        "questions": [PracticeQuestionOut.model_validate(x) for x in q.scalars().all()],
        "shorts": [ShortVideoOut.model_validate(x) for x in s.scalars().all()],
    }
