from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models import Course, Material
from app.schemas import MaterialOut
from app.services.upload import save_upload_and_chunk

router = APIRouter()


@router.post("/{course_id}/materials", response_model=MaterialOut)
async def upload_material(
    course_id: int,
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
):
    content = await file.read()
    if not content:
        raise HTTPException(400, "Empty file")
    try:
        material = await save_upload_and_chunk(db, course_id, file.filename or "file", content)
        await db.refresh(material)
        return material
    except ValueError as e:
        raise HTTPException(400, str(e))
