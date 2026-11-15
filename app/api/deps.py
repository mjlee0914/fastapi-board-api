from typing import Annotated

from fastapi import Depends
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import Unauthorized
from app.core.security import decode_access_token
from app.db.session import get_db
from app.models import User
from app.schemas.common import PageParams

bearer_scheme = HTTPBearer(auto_error=False, description="로그인 응답의 access_token을 붙여넣기")

DbSession = Annotated[AsyncSession, Depends(get_db)]

# 피드, 글 상세 등 비회원도 허용하는 곳에 사용
async def get_optional_user(
    db: DbSession,
    credentials: Annotated[HTTPAuthorizationCredentials | None, Depends(bearer_scheme)],
) -> User | None:
    if credentials is None:
        return None
    user_id = decode_access_token(credentials.credentials)
    user = await db.get(User, user_id)
    if user is None:
        raise Unauthorized("유효하지 않은 토큰입니다.")
    return user

# 글쓰기, 내 정보 등 로그인 필수인 곳에 사용
async def get_current_user(user: Annotated[User | None, Depends(get_optional_user)]) -> User:
    if user is None:
        raise Unauthorized()
    return user


CurrentUser = Annotated[User, Depends(get_current_user)]
OptionalUser = Annotated[User | None, Depends(get_optional_user)]



# 페이지네이션 (?page=1&size=20). PageParams는 schemas/common.py에 있음
Pagination = Annotated[PageParams, Depends()]
