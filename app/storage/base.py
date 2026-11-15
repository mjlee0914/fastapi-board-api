from typing import Protocol

from fastapi import UploadFile


# 이미지 저장소의 "약속(인터페이스)"
# 서비스는 이 약속(save, delete)만 보고 씀 -> 로컬이든 S3든 상관 x
# 나중에 S3로 바꿀 때 S3ImageStorage 만들어서 갈아끼우기만 하면 됨 (서비스 코드는 안 바꿈)
class ImageStorage(Protocol):
    async def save(self, file: UploadFile) -> str:
        """이미지를 저장하고 접근 가능한 URL을 돌려줌"""
        ...

    async def delete(self, url: str) -> None:
        """URL에 해당하는 이미지를 지움"""
        ...
