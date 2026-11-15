from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field, field_validator

from app.models.enums import FriendshipStatus


class FriendRequestCreate(BaseModel):
    # 익명성 때문에 user_id를 안 알려 줌 -> 친구 요청은 닉네임으로
    nickname: str = Field(min_length=2, max_length=20, examples=["민수"])

    @field_validator("nickname")
    @classmethod
    def strip(cls, v: str) -> str:
        return v.strip()


class FriendRequestUpdate(BaseModel):
    # 받은 사람은 수락 or 거절만 가능 (PENDING으로 되돌리기 x) -> Literal로 두 값만 허용
    status: Literal["ACCEPTED", "REJECTED"] = Field(examples=["ACCEPTED"])


class FriendRequestResponse(BaseModel):
    id: int = Field(description="요청 id -> 수락/거절할 때 씀")
    nickname: str = Field(description="상대방 닉네임 (받은 요청이면 보낸 사람, 보낸 요청이면 받은 사람)")
    profile_image_url: str | None
    status: FriendshipStatus
    created_at: datetime


class FriendResponse(BaseModel):
    nickname: str
    profile_image_url: str | None
