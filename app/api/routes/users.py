from fastapi import APIRouter

from app.api.deps import CurrentUser
from app.core import exceptions as exc
from app.schemas.error import error_responses
from app.schemas.user import MeResponse

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
