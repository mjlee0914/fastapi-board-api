from datetime import datetime

from pydantic import BaseModel, Field, field_validator


class CommentCreate(BaseModel):
    content: str = Field(min_length=1, max_length=500, examples=["와 맛있겠다"])

    @field_validator("content")
    @classmethod
    def not_blank(cls, v: str) -> str:
        v = v.strip()
        if not v:
            raise ValueError("공백만 입력할 수 없습니다.")
        return v


class CommentResponse(BaseModel):
    id: int
    content: str
    author_label: str = Field(description='익명 번호. 글 작성자는 "글쓴이", 나머지는 처음 댓글 단 순서대로 "익명1", "익명2"...')
    is_mine: bool = Field(description="내 댓글인지 -> 삭제 버튼 표시용")
    created_at: datetime
