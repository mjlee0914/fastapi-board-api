from fastapi import APIRouter, status

from app.api.deps import CurrentUser, DbSession, OptionalUser, Pagination
from app.core import exceptions as exc
from app.schemas.comment import CommentCreate, CommentResponse
from app.schemas.common import Page
from app.schemas.error import error_responses
from app.services import comment_service

# 주소가 /posts/{id}/comments 와 /comments/{id} 두 가지라서 prefix 없이 씀
router = APIRouter(tags=["Comments"])


@router.get(
    "/posts/{post_id}/comments",
    response_model=Page[CommentResponse],
    summary="댓글(리뷰) 목록",
    description="글을 볼 수 있는 사람만 볼 수 있습니다. 작성자는 글마다 익명 번호(글쓴이, 익명1, 익명2...)로 표시됩니다.",
    responses=error_responses(exc.PostNotFound),
)
async def list_comments(post_id: int, db: DbSession, viewer: OptionalUser, page: Pagination):
    return await comment_service.list_comments(db, post_id, viewer, page)


@router.post(
    "/posts/{post_id}/comments",
    response_model=CommentResponse,
    status_code=status.HTTP_201_CREATED,
    summary="댓글(리뷰) 작성",
    description="로그인 + 글을 볼 수 있어야 합니다.",
    responses=error_responses(exc.Unauthorized, exc.PostNotFound, exc.ValidationFailed),
)
async def create_comment(post_id: int, data: CommentCreate, db: DbSession, user: CurrentUser):
    return await comment_service.create_comment(db, post_id, user, data)


@router.delete(
    "/comments/{comment_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="댓글 삭제",
    description="댓글 작성자만 삭제할 수 있습니다.",
    responses=error_responses(exc.Unauthorized, exc.Forbidden, exc.CommentNotFound),
)
async def delete_comment(comment_id: int, db: DbSession, user: CurrentUser):
    await comment_service.delete_comment(db, comment_id, user)
