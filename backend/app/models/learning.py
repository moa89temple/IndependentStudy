from sqlalchemy import String, Text, ForeignKey, Integer
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class Concept(Base):
    __tablename__ = "concepts"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    course_id: Mapped[int] = mapped_column(ForeignKey("courses.id", ondelete="CASCADE"), nullable=False)
    name: Mapped[str] = mapped_column(String(256), nullable=False)
    explanation: Mapped[str] = mapped_column(Text, nullable=False)
    source_material_id: Mapped[int | None] = mapped_column(ForeignKey("materials.id", ondelete="SET NULL"), nullable=True)
    source_chunk_id: Mapped[int | None] = mapped_column(ForeignKey("text_chunks.id", ondelete="SET NULL"), nullable=True)
    source_span: Mapped[str | None] = mapped_column(String(256), nullable=True)  # e.g. "page 3", "slide 5"

    course: Mapped["Course"] = relationship("Course", back_populates="concepts")
    flashcards: Mapped[list["Flashcard"]] = relationship("Flashcard", back_populates="concept", cascade="all, delete-orphan")
    practice_questions: Mapped[list["PracticeQuestion"]] = relationship(
        "PracticeQuestion", back_populates="concept", cascade="all, delete-orphan"
    )


class Flashcard(Base):
    __tablename__ = "flashcards"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    concept_id: Mapped[int] = mapped_column(ForeignKey("concepts.id", ondelete="CASCADE"), nullable=False)
    front: Mapped[str] = mapped_column(Text, nullable=False)
    back: Mapped[str] = mapped_column(Text, nullable=False)

    concept: Mapped["Concept"] = relationship("Concept", back_populates="flashcards")


class PracticeQuestion(Base):
    __tablename__ = "practice_questions"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    concept_id: Mapped[int] = mapped_column(ForeignKey("concepts.id", ondelete="CASCADE"), nullable=False)
    question: Mapped[str] = mapped_column(Text, nullable=False)
    expected_answer: Mapped[str] = mapped_column(Text, nullable=False)
    source_ref: Mapped[str | None] = mapped_column(String(256), nullable=True)

    concept: Mapped["Concept"] = relationship("Concept", back_populates="practice_questions")
