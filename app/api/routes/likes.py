from fastapi import APIRouter, status

from app.api.deps import CurrentUser, DbSession
from app.core import exceptions as exc
from app.schemas.error import error_responses
from app.schemas.like import LikeResponse
from app.services import like_service

router = APIRouter(prefix="/posts/{post_id}/likes", tags=["Likes"])


@router.post(
    "",
    response_model=LikeResponse,
    status_code=status.HTTP_201_CREATED,  # 좋아요 = "담기" 기록을 새로 만드는 것 -> 201
    summary="나도 담기 (좋아요)",
    description="같은 글은 한 번만 담을 수 있습니다. 볼 수 없는 글은 담을 수 없습니다.",
    responses=error_responses(exc.Unauthorized, exc.PostNotFound, exc.AlreadyLiked),
)
async def like_post(post_id: int, db: DbSession, user: CurrentUser):
    return await like_service.like_post(db, post_id, user)


@router.delete(
    "",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="담기 취소",
    responses=error_responses(exc.Unauthorized, exc.LikeNotFound),
)
async def unlike_post(post_id: int, db: DbSession, user: CurrentUser):
    await like_service.unlike_post(db, post_id, user)
