from typing import Any


class AppException(Exception):
    """모든 커스텀 에러의 부모, 에러 양식지"""

    status_code: int = 400
    code: str = "BAD_REQUEST"
    message: str = "잘못된 요청입니다."

    def __init__(self, message: str | None = None, details: Any = None):
        self.message = message or self.message
        self.details = details
        super().__init__(self.message)


class Unauthorized(AppException):
    status_code, code, message = 401, "UNAUTHORIZED", "로그인이 필요합니다."


class TokenExpired(AppException):
    status_code, code, message = 401, "TOKEN_EXPIRED", "토큰이 만료되었습니다. 다시 로그인해 주세요."


class InvalidCredentials(AppException):
    status_code, code, message = 401, "INVALID_CREDENTIALS", "이메일 또는 비밀번호가 올바르지 않습니다."


class Forbidden(AppException):
    status_code, code, message = 403, "FORBIDDEN", "권한이 없습니다."


class PostNotFound(AppException):
    status_code, code, message = 404, "POST_NOT_FOUND", "게시글을 찾을 수 없습니다."


class EmailAlreadyExists(AppException):
    status_code, code, message = 409, "EMAIL_ALREADY_EXISTS", "이미 가입된 이메일입니다."


class NicknameAlreadyExists(AppException):
    status_code, code, message = 409, "NICKNAME_ALREADY_EXISTS", "이미 사용 중인 닉네임입니다."

class ValidationFailed(AppException):
    status_code, code, message = 422, "VALIDATION_ERROR", "입력값이 올바르지 않습니다."
