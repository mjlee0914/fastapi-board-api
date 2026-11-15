"""게시글 CRUD, 작성자 권한, 이미지 업로드, 티켓 기능, 캐시 테스트"""

from tests.conftest import make_post, make_user

PNG = b"\x89PNG\r\n\x1a\n" + b"\x00" * 100  # png 파일 시작 바이트 (매직 넘버) + 아무 데이터


async def test_create_post_requires_login(client):
    r = await client.post("/posts", data={"title": "t", "content": "c", "category": "LUNCH"})
    assert r.status_code == 401


async def test_create_with_image_and_serve(client):
    me = await make_user(client, "지우")
    files = {"image": ("cat.png", PNG, "image/png")}
    data = {"title": "고양이", "content": "귀여움", "category": "CAT"}
    r = await client.post("/posts", data=data, files=files, headers=me)
    assert r.status_code == 201, r.text
    url = r.json()["image_url"]
    assert url.startswith("/uploads/") and url.endswith(".png")
    assert "cat" not in url  # 파일명은 UUID로 새로 만듦 (사용자가 보낸 이름 x)
    assert (await client.get(url)).content == PNG  # 정적 파일로 서빙됨


async def test_invalid_image_400(client):
    me = await make_user(client, "지우")
    # content_type은 png라고 속였지만 내용은 텍스트
    files = {"image": ("evil.png", b"hello", "image/png")}
    r = await client.post("/posts", data={"title": "t", "content": "c", "category": "CAT"}, files=files, headers=me)
    assert r.status_code == 400
    assert r.json()["error"]["code"] == "INVALID_IMAGE"


async def test_only_author_can_update_delete(client):
    author = await make_user(client, "지우")
    other = await make_user(client, "민수")
    post = await make_post(client, author)

    # 남의 글 수정/삭제 -> 403
    r = await client.patch(f"/posts/{post['id']}", json={"title": "해킹"}, headers=other)
    assert r.status_code == 403
    assert r.json()["error"]["code"] == "FORBIDDEN"
    assert (await client.delete(f"/posts/{post['id']}", headers=other)).status_code == 403

    # 내 글 수정 -> 200, 보낸 값만 바뀜
    r = await client.patch(f"/posts/{post['id']}", json={"title": "수정됨"}, headers=author)
    assert r.status_code == 200
    assert r.json()["title"] == "수정됨" and r.json()["content"] == "김치찌개"

    # 내 글 삭제 -> 204, 그 뒤 조회하면 404
    assert (await client.delete(f"/posts/{post['id']}", headers=author)).status_code == 204
    r = await client.get(f"/posts/{post['id']}")
    assert r.status_code == 404
    assert r.json()["error"]["code"] == "POST_NOT_FOUND"


async def test_public_post_is_anonymous(client):
    me = await make_user(client, "지우")
    post = await make_post(client, me, "PUBLIC")
    assert post["author"] is None  # 전체 공개 글은 익명
    assert post["is_mine"] is True

    r = await client.get(f"/posts/{post['id']}")  # 비회원이 봄
    assert r.json()["author"] is None and r.json()["is_mine"] is False


async def test_pull_count_and_ticket_no(client):
    author = await make_user(client, "지우")
    other = await make_user(client, "민수")
    first = await make_post(client, author)
    second = await make_post(client, other)
    assert (first["ticket_no"], second["ticket_no"]) == (1, 2)  # 오늘 1번째, 2번째 티켓

    await client.get(f"/posts/{first['id']}", headers=author)  # 내가 내 글 보면 안 셈
    r = await client.get(f"/posts/{first['id']}", headers=other)  # 남이 조회 -> +1
    assert r.json()["pull_count"] == 1


async def test_feed_pagination_sort_and_my_cart(client):
    a = await make_user(client, "지우")
    b = await make_user(client, "민수")
    p1 = await make_post(client, a, category="LUNCH")
    p2 = await make_post(client, b, category="CAT")
    await client.post(f"/posts/{p1['id']}/likes", headers=b)

    r = await client.get("/posts", params={"size": 1})
    body = r.json()
    assert body["total"] == 2 and body["size"] == 1 and len(body["items"]) == 1

    r = await client.get("/posts", params={"sort": "popular"})
    assert r.json()["items"][0]["id"] == p1["id"]  # 좋아요 많은 글이 먼저

    r = await client.get("/posts", params={"category": "CAT", "today": True})
    assert [p["id"] for p in r.json()["items"]] == [p2["id"]]

    r = await client.get("/users/me/posts", headers=a)  # 내 카트
    assert [p["id"] for p in r.json()["items"]] == [p1["id"]]


async def test_feed_cache_and_process_time_header(client):
    me = await make_user(client, "지우")
    await make_post(client, me)

    r1 = await client.get("/posts")
    r2 = await client.get("/posts")
    assert r1.headers["X-Cache"] == "MISS" and r2.headers["X-Cache"] == "HIT"
    assert "X-Process-Time" in r1.headers  # 미들웨어가 처리 시간 헤더 붙임

    await make_post(client, me)  # 새 글 -> 캐시 비움
    r3 = await client.get("/posts")
    assert r3.headers["X-Cache"] == "MISS" and r3.json()["total"] == 2


async def test_feed_has_no_n_plus_1(client):
    """글이 많아져도 피드 쿼리 수가 늘지 않는지 (N+1 방지 확인)"""
    from sqlalchemy import event

    from app.db.session import engine
    from tests.conftest import make_friends

    me = await make_user(client, "지우")
    friend = await make_user(client, "민수")
    await make_friends(client, me, friend, "민수")

    count = 0

    def on_query(*args):
        nonlocal count
        count += 1

    async def feed_queries() -> int:
        nonlocal count
        count = 0
        event.listen(engine.sync_engine, "before_cursor_execute", on_query)
        try:
            r = await client.get("/posts", headers=me)  # 로그인 피드: 작성자 정보, 좋아요/댓글 수까지 포함
            assert r.status_code == 200
        finally:
            event.remove(engine.sync_engine, "before_cursor_execute", on_query)
        return count

    for _ in range(2):
        await make_post(client, friend, "FRIENDS")
    few = await feed_queries()
    for _ in range(8):
        await make_post(client, friend, "FRIENDS")
    many = await feed_queries()

    # 글 2개일 때와 10개일 때 쿼리 수가 같아야 함 (글마다 쿼리가 늘면 N+1)
    assert few == many, (few, many)
