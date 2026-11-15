import logging
from pathlib import Path

from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from sqlalchemy import text

from app.api.deps import DbSession
from app.api.routes import auth, comments, friends, likes, posts, users
from app.core.config import settings
from app.core.error_handlers import register_exception_handlers
from app.core.middleware import register_middlewares

# 로그 형식: 시각 레벨 로거이름: 내용 -> 요청 로그(app.request), 에러 로그(app)가 터미널에 찍힘
logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(name)s: %(message)s")

app = FastAPI(
    title=settings.APP_NAME,
    description=(
        "사진 공유 커뮤니티 게시판 API. 오늘 담은 일상을 티켓으로 걸어요 🛒\n\n"
        "- 글 = 티켓. 쓰면 레일에 걸리고(`POST /posts`), 다른 사람이 뽑아서(`GET /posts/{id}`) 봅니다.\n"
        "- 익명성: PUBLIC 글과 댓글은 익명, FRIENDS 글만 친구에게 닉네임이 보입니다.\n"
        "- 인증: `POST /auth/login`으로 받은 토큰을 오른쪽 위 **Authorize**에 붙여넣으세요.\n"
        '- 모든 에러는 `{"error": {"code", "message", "details"}}` 형태입니다.\n'
        "- 응답 헤더 `X-Process-Time`: 서버 처리 시간"
    ),
    version="1.0.0",
)

register_exception_handlers(app)
register_middlewares(app)

# 라우터 등록 (Swagger에 이 순서대로 그룹이 보임)
app.include_router(auth.router)
app.include_router(users.router)
app.include_router(posts.router)
app.include_router(comments.router)
app.include_router(likes.router)
app.include_router(friends.router)

# 업로드한 사진 서빙: /uploads/abc.jpg 로 요청하면 uploads/abc.jpg 파일을 돌려줌
Path(settings.UPLOAD_DIR).mkdir(parents=True, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=settings.UPLOAD_DIR), name="uploads")


# 서버가 살아 있는지/DB 연결 되는지 확인하는 주소
# EC2 배포 뒤에도 이 주소로 서버 상태 확인함. 정상 배포 여부 바로 확인 가능. ex) curl http://<EC2-IP>/health
# /health에서는 로그인 없이 누구나 호출 가능 -> 내부 정보를 응답에 넣으면 안된다. 현재처럼 ok만 주기!
@app.get("/health", tags=["Health"], summary="서버/DB 상태 확인")
async def health(db: DbSession):
    await db.execute(text("SELECT 1"))
    return {"status": "ok", "db": "ok"}
