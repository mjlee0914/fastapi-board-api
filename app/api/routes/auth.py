from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core import exceptions as exc
from app.core.config import settings
from app.core.security import create_access_token
from app.db.session import get_db
from app.schemas.error import error_responses
from app.schemas.user import LoginRequest, MeResponse, SignupRequest, TokenResponse
from app.services import auth_service

# 라우터 = 요청 받기 → 서비스에 넘기기 → 응답 돌려주기. DB는 직접 만지지 않는다
# prefix: 이 파일의 API 주소는 전부 /auth 로 시작
# tags: Swagger에서 Auth 그룹으로 묶어서 보여 줌
router = APIRouter(prefix="/auth", tags=["Auth"])


@router.post(
    "/signup",
    response_model=MeResponse,  # 응답을 MeResponse 모양으로 걸러냄 → hashed_password 자동으로 빠짐
    status_code=status.HTTP_201_CREATED,  # 새로 만들면 201 (REST 규칙)
    # summary, description, responses: Swagger 문서용
    summary="회원가입",
    description="이메일, 비밀번호(8자 이상, 영문+숫자), 닉네임(2~20자)으로 가입",
    responses=error_responses(exc.EmailAlreadyExists, exc.NicknameAlreadyExists, exc.ValidationFailed),  # 에러 예시
)
# data: SignupRequest → 요청 body를 스키마(검문소)에 통과시킴. 통과 못 하면 이 함수는 실행되지 않고 422
# db: Depends(get_db) → FastAPI가 세션을 열어서 넣어 줌 (의존성 주입)
async def signup(data: SignupRequest, db: AsyncSession = Depends(get_db)):
    return await auth_service.signup(db, data)  # 실제 일은 서비스가 함


@router.post(
    "/login",
    response_model=TokenResponse,  # 조회/처리 성공은 기본값 200
    summary="로그인 (JWT 발급)",
    description="성공하면 access_token 줌. 사용법: Swagger 오른쪽 위 **Authorize** 버튼에 토큰을 붙여넣기.",
    responses=error_responses(exc.InvalidCredentials, exc.ValidationFailed),
)
async def login(data: LoginRequest, db: AsyncSession = Depends(get_db)):
    user = await auth_service.login(db, data)  # 이메일/비밀번호 확인 (틀리면 여기서 401)
    return TokenResponse(
        access_token=create_access_token(user.id),  # 유저 id를 담은 JWT 발급
        expires_in=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,  # 분 → 초
    )
