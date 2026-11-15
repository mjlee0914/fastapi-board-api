from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.cache import feed_cache
from app.core.exceptions import CommentNotFound, Forbidden
from app.models import Comment, Post, User
from app.schemas.comment import CommentCreate, CommentResponse
from app.schemas.common import Page, PageParams
from app.services.post_service import get_visible_post


async def _anonymous_labels(db: AsyncSession, post: Post) -> dict[int, str]:
    """이 글의 댓글 작성자들에게 익명 번호 붙이기 -> {user_id: "익명1"}

    1. 작성자별로 "처음 단 댓글 id"를 구함 (id가 작을수록 먼저 단 것)
    2. 먼저 단 순서대로 익명1, 익명2... (글 작성자는 "글쓴이")
    -> 같은 사람은 이 글 안에서 항상 같은 번호. 다른 글에서는 번호가 달라서 누군지 추적 x
    """
    first_comment = func.min(Comment.id)
    rows = await db.execute(
        select(Comment.author_id).where(Comment.post_id == post.id).group_by(Comment.author_id).order_by(first_comment)
    )
    labels: dict[int, str] = {}
    n = 0
    for (author_id,) in rows:
        if author_id == post.author_id:
            labels[author_id] = "글쓴이"
        else:
            n += 1
            labels[author_id] = f"익명{n}"
    return labels


def _to_response(c: Comment, labels: dict[int, str], viewer: User | None) -> CommentResponse:
    return CommentResponse(
        id=c.id,
        content=c.content,
        author_label=labels.get(c.author_id, "익명"),
        is_mine=viewer is not None and c.author_id == viewer.id,
        created_at=c.created_at,
    )


async def list_comments(db: AsyncSession, post_id: int, viewer: User | None, page: PageParams) -> Page[CommentResponse]:
    post = await get_visible_post(db, post_id, viewer)  # 글을 볼 수 없으면 댓글도 못 봄 (404)
    labels = await _anonymous_labels(db, post)

    total = await db.scalar(select(func.count()).select_from(Comment).where(Comment.post_id == post_id))
    rows = await db.scalars(
        select(Comment)
        .where(Comment.post_id == post_id)
        .order_by(Comment.created_at, Comment.id)  # 댓글은 오래된 순 (대화 흐름대로)
        .offset(page.offset)
        .limit(page.size)
    )
    items = [_to_response(c, labels, viewer) for c in rows]
    return Page[CommentResponse](items=items, page=page.page, size=page.size, total=total or 0)


async def create_comment(db: AsyncSession, post_id: int, user: User, data: CommentCreate) -> CommentResponse:
    post = await get_visible_post(db, post_id, user)  # 볼 수 없는 글엔 댓글 x
    comment = Comment(post_id=post.id, author_id=user.id, content=data.content)
    db.add(comment)
    await db.commit()
    await db.refresh(comment)
    feed_cache.clear()  # 피드의 댓글 수가 바뀜
    labels = await _anonymous_labels(db, post)
    return _to_response(comment, labels, user)


async def delete_comment(db: AsyncSession, comment_id: int, user: User) -> None:
    comment = await db.get(Comment, comment_id)
    if comment is None:
        raise CommentNotFound()
    if comment.author_id != user.id:
        raise Forbidden("댓글 작성자만 삭제할 수 있습니다.")
    await db.delete(comment)
    await db.commit()
    feed_cache.clear()
