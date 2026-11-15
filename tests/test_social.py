"""친구 + 공개 범위, 댓글 익명 번호, 좋아요 테스트"""

from tests.conftest import make_friends, make_post, make_user


async def test_friends_only_post_visibility(client):
    author = await make_user(client, "지우")
    friend = await make_user(client, "민수")
    stranger = await make_user(client, "철수")
    post = await make_post(client, author, "FRIENDS")

    # 친구 되기 전: 비회원, 다른 회원 모두 404 (존재 자체를 숨김)
    assert (await client.get(f"/posts/{post['id']}")).status_code == 404
    assert (await client.get(f"/posts/{post['id']}", headers=friend)).status_code == 404
    assert (await client.get("/posts")).json()["total"] == 0

    await make_friends(client, friend, author, "지우")

    # 친구는 볼 수 있고, FRIENDS 글이라 닉네임이 보임
    r = await client.get(f"/posts/{post['id']}", headers=friend)
    assert r.status_code == 200
    assert r.json()["author"]["nickname"] == "지우"
    assert (await client.get("/posts", headers=friend)).json()["total"] == 1

    # 친구 아닌 사람은 여전히 못 봄 + 댓글/좋아요도 불가
    assert (await client.get(f"/posts/{post['id']}", headers=stranger)).status_code == 404
    r = await client.post(f"/posts/{post['id']}/comments", json={"content": "몰래"}, headers=stranger)
    assert r.status_code == 404
    assert (await client.post(f"/posts/{post['id']}/likes", headers=stranger)).status_code == 404

    # 친구 삭제하면 다시 못 봄
    assert (await client.delete("/friends/지우", headers=friend)).status_code == 204
    assert (await client.get(f"/posts/{post['id']}", headers=friend)).status_code == 404


async def test_friend_request_rules(client):
    a = await make_user(client, "지우")
    b = await make_user(client, "민수")

    r = await client.post("/friends/requests", json={"nickname": "지우"}, headers=a)
    assert r.json()["error"]["code"] == "CANNOT_FRIEND_SELF"
    r = await client.post("/friends/requests", json={"nickname": "없는사람"}, headers=a)
    assert r.json()["error"]["code"] == "USER_NOT_FOUND"

    r = await client.post("/friends/requests", json={"nickname": "민수"}, headers=a)
    request_id = r.json()["id"]
    # 반대 방향 중복 요청 x
    r = await client.post("/friends/requests", json={"nickname": "지우"}, headers=b)
    assert r.json()["error"]["code"] == "FRIEND_REQUEST_EXISTS"
    # 보낸 사람이 직접 수락 x -> 받은 사람만
    r = await client.patch(f"/friends/requests/{request_id}", json={"status": "ACCEPTED"}, headers=a)
    assert r.status_code == 403

    received = (await client.get("/friends/requests", params={"type": "received"}, headers=b)).json()
    assert [x["nickname"] for x in received["items"]] == ["지우"]

    await client.patch(f"/friends/requests/{request_id}", json={"status": "ACCEPTED"}, headers=b)
    r = await client.patch(f"/friends/requests/{request_id}", json={"status": "REJECTED"}, headers=b)
    assert r.json()["error"]["code"] == "FRIEND_REQUEST_ALREADY_HANDLED"
    assert [f["nickname"] for f in (await client.get("/friends", headers=a)).json()["items"]] == ["민수"]


async def test_comment_anonymous_labels(client):
    author = await make_user(client, "지우")
    c1 = await make_user(client, "민수")
    c2 = await make_user(client, "철수")
    post = await make_post(client, author)

    await client.post(f"/posts/{post['id']}/comments", json={"content": "첫 댓글"}, headers=c1)
    await client.post(f"/posts/{post['id']}/comments", json={"content": "작성자 답글"}, headers=author)
    await client.post(f"/posts/{post['id']}/comments", json={"content": "두번째 사람"}, headers=c2)
    await client.post(f"/posts/{post['id']}/comments", json={"content": "또 씀"}, headers=c1)

    r = await client.get(f"/posts/{post['id']}/comments", headers=c1)
    items = r.json()["items"]
    assert [c["author_label"] for c in items] == ["익명1", "글쓴이", "익명2", "익명1"]  # 같은 사람은 같은 번호
    assert [c["is_mine"] for c in items] == [True, False, False, True]
    assert "nickname" not in items[0]  # 닉네임 노출 x

    # 남의 댓글 삭제 x, 내 댓글 삭제 o
    assert (await client.delete(f"/comments/{items[1]['id']}", headers=c1)).status_code == 403
    assert (await client.delete(f"/comments/{items[0]['id']}", headers=c1)).status_code == 204


async def test_like_once(client):
    author = await make_user(client, "지우")
    other = await make_user(client, "민수")
    post = await make_post(client, author)

    r = await client.post(f"/posts/{post['id']}/likes", headers=other)
    assert r.status_code == 201 and r.json()["like_count"] == 1
    r = await client.post(f"/posts/{post['id']}/likes", headers=other)  # 두 번 담기 x
    assert r.status_code == 409 and r.json()["error"]["code"] == "ALREADY_LIKED"

    r = await client.get(f"/posts/{post['id']}", headers=other)
    assert r.json()["liked_by_me"] is True and r.json()["like_count"] == 1

    assert (await client.delete(f"/posts/{post['id']}/likes", headers=other)).status_code == 204
    assert (await client.delete(f"/posts/{post['id']}/likes", headers=other)).status_code == 404


async def test_delete_post_cascades(client):
    author = await make_user(client, "지우")
    other = await make_user(client, "민수")
    post = await make_post(client, author)
    await client.post(f"/posts/{post['id']}/comments", json={"content": "댓글"}, headers=other)
    await client.post(f"/posts/{post['id']}/likes", headers=other)

    assert (await client.delete(f"/posts/{post['id']}", headers=author)).status_code == 204
    # 글이 지워지면 댓글 목록도 404 (댓글, 좋아요는 DB CASCADE로 같이 삭제)
    assert (await client.get(f"/posts/{post['id']}/comments")).status_code == 404
