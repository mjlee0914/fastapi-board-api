from sqlalchemy import func, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.cache import feed_cache
from app.core.exceptions import AlreadyLiked, LikeNotFound
from app.models import Like, User
from app.schemas.like import LikeResponse
from app.services.post_service import get_visible_post


async def _count(db: AsyncSession, post_id: int) -> int:
    return await db.scalar(select(func.count()).select_from(Like).where(Like.post_id == post_id)) or 0


async def like_post(db: AsyncSession, post_id: int, user: User) -> LikeResponse:
    await get_visible_post(db, post_id, user)  # 볼 수 없는 글은 담기 x (404)

    # db.get에 복합 기본키는 (user_id, post_id) 순서로 넘김
    if await db.get(Like, (user.id, post_id)) is not None:
        raise AlreadyLiked()

    db.add(Like(user_id=user.id, post_id=post_id))
    try:
        await db.commit()
    except IntegrityError:
        # 위에서 확인한 순간과 저장하는 순간 사이에 같은 요청이 또 들어온 경우 (버튼 연타)
        # -> DB의 복합 기본키가 막아 줌 -> 에러 대신 409로 돌려줌
        await db.rollback()
        raise AlreadyLiked()

    feed_cache.clear()
    return LikeResponse(post_id=post_id, liked=True, like_count=await _count(db, post_id))


async def unlike_post(db: AsyncSession, post_id: int, user: User) -> None:
    like = await db.get(Like, (user.id, post_id))
    if like is None:
        raise LikeNotFound()
    await db.delete(like)
    await db.commit()
    feed_cache.clear()
