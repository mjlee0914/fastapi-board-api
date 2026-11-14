from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """.env 파일과 환경변수에서 설정값을 읽어온다."""

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    APP_NAME: str = "오늘 뭐 담았어? API"
    DEBUG: bool = False

    DATABASE_URL: str

    SECRET_KEY: str
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
