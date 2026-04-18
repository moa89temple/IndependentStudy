from pydantic import BaseModel, Field


class UxClickItem(BaseModel):
    path: str = Field(..., max_length=512)
    element_key: str = Field(..., max_length=256)
    tag: str = Field(default="", max_length=32)
    x_norm: float = Field(..., ge=0, le=1)
    y_norm: float = Field(..., ge=0, le=1)
    viewport_w: int = Field(default=0, ge=0, le=100000)
    viewport_h: int = Field(default=0, ge=0, le=100000)


class UxClickBatchIn(BaseModel):
    user_id: str = Field(default="default", max_length=128)
    clicks: list[UxClickItem] = Field(default_factory=list)
