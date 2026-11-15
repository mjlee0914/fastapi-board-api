import re
from datetime import datetime

from pydantic import BaseModel, ConfigDict, EmailStr, Field, field_validator

# 스키마 = API 입구의 검문소
# 요청이 라우터에 들어오기 전에 Pydantic이 형식을 검사하고, 틀리면 422 VALIDATION_ERROR로 돌려보낸다


# 요청 스키마
class SignupRequest(BaseModel):
    email: EmailStr = Field(examples=["jiwoo@example.com"])  # 이메일 형식이 아니면 거절 (email-validator 패키지)
    password: str = Field(min_length=8, max_length=64, examples=["password123"])  # 8~64자
    nickname: str = Field(min_length=2, max_length=20, examples=["지우"])  # 2~20자
    # examples: Swagger에서 Try it out 누르면 미리 채워지는 예시 값

    # 커스텀 검사: Field로 못 하는 규칙은 함수로 직접 쓴다
    @field_validator("password")  # password 필드를 검사할 때 이 함수도 실행
    @classmethod  # Pydantic 규칙. 그냥 이렇게 쓴다
    def check_password(cls, v: str) -> str:  # v: 들어온 값
        # 정규식: [A-Za-z] 영문 하나라도 있나, \d 숫자 하나라도 있나
        if not re.search(r"[A-Za-z]", v) or not re.search(r"\d", v):
            raise ValueError("비밀번호는 영문과 숫자를 모두 포함해야 합니다.")  # 이 메시지가 422 응답의 details에 들어감
        return v  # 통과하면 값을 그대로 돌려줌

    @field_validator("nickname")
    @classmethod
    def check_nickname(cls, v: str) -> str:
        v = v.strip()  # 앞뒤 공백 제거. "  지  " 처럼 공백으로 글자 수 채우는 걸 막음
        if len(v) < 2:
            raise ValueError("닉네임은 공백을 빼고 2자 이상이어야 합니다.")
        return v  # 다듬은 값을 돌려줌 → 저장되는 값도 공백이 지워진 값 (검사 + 값 다듬기)


class LoginRequest(BaseModel):
    email: EmailStr = Field(examples=["jiwoo@example.com"])
    password: str = Field(examples=["password123"])  # 로그인은 규칙 검사 없이 받기만 함 (틀리면 401로 처리)


# 응답 스키마
class TokenResponse(BaseModel):
    """로그인 성공 시 응답"""

    access_token: str  # JWT 토큰
    token_type: str = "bearer"  # 헤더에 "Authorization: Bearer <토큰>" 으로 붙여 보내라는 약속
    expires_in: int = Field(description="만료까지 남은 초")  # 프론트가 언제 다시 로그인시킬지 알 수 있게


class MeResponse(BaseModel):
    """내 정보 응답. 내 정보라서 id, email이 있어도 괜찮다 (다른 사람에게 보일 작성자 정보는 닉네임만, 5단계)"""

    # SQLAlchemy 객체(user.nickname 처럼 속성으로 읽는 것)를 그대로 받아서 변환 가능하게 함
    model_config = ConfigDict(from_attributes=True)

    id: int
    email: EmailStr
    nickname: str
    profile_image_url: str | None  # 프로필 사진은 없을 수 있음
    created_at: datetime
    # hashed_password는 일부러 없음 → User 객체를 통째로 반환해도 응답에서 자동으로 빠진다
