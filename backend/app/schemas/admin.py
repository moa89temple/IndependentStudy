from typing import Literal

from pydantic import BaseModel


class CountsOut(BaseModel):
    courses: int = 0
    materials: int = 0
    text_chunks: int = 0
    concepts: int = 0
    flashcards: int = 0
    practice_questions: int = 0
    interactions: int = 0
    interactions_last_7d: int = 0


class InteractionTypeBreakdownOut(BaseModel):
    target_type: str
    total: int
    correct: int


class UserRollupOut(BaseModel):
    user_id: str
    total: int
    correct: int


class DailyActivityOut(BaseModel):
    day: str
    total: int
    correct: int


class CourseRollupOut(BaseModel):
    course_id: int
    name: str
    slug: str
    created_at: str
    materials: int = 0
    concepts: int = 0
    flashcards: int = 0
    practice_questions: int = 0
    study_interactions: int = 0


class InsightOut(BaseModel):
    title: str
    detail: str
    tone: Literal["positive", "neutral", "warning"]


class UxHeatmapCellOut(BaseModel):
    gx: int
    gy: int
    count: int


class UxHeatmapOut(BaseModel):
    columns: int
    rows: int
    max_count: int
    cells: list[UxHeatmapCellOut]


class UxTopElementOut(BaseModel):
    element_key: str
    clicks: int
    last_path: str


class UxAnalyticsOut(BaseModel):
    window_days: int = 30
    total_clicks: int
    heatmap: UxHeatmapOut
    top_elements: list[UxTopElementOut]


class AnalyticsOut(BaseModel):
    generated_at: str
    counts: CountsOut
    study: dict
    interaction_types: list[InteractionTypeBreakdownOut]
    users: list[UserRollupOut]
    daily_activity: list[DailyActivityOut]
    courses: list[CourseRollupOut]
    insights: list[InsightOut]
    ux: UxAnalyticsOut
