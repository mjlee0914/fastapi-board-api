from typing import Generic, TypeVar

from fastapi import Query
from pydantic import BaseModel, Field

T = TypeVar("T")


# 목록 응답 모양 통일: {"items": [...], "page": 1, "size": 20, "total": 123}
# Generic[T]: 안에 들어가는 항목 타입만 바꿔 끼움 ex) Page[PostResponse], Page[CommentResponse]
class Page(BaseModel, Generic[T]):
    items: list[T]
    page: int = Field(description="현재 페이지 (1부터)")
    size: int = Field(description="한 페이지 개수")
    total: int = Field(description="전체 개수 -> 프론트가 전체 페이지 수 계산할 때 씀")


# 페이지네이션 파라미터 (?page=1&size=20)
# 목록 API마다 page, size를 반복해서 쓰지 않게 하나로 묶음 -> deps.py의 Pagination으로 주입
class PageParams:
    def __init__(
        self,
        page: int = Query(1, ge=1, description="페이지 번호 (1부터)"),
        size: int = Query(20, ge=1, le=100, description="한 페이지 개수 (최대 100)"),
    ):
        self.page = page
        self.size = size

    @property
    def offset(self) -> int:
        # 몇 개 건너뛸지 ex) page=3, size=20 -> 40개 건너뛰고 41번째부터
        return (self.page - 1) * self.size
