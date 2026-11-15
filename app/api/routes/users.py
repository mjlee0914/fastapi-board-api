from fastapi import APIRouter

from app.api.deps import CurrentUser, DbSession, Pagination
from app.core import exceptions as exc
from app.schemas.common import Page
from app.schemas.error import error_responses
from app.schemas.post import PostResponse
from app.schemas.user import MeResponse
from app.services import post_service

router = APIRouter(prefix="/users", tags=["Users"])


@router.get(
    "/me",
    response_model=MeResponse,
    summary="내 정보 조회",
    description="토큰 주인(로그인한 사용자)의 정보를 반환합니다.",
    responses=error_responses(exc.Unauthorized, exc.TokenExpired),
)
async def read_me(user: CurrentUser):
    return user


@router.get(
    "/me/posts",
    response_model=Page[PostResponse],
    summary="내 카트 (내가 쓴 글)",
    description="내가 건 티켓을 최신순으로 모아 봅니다. 공개 범위와 상관없이 내 글은 전부 보입니다.",
    responses=error_responses(exc.Unauthorized, exc.TokenExpired),
)
async def my_posts(db: DbSession, user: CurrentUser, page: Pagination):
    # 피드와 같은 함수 재사용 + 작성자를 나로 고정
    return await post_service.list_posts(db, user, page, author_id=user.id)
