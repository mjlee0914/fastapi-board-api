import time
from typing import Any, Protocol

from app.core.config import settings


# 캐시의 "약속(인터페이스)". 나중에 Redis로 바꿀 때 이 모양대로 RedisCache 만들어서 갈아끼우면 됨
class Cache(Protocol):
    def get(self, key: str) -> Any | None: ...
    def set(self, key: str, value: Any) -> None: ...
    def clear(self) -> None: ...


class TTLCache:
    """메모리에 잠깐 저장해 두는 캐시. ttl초가 지나면 없는 걸로 취급

    캐시: 같은 요청이 또 오면 DB까지 안 가고 저장해 둔 결과를 바로 돌려줌 -> 빠름, DB 부담 줄어듦
    주의) 서버 메모리에 저장 -> 서버를 여러 대 띄우면 서버마다 따로 저장됨 (그래서 실무에서는 Redis 씀)
    """

    def __init__(self, ttl_seconds: int):
        self.ttl = ttl_seconds
        self._store: dict[str, tuple[float, Any]] = {}  # key -> (만료 시각, 값)

    def get(self, key: str) -> Any | None:
        item = self._store.get(key)
        if item is None:
            return None
        expires_at, value = item
        if time.monotonic() > expires_at:  # 유효기간 지남 -> 지우고 없는 걸로
            del self._store[key]
            return None
        return value

    def set(self, key: str, value: Any) -> None:
        self._store[key] = (time.monotonic() + self.ttl, value)

    def clear(self) -> None:
        self._store.clear()


# 비회원 피드 캐시
# 비회원만 캐시하는 이유: 로그인하면 사람마다 보이는 글(친구 글)이 다름 -> 같이 쓸 수 없음
# 글 작성/수정/삭제, 좋아요, 댓글이 생기면 clear() -> 옛날 결과를 보여 주지 않게 함
feed_cache: Cache = TTLCache(ttl_seconds=settings.FEED_CACHE_TTL_SECONDS)
