from datetime import UTC, datetime, timedelta, timezone
from typing import Literal

from sqlalchemy import Date, and_, cast, exists, false, func, or_, select, update
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import aliased, selectinload

from app.core.cache import feed_cache
from app.core.exceptions import Forbidden, PostNotFound
from app.models import Category, Comment, Like, Post, User, Visibility
from app.schemas.common import Page, PageParams
from app.schemas.post import AuthorInfo, PostCreateForm, PostResponse, PostUpdate
from app.services.friend_service import friend_ids_query
from app.storage.local import image_storage

KST = timezone(timedelta(hours=9))  # 한국 시간 (서머타임 없어서 +9 고정)


# 공개 범위 (7단계 핵심 로직)


def can_view(viewer: User | None):
    """viewer가 볼 수 있는 글만 고르는 WHERE 조건

    비회원: PUBLIC 글만
    회원: PUBLIC 글 + 내 글 전부 + 친구(ACCEPTED)의 FRIENDS 글
    -> 모든 조회(피드, 상세, 댓글, 좋아요)에서 이 조건 하나만 씀 -> 규칙이 한 곳에 있어서 실수 x
    """
    if viewer is None:
        return Post.visibility == Visibility.PUBLIC
    return or_(
        Post.visibility == Visibility.PUBLIC,
        Post.author_id == viewer.id,
        and_(Post.visibility == Visibility.FRIENDS, Post.author_id.in_(friend_ids_query(viewer.id))),
    )


async def get_visible_post(db: AsyncSession, post_id: int, viewer: User | None) -> Post:
    """볼 수 있는 글 하나 가져오기. 없거나 볼 권한이 없으면 둘 다 404

    볼 권한 없는 FRIENDS 글에 403을 주면 "글이 있긴 하구나"가 드러남 -> 404로 존재 자체를 숨김
    """
    post = await db.scalar(select(Post).where(Post.id == post_id, can_view(viewer)))
    if post is None:
        raise PostNotFound()
    return post


# 목록/상세 조회 쿼리 (N+1 방지)


def _kst_date(col):
    # DB에 UTC로 저장된 시각 -> 한국 날짜로 바꿈 (ticket_no, today 필터용)
    return cast(func.timezone("Asia/Seoul", col), Date)


def _post_query(viewer: User | None):
    """글 + 좋아요 수 + 댓글 수 + 내가 담았는지 + 주문 번호를 "쿼리 한 번"에 가져오기

    N+1 문제: 글 20개 가져오고 -> 글마다 좋아요 수 따로 세면 쿼리 1 + 20번
    해결: 좋아요 수, 댓글 수를 서브쿼리로 넣어서 글 목록과 같이 한 번에 가져옴
    작성자(author)는 selectinload -> users를 IN (...)으로 한 번 더 (총 쿼리 2번, 글 개수와 상관 x)
    """
    # .correlate(Post): 바깥 쿼리의 "지금 이 글"과 연결 -> 글마다 자기 좋아요 수를 셈
    like_count = (
        select(func.count()).select_from(Like).where(Like.post_id == Post.id).correlate(Post).scalar_subquery()
    ).label("like_count")
    comment_count = (
        select(func.count()).select_from(Comment).where(Comment.post_id == Post.id).correlate(Post).scalar_subquery()
    ).label("comment_count")

    if viewer is None:
        liked_by_me = false().label("liked_by_me")  # 비회원은 항상 false
    else:
        liked_by_me = exists().where(Like.post_id == Post.id, Like.user_id == viewer.id).correlate(Post).label("liked_by_me")

    # 주문 번호: 같은 날(KST) 걸린 글 중에서 나보다 id가 작거나 같은 글 개수 -> 그날 몇 번째인지
    # 저장 x, 조회할 때 계산 -> 글이 지워져도 따로 고칠 필요 x
    other = aliased(Post)
    ticket_no = (
        select(func.count())
        .select_from(other)
        .where(_kst_date(other.created_at) == _kst_date(Post.created_at), other.id <= Post.id)
        .correlate(Post)
        .scalar_subquery()
    ).label("ticket_no")

    stmt = select(Post, like_count, comment_count, liked_by_me, ticket_no).options(selectinload(Post.author))
    return stmt, like_count


def _to_response(row, viewer: User | None) -> PostResponse:
    post, like_count, comment_count, liked_by_me, ticket_no = row
    return PostResponse(
        id=post.id,
        title=post.title,
        content=post.content,
        image_url=post.image_url,
        category=post.category,
        visibility=post.visibility,
        # 익명성: FRIENDS 글만 작성자 공개 (어차피 친구만 볼 수 있음). PUBLIC 글은 null
        author=AuthorInfo.model_validate(post.author) if post.visibility == Visibility.FRIENDS else None,
        is_mine=viewer is not None and post.author_id == viewer.id,
        ticket_no=ticket_no,
        pull_count=post.pull_count,
        like_count=like_count,
        comment_count=comment_count,
        liked_by_me=liked_by_me,
        created_at=post.created_at,
        updated_at=post.updated_at,
    )


async def _fetch_one(db: AsyncSession, post_id: int, viewer: User | None):
    stmt, _ = _post_query(viewer)
    # populate_existing: 세션에 이미 있는 객체도 DB 값으로 새로 채움 (수정 직후 updated_at 최신값 받기)
    stmt = stmt.where(Post.id == post_id, can_view(viewer)).execution_options(populate_existing=True)
    return (await db.execute(stmt)).one_or_none()


async def list_posts(
    db: AsyncSession,
    viewer: User | None,
    page: PageParams,
    category: Category | None = None,
    sort: Literal["latest", "popular"] = "latest",
    today: bool = False,
    author_id: int | None = None,
) -> Page[PostResponse]:
    """피드(티켓 레일) + 내 카트에서 같이 씀"""
    conds = [can_view(viewer)]
    if category is not None:
        conds.append(Post.category == category)
    if today:
        # 오늘의 레일: 한국 시간 오늘 0시 이후에 걸린 티켓만
        start = datetime.now(KST).replace(hour=0, minute=0, second=0, microsecond=0)
        conds.append(Post.created_at >= start.astimezone(UTC))
    if author_id is not None:
        conds.append(Post.author_id == author_id)

    total = await db.scalar(select(func.count()).select_from(Post).where(*conds))

    stmt, like_count = _post_query(viewer)
    order = [like_count.desc()] if sort == "popular" else []  # 인기순: 좋아요 많은 순 -> 같으면 최신순
    stmt = (
        stmt.where(*conds)
        .order_by(*order, Post.created_at.desc(), Post.id.desc())
        .offset(page.offset)
        .limit(page.size)
    )
    rows = (await db.execute(stmt)).all()
    return Page[PostResponse](
        items=[_to_response(r, viewer) for r in rows], page=page.page, size=page.size, total=total or 0
    )


async def get_post_detail(db: AsyncSession, post_id: int, viewer: User | None) -> PostResponse:
    """티켓 뽑기 (상세 조회). 다른 사람이 뽑으면 pull_count +1"""
    row = await _fetch_one(db, post_id, viewer)
    if row is None:
        raise PostNotFound()
    result = _to_response(row, viewer)

    if not result.is_mine:  # 내 글을 내가 보는 건 안 셈
        # pull_count = pull_count + 1 을 DB에서 바로 계산 -> 동시에 여러 명이 뽑아도 숫자가 안 꼬임
        # (파이썬에서 읽고 +1 해서 저장하면, 두 명이 동시에 읽었을 때 1만 올라가는 문제 생김)
        result.pull_count = await db.scalar(
            update(Post)
            .where(Post.id == post_id)
            .values(pull_count=Post.pull_count + 1)
            .returning(Post.pull_count)
            .execution_options(synchronize_session=False)
        )
        await db.commit()
    return result


# 작성/수정/삭제


async def create_post(db: AsyncSession, user: User, form: PostCreateForm) -> PostResponse:
    image_url = None
    if form.image is not None and form.image.filename:  # Swagger에서 파일 칸 비워 보내면 filename이 "" -> 사진 없음으로
        image_url = await image_storage.save(form.image)

    # image(파일 객체)는 빼고 나머지 값만 Post에 넣음. DB에는 파일 대신 image_url 저장
    post = Post(author_id=user.id, image_url=image_url, **form.model_dump(exclude={"image"}))
    db.add(post)
    try:
        await db.commit()
    except Exception:
        # DB 저장 실패하면 이미 저장한 사진도 지움 -> 주인 없는 파일 안 남게
        if image_url:
            await image_storage.delete(image_url)
        raise

    feed_cache.clear()  # 새 티켓 걸림 -> 캐시된 피드는 옛날 것
    return _to_response(await _fetch_one(db, post.id, user), user)


async def _get_my_post(db: AsyncSession, post_id: int, user: User) -> Post:
    # 1. 볼 수 없는 글이면 404 (존재 숨김)
    # 2. 볼 수는 있는데 내 글이 아니면 403 (권한 없음)
    post = await get_visible_post(db, post_id, user)
    if post.author_id != user.id:
        raise Forbidden("작성자만 수정·삭제할 수 있습니다.")
    return post


async def update_post(db: AsyncSession, post_id: int, user: User, data: PostUpdate) -> PostResponse:
    post = await _get_my_post(db, post_id, user)
    # exclude_unset: 요청에 실제로 보낸 필드만 꺼냄 -> 안 보낸 필드는 그대로 둠
    for field, value in data.model_dump(exclude_unset=True).items():
        if value is not None:
            setattr(post, field, value)
    await db.commit()
    feed_cache.clear()
    return _to_response(await _fetch_one(db, post_id, user), user)


async def delete_post(db: AsyncSession, post_id: int, user: User) -> None:
    post = await _get_my_post(db, post_id, user)
    image_url = post.image_url
    await db.delete(post)  # 댓글, 좋아요는 DB의 ON DELETE CASCADE로 같이 지워짐
    await db.commit()
    if image_url:
        await image_storage.delete(image_url)  # DB에서 지운 뒤에 파일도 지움
    feed_cache.clear()
