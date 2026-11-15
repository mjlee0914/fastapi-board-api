import logging
import time

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings

logger = logging.getLogger("app.request")


# 미들웨어: 모든 요청이 라우터에 가기 전/후에 거치는 곳
# 요청 -> [미들웨어] -> 라우터 -> [미들웨어] -> 응답
async def log_requests(request: Request, call_next):
    start = time.perf_counter()  # 시간 재기 시작
    try:
        response = await call_next(request)  # 여기서 실제 라우터가 실행됨
    except Exception:
        # 예상 못 한 에러도 로그는 남기고 다시 던짐 -> 500 핸들러가 처리
        logger.info("%s %s -> 500 (%.1fms)", request.method, request.url.path, (time.perf_counter() - start) * 1000)
        raise
    ms = (time.perf_counter() - start) * 1000
    # 처리 시간을 응답 헤더에 넣음 -> 어떤 API가 느린지 바로 확인 가능
    response.headers["X-Process-Time"] = f"{ms:.1f}ms"
    # ex) GET /posts -> 200 (12.3ms)
    logger.info("%s %s -> %s (%.1fms)", request.method, request.url.path, response.status_code, ms)
    return response


def register_middlewares(app: FastAPI) -> None:
    app.middleware("http")(log_requests)

    # CORS: 브라우저는 다른 주소(프론트 localhost:5173 -> 백엔드 :8000)로 요청을 기본으로 막음
    # 허용할 주소를 서버가 알려 줘야 프론트에서 API를 부를 수 있음
    allow_all = settings.CORS_ORIGINS == ["*"]
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.CORS_ORIGINS,
        allow_credentials=not allow_all,  # * 일 때는 쿠키 허용 x (브라우저 규칙). 우리는 토큰을 헤더로 보내서 상관 x
        allow_methods=["*"],
        allow_headers=["*"],
        expose_headers=["X-Process-Time", "X-Cache"],  # 프론트 JS에서 이 헤더를 읽을 수 있게
    )
