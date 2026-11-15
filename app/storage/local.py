from pathlib import Path
from uuid import uuid4

from fastapi import UploadFile
from starlette.concurrency import run_in_threadpool

from app.core.config import settings
from app.core.exceptions import InvalidImage

# 허용하는 이미지 형식 -> 저장할 확장자
ALLOWED_TYPES = {"image/jpeg": ".jpg", "image/png": ".png", "image/webp": ".webp"}


def _looks_like_image(data: bytes) -> bool:
    # content_type은 클라이언트가 마음대로 보낼 수 있음 -> 파일 앞부분(매직 넘버)으로 진짜 이미지인지 한 번 더 확인
    # ex) txt 파일에 content_type만 image/png 붙여서 보내는 경우 막기
    return (
        data.startswith(b"\xff\xd8\xff")  # jpg
        or data.startswith(b"\x89PNG\r\n\x1a\n")  # png
        or (data[:4] == b"RIFF" and data[8:12] == b"WEBP")  # webp
    )


class LocalImageStorage:
    """uploads/ 폴더에 저장하는 저장소. main.py에서 /uploads 주소로 파일을 서빙함"""

    def __init__(self, base_dir: str, url_prefix: str = "/uploads"):
        self.base_dir = Path(base_dir)
        self.url_prefix = url_prefix
        self.max_bytes = settings.MAX_IMAGE_SIZE_MB * 1024 * 1024

    async def save(self, file: UploadFile) -> str:
        ext = ALLOWED_TYPES.get(file.content_type or "")
        if ext is None:
            raise InvalidImage()

        # 최대 크기 + 1바이트까지만 읽음 -> 그보다 길면 5MB 초과 (큰 파일을 끝까지 다 읽지 않음)
        data = await file.read(self.max_bytes + 1)
        if len(data) > self.max_bytes:
            raise InvalidImage(f"이미지는 {settings.MAX_IMAGE_SIZE_MB}MB 이하만 올릴 수 있습니다.")
        if not _looks_like_image(data):
            raise InvalidImage()

        # 파일명은 사용자가 보낸 이름 x, UUID로 새로 만듦
        # -> "../../etc/passwd" 같은 이름으로 다른 폴더에 쓰는 공격(경로 조작) 방지 + 이름 겹침 방지
        name = f"{uuid4().hex}{ext}"
        self.base_dir.mkdir(parents=True, exist_ok=True)
        # 파일 쓰기는 오래 걸릴 수 있음 -> 별도 스레드에서 실행해서 다른 요청을 막지 않게 함
        await run_in_threadpool((self.base_dir / name).write_bytes, data)
        return f"{self.url_prefix}/{name}"

    async def delete(self, url: str) -> None:
        if not url.startswith(f"{self.url_prefix}/"):
            return
        name = Path(url).name  # 파일 이름만 꺼냄 -> 경로 조작 방지
        await run_in_threadpool((self.base_dir / name).unlink, missing_ok=True)


# 앱 전체에서 이 저장소 하나를 같이 씀
image_storage = LocalImageStorage(settings.UPLOAD_DIR)
