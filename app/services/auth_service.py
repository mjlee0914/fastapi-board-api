from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import EmailAlreadyExists, InvalidCredentials, NicknameAlreadyExists
from app.core.security import hash_password, verify_password
from app.models import User
from app.schemas.user import LoginRequest, SignupRequest

# 서비스 = 일을 실제로 처리하는 곳 (DB 조회, 중복 확인, 저장, commit)
# 라우터는 DB를 직접 만지지 않고 여기 함수만 부른다


async def signup(db: AsyncSession, data: SignupRequest) -> User:
    # select(User.id).where(...) → SQL: SELECT id FROM users WHERE email = ...
    # db.scalar(): 결과의 첫 번째 값 하나만 꺼냄. 없으면 None → if 로 "있으면 중복" 판단
    if await db.scalar(select(User.id).where(User.email == data.email)):
        raise EmailAlreadyExists()  # 409 EMAIL_ALREADY_EXISTS
    if await db.scalar(select(User.id).where(User.nickname == data.nickname)):
        raise NicknameAlreadyExists()  # 409 NICKNAME_ALREADY_EXISTS

    # 비밀번호 원문은 저장하지 않고 해시만 저장
    user = User(email=data.email, nickname=data.nickname, hashed_password=hash_password(data.password))
    db.add(user)  # 1. 세션에 "저장할 거야"라고 올려 둠 (아직 DB에 안 들어감)
    await db.commit()  # 2. 진짜로 DB에 저장. 빼먹으면 저장 안 됨!
    await db.refresh(user)  # 3. DB가 만든 값(id, created_at)을 다시 읽어 옴
    return user


async def login(db: AsyncSession, data: LoginRequest) -> User:
    user = await db.scalar(select(User).where(User.email == data.email))  # 이메일로 유저 찾기 (없으면 None)
    # 이메일이 없든 비밀번호가 틀리든 같은 에러를 냄
    # → "없는 이메일"이라고 따로 알려 주면 남이 가입 여부를 알아낼 수 있어서
    if user is None or not verify_password(data.password, user.hashed_password):
        raise InvalidCredentials()  # 401 INVALID_CREDENTIALS
    return user
