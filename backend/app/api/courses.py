from fastapi import APIRouter, Depends, HTTPException, Response
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models import Course
from app.schemas import CourseCreate, CourseOut

router = APIRouter()


def slugify(name: str) -> str:
    import re
    s = re.sub(r"[^\w\s-]", "", name.lower())
    s = re.sub(r"[-\s]+", "-", s).strip("-")
    return s or "course"


@router.post("", response_model=CourseOut)
async def create_course(body: CourseCreate, db: AsyncSession = Depends(get_db)):
    base = slugify(body.name)
    slug = base
    n = 0
    while True:
        r = await db.execute(select(Course).where(Course.slug == slug))
        if r.scalar_one_or_none() is None:
            break
        n += 1
        slug = f"{base}-{n}"
    course = Course(name=body.name, slug=slug)
    db.add(course)
    await db.flush()
    await db.refresh(course)
    return course


@router.get("", response_model=list[CourseOut])
async def list_courses(db: AsyncSession = Depends(get_db)):
    r = await db.execute(select(Course).order_by(Course.created_at.desc()))
    return list(r.scalars().all())


@router.delete("/{course_id}", status_code=204)
async def delete_course(course_id: int, db: AsyncSession = Depends(get_db)):
    r = await db.execute(select(Course).where(Course.id == course_id))
    course = r.scalar_one_or_none()
    if course is None:
        raise HTTPException(404, "Course not found")
    db.delete(course)
    await db.flush()
    await db.commit()
    return Response(status_code=204)
