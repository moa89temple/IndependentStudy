from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_db
from app.models import Course, Concept, Flashcard, PracticeQuestion
from app.schemas import ConceptOut, FlashcardOut, PracticeQuestionOut
from app.services.extract import run_extraction

router = APIRouter()


@router.post("/{course_id}/process")
async def process_course(course_id: int, db: AsyncSession = Depends(get_db)):
    r = await db.execute(select(Course).where(Course.id == course_id))
    if r.scalar_one_or_none() is None:
        raise HTTPException(404, "Course not found")
    try:
        await run_extraction(db, course_id)
        return {"status": "ok", "message": "Extraction and study materials generated."}
    except ValueError as e:
        raise HTTPException(400, str(e))


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
    return {
        "flashcards": [FlashcardOut.model_validate(x) for x in fc.scalars().all()],
        "questions": [PracticeQuestionOut.model_validate(x) for x in q.scalars().all()],
    }
