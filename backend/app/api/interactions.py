from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models import Interaction
from app.schemas import InteractionCreate, InteractionOut

router = APIRouter()


@router.post("/interactions", response_model=InteractionOut)
async def record_interaction(body: InteractionCreate, db: AsyncSession = Depends(get_db)):
    if body.target_type not in ("flashcard", "question"):
        body.target_type = "flashcard"
    interaction = Interaction(
        user_id=body.user_id,
        target_type=body.target_type,
        target_id=body.target_id,
        correct=body.correct,
    )
    db.add(interaction)
    await db.flush()
    await db.refresh(interaction)
    return interaction
