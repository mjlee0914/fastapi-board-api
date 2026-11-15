from typing import Literal

from fastapi import APIRouter, Query, status

from app.api.deps import CurrentUser, DbSession, Pagination
from app.core import exceptions as exc
from app.schemas.common import Page
from app.schemas.error import error_responses
from app.schemas.friend import FriendRequestCreate, FriendRequestResponse, FriendRequestUpdate, FriendResponse
from app.services import friend_service

router = APIRouter(prefix="/friends", tags=["Friends"])


@router.post(
    "/requests",
    response_model=FriendRequestResponse,
    status_code=status.HTTP_201_CREATED,
    summary="친구 요청 (닉네임으로)",
    description="익명성 때문에 사용자 id 대신 닉네임으로 요청합니다.",
    responses=error_responses(
        exc.Unauthorized,
        exc.CannotFriendSelf,
        exc.UserNotFound,
        exc.AlreadyFriends,
        exc.FriendRequestExists,
        exc.ValidationFailed,
    ),
)
async def send_request(data: FriendRequestCreate, db: DbSession, user: CurrentUser):
    return await friend_service.send_request(db, user, data.nickname)


@router.get(
    "/requests",
    response_model=Page[FriendRequestResponse],
    summary="받은/보낸 친구 요청 목록",
    description="아직 처리되지 않은(PENDING) 요청만 보여 줍니다.",
    responses=error_responses(exc.Unauthorized),
)
async def list_requests(
    db: DbSession,
    user: CurrentUser,
    page: Pagination,
    # type 은 파이썬 기본 함수 이름이라 변수명은 direction, 주소에서는 ?type= 으로 받음
    direction: Literal["received", "sent"] = Query("received", alias="type", description="received: 받은 / sent: 보낸"),
):
    return await friend_service.list_requests(db, user, direction, page)


@router.patch(
    "/requests/{request_id}",
    response_model=FriendRequestResponse,
    summary="친구 요청 수락/거절",
    description="요청을 받은 사람만 할 수 있습니다.",
    responses=error_responses(
        exc.Unauthorized, exc.Forbidden, exc.FriendRequestNotFound, exc.FriendRequestAlreadyHandled, exc.ValidationFailed
    ),
)
async def respond_request(request_id: int, data: FriendRequestUpdate, db: DbSession, user: CurrentUser):
    return await friend_service.respond_request(db, user, request_id, data.status)


@router.get(
    "",
    response_model=Page[FriendResponse],
    summary="친구 목록",
    responses=error_responses(exc.Unauthorized),
)
async def list_friends(db: DbSession, user: CurrentUser, page: Pagination):
    return await friend_service.list_friends(db, user, page)


@router.delete(
    "/{nickname}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="친구 삭제",
    description="익명성 때문에 사용자 id 대신 닉네임으로 지정합니다.",
    responses=error_responses(exc.Unauthorized, exc.UserNotFound, exc.NotFriends),
)
async def remove_friend(nickname: str, db: DbSession, user: CurrentUser):
    await friend_service.remove_friend(db, user, nickname)
