from pydantic import BaseModel


class ConceptOut(BaseModel):
    id: int
    course_id: int
    name: str
    explanation: str
    source_material_id: int | None
    source_chunk_id: int | None
    source_span: str | None

    class Config:
        from_attributes = True


class FlashcardOut(BaseModel):
    id: int
    concept_id: int
    front: str
    back: str

    class Config:
        from_attributes = True


class PracticeQuestionOut(BaseModel):
    id: int
    concept_id: int
    question: str
    expected_answer: str
    source_ref: str | None

    class Config:
        from_attributes = True
