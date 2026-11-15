from fastapi import Depends, FastAPI
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.db.session import get_db

app = FastAPI(
    title=settings.APP_NAME,
    description="사진 공유 커뮤니티 게시판 API — 오늘 담은 일상을 티켓으로 걸어요 🛒",
    version="0.1.0",
)

# 서버가 살아 있는지/DB 연결 되는지 확인하는 주소
# EC2 배포 뒤에도 이 주소로 서버 상태 확인함. 정상 배포 여부 바로 확인 가능. ex) curl http://<EC2-IP>/health
# /heath에서는 로그인 없이 누구나 호출 가능 -> 내부 정보를 응답에 넣으면 안된다. 현재처럼 ok만 주기!
@app.get("/health", tags=["Health"], summary="서버/DB 상태 확인")
async def health(db: AsyncSession = Depends(get_db)):
    await db.execute(text("SELECT 1"))
    return {"status": "ok", "db": "ok"}