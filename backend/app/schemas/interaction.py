from datetime import datetime
from pydantic import BaseModel


class InteractionCreate(BaseModel):
    user_id: str = "default"
    target_type: str  # flashcard | question
    target_id: int
    correct: bool


class InteractionOut(BaseModel):
    id: int
    user_id: str
    target_type: str
    target_id: int
    correct: bool
    at: datetime

    class Config:
        from_attributes = True
