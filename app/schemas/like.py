from pydantic import BaseModel, Field


class LikeResponse(BaseModel):
    post_id: int
    liked: bool = Field(description="지금 내가 담은 상태인지")
    like_count: int = Field(description="이 글의 전체 담기 수 -> 프론트가 숫자 바로 갱신")
