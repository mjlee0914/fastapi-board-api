from collections.abc import AsyncGenerator

from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from app.core.config import settings

engine = create_async_engine(settings.DATABASE_URL, echo=settings.DEBUG, pool_pre_ping=True)

AsyncSessionLocal = async_sessionmaker(engine, expire_on_commit=False)


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """요청마다 DB 세션을 하나 열고, 요청이 끝나면 닫는다 (의존성 주입용)."""
    async with AsyncSessionLocal() as session:
        yield session
