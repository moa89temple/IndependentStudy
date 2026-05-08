from app.database import Base
from app.models.course import Course, Material, TextChunk
from app.models.learning import Concept, Flashcard, PracticeQuestion, ShortVideo
from app.models.interaction import Interaction
from app.models.ux_click import UiClick

__all__ = [
    "Base",
    "Course",
    "Material",
    "TextChunk",
    "Concept",
    "Flashcard",
    "PracticeQuestion",
    "ShortVideo",
    "Interaction",
    "UiClick",
]
