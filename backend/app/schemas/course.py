from datetime import datetime
from pydantic import BaseModel, Field


class CourseCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=256)


class CourseOut(BaseModel):
    id: int
    name: str
    slug: str
    created_at: datetime

    class Config:
        from_attributes = True


class TextChunkOut(BaseModel):
    id: int
    content: str
    page_or_slide: int | None
    chunk_index: int

    class Config:
        from_attributes = True


class MaterialOut(BaseModel):
    id: int
    course_id: int
    file_path: str
    file_type: str
    title: str
    created_at: datetime

    class Config:
        from_attributes = True


class MaterialWithChunksOut(MaterialOut):
    chunks: list[TextChunkOut] = []
