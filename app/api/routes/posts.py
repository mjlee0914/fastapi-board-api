from typing import Annotated, Literal

from fastapi import APIRouter, Form, Query, Response, status

from app.api.deps import CurrentUser, DbSession, OptionalUser, Pagination
from app.core import exceptions as exc
from app.core.cache import feed_cache
from app.models import Category
from app.schemas.common import Page
from app.schemas.error import error_responses
from app.schemas.post import PostCreateForm, PostResponse, PostUpdate
from app.services import post_service

router = APIRouter(prefix="/posts", tags=["Posts"])


@router.get(
    "",
    response_model=Page[PostResponse],
    summary="피드 (티켓 레일)",
    description=(
        "레일에 걸린 티켓 목록. 비회원도 볼 수 있습니다.\n\n"
        "- 비회원: PUBLIC 글만 / 회원: PUBLIC + 친구의 FRIENDS 글 + 내 글\n"
        "- `today=true`: 오늘(KST) 걸린 티켓만 (오늘의 레일)\n"
        "- 비회원 피드는 짧게 캐시합니다. 응답 헤더 `X-Cache: HIT | MISS`로 확인"
    ),
    responses=error_responses(exc.TokenExpired, exc.ValidationFailed),
)
async def list_posts(
    db: DbSession,
    viewer: OptionalUser,
    page: Pagination,
    response: Response,  # 응답 헤더(X-Cache)를 넣으려고 받음
    category: Category | None = Query(None, description="마트 코너 (카테고리)"),
    sort: Literal["latest", "popular"] = Query("latest", description="latest: 최신순 / popular: 담기 많은 순"),
    today: bool = Query(False, description="true면 오늘 걸린 티켓만"),
):
    # 비회원만 캐시 (로그인하면 사람마다 보이는 글이 달라서)
    cache_key = None
    if viewer is None:
        cache_key = f"feed:{category}:{sort}:{today}:{page.page}:{page.size}"
        cached = feed_cache.get(cache_key)
        if cached is not None:
            response.headers["X-Cache"] = "HIT"  # 캐시에서 바로 줌 (DB x)
            return cached

    result = await post_service.list_posts(db, viewer, page, category=category, sort=sort, today=today)
    if cache_key is not None:
        feed_cache.set(cache_key, result.model_dump(mode="json"))
        response.headers["X-Cache"] = "MISS"  # DB에서 가져와서 캐시에 저장함
    return result


@router.post(
    "",
    response_model=PostResponse,
    status_code=status.HTTP_201_CREATED,
    summary="글 작성 (티켓 걸기)",
    description=(
        "사진과 함께 티켓을 겁니다. **multipart/form-data**로 보냅니다.\n\n"
        "- 사진: jpg, png, webp / 5MB 이하 (선택)\n"
        "- visibility: PUBLIC이면 익명, FRIENDS면 친구에게만 닉네임과 함께 보임"
    ),
    responses=error_responses(exc.Unauthorized, exc.TokenExpired, exc.InvalidImage, exc.ValidationFailed),
)
async def create_post(
    db: DbSession,
    user: CurrentUser,
    # 폼 필드(사진 포함)를 스키마로 한 번에 받아서 검증
    # media_type: 파일이 섞인 폼이라 multipart/form-data 로 받는다고 Swagger에 알려 줌 -> 파일 선택 버튼 생김
    form: Annotated[PostCreateForm, Form(media_type="multipart/form-data")],
):
    return await post_service.create_post(db, user, form)


@router.get(
    "/{post_id}",
    response_model=PostResponse,
    summary="글 상세 조회",
    description="티켓 하나를 자세히 봅니다. 다른 사람이 조회하면 조회수(`pull_count`)가 1 올라갑니다. "
    "볼 권한이 없는 FRIENDS 글은 존재를 숨기기 위해 404를 돌려줍니다.",
    responses=error_responses(exc.PostNotFound, exc.TokenExpired),
)
async def get_post(post_id: int, db: DbSession, viewer: OptionalUser):
    return await post_service.get_post_detail(db, post_id, viewer)


@router.patch(
    "/{post_id}",
    response_model=PostResponse,
    summary="글 수정",
    description="작성자만 수정할 수 있습니다. 바꿀 값만 JSON으로 보내면 됩니다 (부분 수정).",
    responses=error_responses(exc.Unauthorized, exc.Forbidden, exc.PostNotFound, exc.ValidationFailed),
)
async def update_post(post_id: int, data: PostUpdate, db: DbSession, user: CurrentUser):
    return await post_service.update_post(db, post_id, user, data)


@router.delete(
    "/{post_id}",
    status_code=status.HTTP_204_NO_CONTENT,  # 삭제 성공은 204 (응답 body 없음)
    summary="글 삭제",
    description="작성자만 삭제할 수 있습니다. 댓글, 좋아요, 사진도 같이 지워집니다.",
    responses=error_responses(exc.Unauthorized, exc.Forbidden, exc.PostNotFound),
)
async def delete_post(post_id: int, db: DbSession, user: CurrentUser):
    await post_service.delete_post(db, post_id, user)
