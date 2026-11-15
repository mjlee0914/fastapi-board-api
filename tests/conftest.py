"""테스트 공통 설정

- 진짜 DB(board)가 아니라 테스트 전용 DB(board_test)를 씀 -> 개발 데이터가 안 지워짐
- 테스트마다 테이블을 비워서 서로 영향 x
- 실제 서버를 띄우지 않고 httpx로 앱을 바로 호출 (빠름)
"""

import os
import tempfile

# 앱을 import 하기 "전에" 환경변수를 바꿔야 함 -> settings가 import 될 때 값을 읽기 때문
# (환경변수가 .env 보다 우선)
os.environ["DATABASE_URL"] = os.getenv(
    "TEST_DATABASE_URL", "postgresql+asyncpg://board:board1234@localhost:5433/board_test"
)
os.environ["UPLOAD_DIR"] = tempfile.mkdtemp()  # 테스트 사진은 임시 폴더에

import asyncpg  # noqa: E402
import pytest  # noqa: E402
import pytest_asyncio  # noqa: E402
from httpx import ASGITransport, AsyncClient  # noqa: E402
from sqlalchemy import text  # noqa: E402

from app.core.cache import feed_cache  # noqa: E402
from app.core.config import settings  # noqa: E402
from app.db.base import Base  # noqa: E402
from app.db.session import engine  # noqa: E402
from app.main import app  # noqa: E402


def pytest_collection_modifyitems(items):
    # 모든 테스트를 같은 이벤트 루프에서 실행 (DB 연결을 테스트끼리 같이 쓰려면 필요)
    marker = pytest.mark.asyncio(loop_scope="session")
    for item in items:
        if pytest_asyncio.is_async_test(item):
            item.add_marker(marker, append=False)


@pytest_asyncio.fixture(scope="session", autouse=True)
async def setup_database():
    # board_test DB가 없으면 만들기 (postgres 기본 DB에 접속해서 CREATE DATABASE)
    base, db_name = settings.DATABASE_URL.replace("+asyncpg", "").rsplit("/", 1)
    conn = await asyncpg.connect(f"{base}/postgres")
    if not await conn.fetchval("SELECT 1 FROM pg_database WHERE datname = $1", db_name):
        await conn.execute(f'CREATE DATABASE "{db_name}"')
    await conn.close()

    # 테이블 새로 만들기 (테스트는 Alembic 대신 모델에서 바로 생성)
    async with engine.begin() as c:
        await c.run_sync(Base.metadata.drop_all)
        await c.run_sync(Base.metadata.create_all)
    yield
    await engine.dispose()


@pytest_asyncio.fixture(autouse=True)
async def clean_tables():
    # 테스트 시작 전에 모든 테이블 비우기 + id 1부터 다시
    async with engine.begin() as c:
        await c.execute(text("TRUNCATE users, posts, comments, likes, friendships RESTART IDENTITY CASCADE"))
    feed_cache.clear()
    yield


@pytest_asyncio.fixture
async def client():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as c:
        yield c


async def make_user(client: AsyncClient, nickname: str) -> dict:
    """가입 + 로그인 -> 인증 헤더 돌려줌"""
    email = f"{nickname}@example.com"
    r = await client.post("/auth/signup", json={"email": email, "password": "password123", "nickname": nickname})
    assert r.status_code == 201, r.text
    r = await client.post("/auth/login", json={"email": email, "password": "password123"})
    return {"Authorization": f"Bearer {r.json()['access_token']}"}


async def make_post(client: AsyncClient, headers: dict, visibility: str = "PUBLIC", **extra) -> dict:
    data = {"title": "오늘 점심", "content": "김치찌개", "category": "LUNCH", "visibility": visibility, **extra}
    r = await client.post("/posts", data=data, headers=headers)
    assert r.status_code == 201, r.text
    return r.json()


async def make_friends(client: AsyncClient, a: dict, b: dict, b_nickname: str) -> None:
    """a가 b에게 요청 -> b가 수락"""
    r = await client.post("/friends/requests", json={"nickname": b_nickname}, headers=a)
    assert r.status_code == 201, r.text
    r = await client.patch(f"/friends/requests/{r.json()['id']}", json={"status": "ACCEPTED"}, headers=b)
    assert r.status_code == 200, r.text
