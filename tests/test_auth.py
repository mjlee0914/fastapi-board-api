"""인증·인가 + 에러 스키마 테스트"""

from datetime import UTC, datetime, timedelta

import jwt

from app.core.config import settings
from tests.conftest import make_user


async def test_signup_login_me(client):
    headers = await make_user(client, "지우")
    r = await client.get("/users/me", headers=headers)
    assert r.status_code == 200
    body = r.json()
    assert body["nickname"] == "지우"
    assert "hashed_password" not in body  # 비밀번호 해시는 절대 응답에 x


async def test_duplicate_email_409(client):
    await make_user(client, "지우")
    r = await client.post(
        "/auth/signup", json={"email": "지우@example.com", "password": "password123", "nickname": "다른닉"}
    )
    assert r.status_code == 409
    assert r.json()["error"]["code"] == "EMAIL_ALREADY_EXISTS"


async def test_validation_error_has_standard_shape(client):
    r = await client.post("/auth/signup", json={"email": "이상한메일", "password": "abcdefgh", "nickname": "a"})
    assert r.status_code == 422
    error = r.json()["error"]  # 모든 에러가 {"error": {...}} 모양인지
    assert error["code"] == "VALIDATION_ERROR"
    fields = {d["field"] for d in error["details"]}
    assert fields == {"email", "password", "nickname"}  # 틀린 필드 3개 다 알려 줌


async def test_wrong_password_401(client):
    await make_user(client, "지우")
    r = await client.post("/auth/login", json={"email": "지우@example.com", "password": "wrong1234"})
    assert r.status_code == 401
    assert r.json()["error"]["code"] == "INVALID_CREDENTIALS"


async def test_no_token_401(client):
    r = await client.get("/users/me")
    assert r.status_code == 401
    assert r.json()["error"]["code"] == "UNAUTHORIZED"


async def test_expired_token_401(client):
    await make_user(client, "지우")
    # 1분 전에 만료된 토큰을 직접 만들어서 보냄
    expired = jwt.encode(
        {"sub": "1", "exp": datetime.now(UTC) - timedelta(minutes=1)}, settings.SECRET_KEY, algorithm="HS256"
    )
    r = await client.get("/users/me", headers={"Authorization": f"Bearer {expired}"})
    assert r.status_code == 401
    assert r.json()["error"]["code"] == "TOKEN_EXPIRED"


async def test_forged_token_401(client):
    # 다른 키로 서명한 토큰 (위조)
    forged = jwt.encode({"sub": "1", "exp": datetime.now(UTC) + timedelta(minutes=5)}, "wrong-key-" * 4, algorithm="HS256")
    r = await client.get("/users/me", headers={"Authorization": f"Bearer {forged}"})
    assert r.status_code == 401
    assert r.json()["error"]["code"] == "UNAUTHORIZED"
