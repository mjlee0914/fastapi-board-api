from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    APP_NAME: str = "What's in my cart? API"
    DEBUG: bool = False

    DATABASE_URL: str

    SECRET_KEY: str
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60

    # 이미지 업로드
    UPLOAD_DIR: str = "uploads"  # 사진 저장 폴더 (나중에 S3로 바꾸면 안 씀)
    MAX_IMAGE_SIZE_MB: int = 5  # 5MB 넘으면 거절

    # CORS: 요청 허용할 프론트 주소 목록. ["*"] 이면 전부 허용
    # .env 에서는 JSON 형식으로 ex) CORS_ORIGINS=["http://localhost:5173"]
    CORS_ORIGINS: list[str] = ["*"]

    # 비회원 피드 캐시 유지 시간(초)
    FEED_CACHE_TTL_SECONDS: int = 30

settings = Settings()