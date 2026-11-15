from typing import Literal

from sqlalchemy import and_, func, or_, select, union_all
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.exceptions import (
    AlreadyFriends,
    CannotFriendSelf,
    Forbidden,
    FriendRequestAlreadyHandled,
    FriendRequestExists,
    FriendRequestNotFound,
    NotFriends,
    UserNotFound,
)
from app.models import Friendship, FriendshipStatus, User
from app.schemas.common import Page, PageParams
from app.schemas.friend import FriendRequestResponse, FriendResponse


def friend_ids_query(user_id: int):
    """내 친구들의 id 목록을 만드는 쿼리 (공개 범위 판단에 씀)

    친구 관계는 한 줄에 (요청자, 받은 사람)으로 저장 -> 내가 어느 쪽이든 상대방이 친구
    1. 내가 보낸 요청 중 ACCEPTED -> 받은 사람(addressee)
    2. 내가 받은 요청 중 ACCEPTED -> 보낸 사람(requester)
    두 결과를 합침(union)
    """
    sent = select(Friendship.addressee_id).where(
        Friendship.requester_id == user_id, Friendship.status == FriendshipStatus.ACCEPTED
    )
    received = select(Friendship.requester_id).where(
        Friendship.addressee_id == user_id, Friendship.status == FriendshipStatus.ACCEPTED
    )
    return union_all(sent, received)


def _between(a: int, b: int):
    # a, b 사이의 관계 (a->b 든 b->a 든)
    return or_(
        and_(Friendship.requester_id == a, Friendship.addressee_id == b),
        and_(Friendship.requester_id == b, Friendship.addressee_id == a),
    )


async def _get_user_by_nickname(db: AsyncSession, nickname: str) -> User:
    user = await db.scalar(select(User).where(User.nickname == nickname))
    if user is None:
        raise UserNotFound()
    return user


def _request_response(fr: Friendship, other: User) -> FriendRequestResponse:
    return FriendRequestResponse(
        id=fr.id,
        nickname=other.nickname,
        profile_image_url=other.profile_image_url,
        status=fr.status,
        created_at=fr.created_at,
    )


async def send_request(db: AsyncSession, me: User, nickname: str) -> FriendRequestResponse:
    target = await _get_user_by_nickname(db, nickname)
    if target.id == me.id:
        raise CannotFriendSelf()

    existing = await db.scalar(select(Friendship).where(_between(me.id, target.id)))
    if existing is not None:
        if existing.status == FriendshipStatus.ACCEPTED:
            raise AlreadyFriends()
        if existing.status == FriendshipStatus.PENDING:
            if existing.requester_id == target.id:
                # 상대가 먼저 나한테 보낸 상태 -> 새로 보내지 말고 받은 요청에서 수락하라고 알려 줌
                raise FriendRequestExists("상대방이 이미 친구 요청을 보냈습니다. 받은 요청에서 수락해 주세요.")
            raise FriendRequestExists()
        # REJECTED(거절됨) -> 줄을 새로 만들지 않고 기존 줄을 다시 PENDING으로 재사용
        # (DB에 A-B 쌍은 한 줄만 있을 수 있음: uq_friendship_pair)
        existing.requester_id, existing.addressee_id = me.id, target.id
        existing.status = FriendshipStatus.PENDING
        existing.created_at = func.now()
        fr = existing
    else:
        fr = Friendship(requester_id=me.id, addressee_id=target.id)
        db.add(fr)

    await db.commit()
    await db.refresh(fr)  # DB가 만든 id, created_at 읽어 오기
    return _request_response(fr, target)


async def list_requests(
    db: AsyncSession, me: User, direction: Literal["received", "sent"], page: PageParams
) -> Page[FriendRequestResponse]:
    # 아직 처리 안 된(PENDING) 요청만
    if direction == "received":
        cond = and_(Friendship.addressee_id == me.id, Friendship.status == FriendshipStatus.PENDING)
    else:
        cond = and_(Friendship.requester_id == me.id, Friendship.status == FriendshipStatus.PENDING)

    total = await db.scalar(select(func.count()).select_from(Friendship).where(cond))
    rows = await db.scalars(
        select(Friendship)
        .where(cond)
        # 상대방 닉네임이 필요 -> requester, addressee를 미리 같이 가져옴 (N+1 방지, 비동기에서 필수)
        .options(selectinload(Friendship.requester), selectinload(Friendship.addressee))
        .order_by(Friendship.created_at.desc())
        .offset(page.offset)
        .limit(page.size)
    )
    items = [_request_response(fr, fr.requester if direction == "received" else fr.addressee) for fr in rows]
    return Page[FriendRequestResponse](items=items, page=page.page, size=page.size, total=total or 0)


async def respond_request(
    db: AsyncSession, me: User, request_id: int, status: Literal["ACCEPTED", "REJECTED"]
) -> FriendRequestResponse:
    fr = await db.scalar(
        select(Friendship).where(Friendship.id == request_id).options(selectinload(Friendship.requester))
    )
    # 나랑 상관없는 요청이면 404 (남의 요청이 있는지 알려 주지 않음)
    if fr is None or me.id not in (fr.requester_id, fr.addressee_id):
        raise FriendRequestNotFound()
    # 내가 보낸 요청을 내가 수락하면 안 됨 -> 받은 사람만
    if fr.addressee_id != me.id:
        raise Forbidden("요청을 받은 사람만 수락하거나 거절할 수 있습니다.")
    if fr.status != FriendshipStatus.PENDING:
        raise FriendRequestAlreadyHandled()

    fr.status = FriendshipStatus(status)
    await db.commit()
    return _request_response(fr, fr.requester)


async def list_friends(db: AsyncSession, me: User, page: PageParams) -> Page[FriendResponse]:
    cond = and_(
        or_(Friendship.requester_id == me.id, Friendship.addressee_id == me.id),
        Friendship.status == FriendshipStatus.ACCEPTED,
    )
    total = await db.scalar(select(func.count()).select_from(Friendship).where(cond))
    rows = await db.scalars(
        select(Friendship)
        .where(cond)
        .options(selectinload(Friendship.requester), selectinload(Friendship.addressee))
        .order_by(Friendship.created_at.desc())
        .offset(page.offset)
        .limit(page.size)
    )
    items = []
    for fr in rows:
        other = fr.addressee if fr.requester_id == me.id else fr.requester  # 나 말고 상대방
        items.append(FriendResponse(nickname=other.nickname, profile_image_url=other.profile_image_url))
    return Page[FriendResponse](items=items, page=page.page, size=page.size, total=total or 0)


async def remove_friend(db: AsyncSession, me: User, nickname: str) -> None:
    target = await _get_user_by_nickname(db, nickname)
    fr = await db.scalar(
        select(Friendship).where(_between(me.id, target.id), Friendship.status == FriendshipStatus.ACCEPTED)
    )
    if fr is None:
        raise NotFriends()
    await db.delete(fr)  # 지우면 다시 친구 요청부터 가능
    await db.commit()
