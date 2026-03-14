"""Save uploaded file and create Material + TextChunk records."""
from pathlib import Path
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.models import Course, Material, TextChunk
from app.services.parsers import parse_file

ALLOWED_EXTENSIONS = {"pdf", "txt", "pptx"}
EXT_TO_TYPE = {"pdf": "pdf", "txt": "txt", "pptx": "pptx"}


async def save_upload_and_chunk(
    session: AsyncSession,
    course_id: int,
    filename: str,
    content: bytes,
) -> Material:
    ext = Path(filename).suffix.lower().lstrip(".")
    if ext not in ALLOWED_EXTENSIONS:
        raise ValueError(f"Allowed types: {', '.join(ALLOWED_EXTENSIONS)}")
    file_type = EXT_TO_TYPE[ext]

    # Resolve course to ensure it exists
    result = await session.execute(select(Course).where(Course.id == course_id))
    course = result.scalar_one_or_none()
    if not course:
        raise ValueError("Course not found")

    upload_dir = Path(settings.upload_dir)
    upload_dir.mkdir(parents=True, exist_ok=True)
    # Store under course_id to avoid collisions
    safe_name = Path(filename).name
    dest = upload_dir / str(course_id) / safe_name
    dest.parent.mkdir(parents=True, exist_ok=True)
    dest.write_bytes(content)

    title = safe_name
    material = Material(
        course_id=course_id,
        file_path=str(dest),
        file_type=file_type,
        title=title,
    )
    session.add(material)
    await session.flush()

    chunks_data = parse_file(dest, file_type)
    for idx, (text, page_or_slide) in enumerate(chunks_data):
        chunk = TextChunk(
            material_id=material.id,
            content=text,
            page_or_slide=page_or_slide,
            chunk_index=idx,
        )
        session.add(chunk)
    await session.flush()
    return material
