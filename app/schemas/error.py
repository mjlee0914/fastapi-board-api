from typing import Any

from pydantic import BaseModel

from app.core.exceptions import AppException


class ErrorDetail(BaseModel):
    code: str
    message: str
    details: Any | None = None


class ErrorResponse(BaseModel):
    error: ErrorDetail


def error_responses(*errors: type[AppException]) -> dict:
    """예외 클래스들을 받아서 라우트의 responses= 에 넣을 dict를 만든다."""
    result: dict = {}
    for e in errors:
        entry = result.setdefault(
            e.status_code,
            {"model": ErrorResponse, "content": {"application/json": {"examples": {}}}},
        )
        entry["content"]["application/json"]["examples"][e.code] = {
            "summary": e.message,
            "value": {"error": {"code": e.code, "message": e.message, "details": None}},
        }
    return result
