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


# 5~7단계에서 추가한 에러들


class CommentNotFound(AppException):
    status_code, code, message = 404, "COMMENT_NOT_FOUND", "댓글을 찾을 수 없습니다."


class UserNotFound(AppException):
    status_code, code, message = 404, "USER_NOT_FOUND", "사용자를 찾을 수 없습니다."


class LikeNotFound(AppException):
    status_code, code, message = 404, "LIKE_NOT_FOUND", "담지 않은 글입니다."


class FriendRequestNotFound(AppException):
    status_code, code, message = 404, "FRIEND_REQUEST_NOT_FOUND", "친구 요청을 찾을 수 없습니다."


class NotFriends(AppException):
    status_code, code, message = 404, "NOT_FRIENDS", "친구 관계가 아닙니다."


class AlreadyLiked(AppException):
    status_code, code, message = 409, "ALREADY_LIKED", "이미 담은 글입니다."


class AlreadyFriends(AppException):
    status_code, code, message = 409, "ALREADY_FRIENDS", "이미 친구입니다."


class FriendRequestExists(AppException):
    status_code, code, message = 409, "FRIEND_REQUEST_EXISTS", "이미 친구 요청이 있습니다."


class CannotFriendSelf(AppException):
    status_code, code, message = 400, "CANNOT_FRIEND_SELF", "자기 자신에게 친구 요청을 보낼 수 없습니다."


class FriendRequestAlreadyHandled(AppException):
    status_code, code, message = 400, "FRIEND_REQUEST_ALREADY_HANDLED", "이미 처리된 친구 요청입니다."


class InvalidImage(AppException):
    status_code, code, message = 400, "INVALID_IMAGE", "jpg, png, webp 이미지(5MB 이하)만 올릴 수 있습니다."
