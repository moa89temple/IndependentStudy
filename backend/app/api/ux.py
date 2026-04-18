from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models import UiClick
from app.schemas.ux import UxClickBatchIn

router = APIRouter()


@router.post("/clicks", status_code=204)
async def record_ui_clicks(body: UxClickBatchIn, db: AsyncSession = Depends(get_db)):
    uid = body.user_id or "default"
    for c in body.clicks[:200]:
        db.add(
            UiClick(
                user_id=uid,
                path=c.path[:512],
                element_key=c.element_key[:256],
                tag=(c.tag or "")[:32],
                x_norm=float(c.x_norm),
                y_norm=float(c.y_norm),
                viewport_w=int(c.viewport_w),
                viewport_h=int(c.viewport_h),
            )
        )
    await db.flush()
    return None
