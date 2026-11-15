from datetime import datetime

from fastapi import UploadFile
from pydantic import BaseModel, ConfigDict, Field, field_validator, model_validator

from app.models.enums import Category, Visibility


def _not_blank(v: str | None) -> str | None:
    # 앞뒤 공백 지우고, 공백만 있는 값은 거절 ex) "   " -> 에러
    if v is None:
        return v
    v = v.strip()
    if not v:
        raise ValueError("공백만 입력할 수 없습니다.")
    return v


# 요청 스키마


class PostCreateForm(BaseModel):
    """글 작성 폼. 사진을 같이 보내야 해서 JSON이 아니라 multipart/form-data로 받음"""

    title: str = Field(min_length=1, max_length=50, examples=["오늘 점심 김치찌개"])
    content: str = Field(min_length=1, max_length=1000, examples=["회사 앞 찌개집 최고"])
    category: Category = Field(examples=[Category.LUNCH])
    visibility: Visibility = Field(Visibility.PUBLIC, description="PUBLIC: 전체 공개(익명) / FRIENDS: 친구만")
    # 사진도 폼 안에 같이 받음 (선택, 안 보내면 None). 형식/크기 검사는 storage에서 함
    # 타입을 UploadFile | None 으로 쓰면 Swagger에 파일 선택 버튼이 안 나와서 UploadFile + 기본값 None 으로 씀
    image: UploadFile = Field(None, description="사진 (jpg/png/webp, 5MB 이하)")

    _strip = field_validator("title", "content")(_not_blank)


class PostUpdate(BaseModel):
    """글 수정. 바꾸고 싶은 값만 보내면 됨 (PATCH = 부분 수정)"""

    title: str | None = Field(None, min_length=1, max_length=50)
    content: str | None = Field(None, min_length=1, max_length=1000)
    category: Category | None = None
    visibility: Visibility | None = None

    _strip = field_validator("title", "content")(_not_blank)

    # 필드 하나가 아니라 "전체"를 보고 검사할 때 model_validator 씀
    @model_validator(mode="after")
    def at_least_one(self):
        if all(v is None for v in (self.title, self.content, self.category, self.visibility)):
            raise ValueError("수정할 값을 하나 이상 보내 주세요.")
        return self


# 응답 스키마


class AuthorInfo(BaseModel):
    """다른 사람에게 보이는 작성자 정보. 익명성 때문에 닉네임, 프사만 (id, email x)"""

    model_config = ConfigDict(from_attributes=True)

    nickname: str
    profile_image_url: str | None


class PostResponse(BaseModel):
    """티켓 하나"""

    id: int
    title: str
    content: str
    image_url: str | None
    category: Category
    visibility: Visibility
    author: AuthorInfo | None = Field(description="PUBLIC 글은 익명이라 null, FRIENDS 글은 친구끼리라 닉네임 공개")
    is_mine: bool = Field(description="내 글인지 -> 프론트가 수정/삭제 버튼 보여줄지 결정")
    ticket_no: int = Field(description="주문 번호. 그날(KST) 몇 번째로 걸린 티켓인지 ex) 5 -> #005")
    pull_count: int = Field(description="조회수 (다른 사람이 상세 조회한 횟수, 작성자 본인 조회는 제외)")
    like_count: int = Field(description="나도 담기 수")
    comment_count: int
    liked_by_me: bool = Field(description="내가 담았는지 (비회원은 항상 false)")
    created_at: datetime
    updated_at: datetime
