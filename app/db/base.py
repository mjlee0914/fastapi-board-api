from sqlalchemy.orm import DeclarativeBase


class Base(DeclarativeBase):
    """모든 SQLAlchemy 모델이 상속받는 베이스 클래스."""
