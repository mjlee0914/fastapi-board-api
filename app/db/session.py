"""
DB 사용시 엔진, 세션, get_db가 필요함.
엔진: DB 연결을 관리함. 필요할 때 연결을 만들고, 다 쓴 연결은 커넥션 풀에 모아 뒀다가 재사용함
세션: 요청 하나 처리하는 동안 쓰는 작업 단위. 조회, 추가, 커밋을 한다.
get_db: 요청 들어옴 -> 세션 하나 열어줌 -> 요청 끝 -> 세션 닫음
"""

from collections.abc import AsyncGenerator

from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from app.core.config import settings

# 파일이 import 되면 딱 한번 실행됨
# 앱이 켜져 있는 동안 계속 이 엔진을 쓴다.
engine = create_async_engine(settings.DATABASE_URL, echo=settings.DEBUG, pool_pre_ping=True)

# 세션 만드는 틀
AsyncSessionLocal = async_sessionmaker(engine, expire_on_commit=False)

async def get_db() -> AsyncGenerator[AsyncSession, None]: # 내주는 값은 AsyncSession, 밖에서 다시 받는 값은 없다
    async with AsyncSessionLocal() as session: # 요청 들어오면 세션 열기, 세션 닫을 때 연결을 엔진(커넥션 풀)에 반납
        yield session # 라우트에 세션 넘겨지고 여기서 멈추고, 라우트 응답 끝나면 yield 다음으로 돌아와서 async with 블록이 끝나고 세션이 닫힘