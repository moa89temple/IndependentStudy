from datetime import datetime

from sqlalchemy import DateTime, Float, Integer, String
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class UiClick(Base):
    """Client-reported UI clicks for UX heatmaps and element funnels."""

    __tablename__ = "ui_clicks"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    user_id: Mapped[str] = mapped_column(String(128), nullable=False, default="default")
    path: Mapped[str] = mapped_column(String(512), nullable=False)
    element_key: Mapped[str] = mapped_column(String(256), nullable=False)
    tag: Mapped[str] = mapped_column(String(32), nullable=False, default="")
    x_norm: Mapped[float] = mapped_column(Float, nullable=False)
    y_norm: Mapped[float] = mapped_column(Float, nullable=False)
    viewport_w: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    viewport_h: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
