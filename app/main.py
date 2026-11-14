from fastapi import Depends, FastAPI
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.db.session import get_db

app = FastAPI(
    title=settings.APP_NAME,
    description="사진 공유 커뮤니티 게시판 API — 오늘 담은 일상을 카트에 담아 공유해요 🛒",
    version="0.1.0",
)


@app.get("/health", tags=["Health"], summary="서버·DB 상태 확인")
async def health(db: AsyncSession = Depends(get_db)):
    await db.execute(text("SELECT 1"))
    return {"status": "ok", "db": "ok"}
