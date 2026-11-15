from datetime import UTC, datetime, timedelta

import bcrypt
import jwt

from app.core.config import settings
from app.core.exceptions import TokenExpired, Unauthorized


# 해싱: 되돌릴 수 없는 값으로 바꿔 저장 → DB가 털려도 원래 비밀번호를 알 수 없음


def hash_password(password: str) -> str:
    # gensalt(): 랜덤 salt 생성 → 같은 비밀번호도 매번 다른 해시가 나옴 (salt는 해시 안에 같이 저장됨)
    # bcrypt는 bytes를 다루므로 넣을 때 encode(), DB에 저장할 땐 decode()로 다시 문자열로
    return bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()


def verify_password(password: str, hashed: str) -> bool:
    # 입력값을 저장된 해시 안의 salt로 다시 해싱해서 같은지만 비교 (원문으로 되돌리지 않음)
    return bcrypt.checkpw(password.encode(), hashed.encode())


# JWT (로그인 출입증/상품권!)
# 내용(payload)은 누구나 읽을 수 있음 → 비밀번호·이메일 같은 정보는 넣지 않는다
# 서명은 SECRET_KEY로 만듦 → 키를 모르면 내용을 바꿔 위조할 수 없음


def create_access_token(user_id: int) -> str:
    now = datetime.now(UTC)  # 서버 시간대와 상관없이 UTC 기준으로
    payload = {
        "sub": str(user_id),  # subject: 토큰 주인(유저 id). JWT 규칙상 문자열로 넣어야 함
        "iat": now,  # issued at: 발급 시각
        "exp": now + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES),  # expiration: 만료 시각
    }
    return jwt.encode(payload, settings.SECRET_KEY, algorithm=settings.JWT_ALGORITHM)  # 내용 + 서명 → 토큰 문자열


def decode_access_token(token: str) -> int:
    """토큰을 검증하고 유저 id를 돌려준다. 문제가 있으면 우리 예외(401)로 바꿔서 던진다."""
    try:
        # decode가 서명 검증 + 만료 검사를 알아서 해 줌. 문제가 있으면 예외 발생
        payload = jwt.decode(
            token,
            settings.SECRET_KEY,
            algorithms=[settings.JWT_ALGORITHM],  # 허용할 알고리즘을 명시 (다른 알고리즘으로 위조한 토큰 거절)
            options={"require": ["exp", "sub"]},  # 만료 시각·주인이 없는 토큰은 거절
        )
        return int(payload["sub"])  # 문자열 "1" → 숫자 1
    except jwt.ExpiredSignatureError:  # 만료된 토큰
        raise TokenExpired()  # → 401 TOKEN_EXPIRED (프론트는 이 코드면 다시 로그인 화면으로)
    except (jwt.InvalidTokenError, ValueError):  # 서명 틀림, 형식 이상함, sub가 숫자가 아님
        raise Unauthorized("유효하지 않은 토큰입니다.")  # → 401 UNAUTHORIZED
