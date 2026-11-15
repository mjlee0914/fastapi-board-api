from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import DateTime, Enum, ForeignKey, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base
from app.models.enums import Category, Visibility

if TYPE_CHECKING:
    from app.models.comment import Comment   
    from app.models.like import Like         
    from app.models.user import User


class Post(Base):
    __tablename__ = "posts"

    id: Mapped[int] = mapped_column(primary_key=True)
    author_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    title: Mapped[str] = mapped_column(String(50))
    content: Mapped[str] = mapped_column(Text)
    image_url: Mapped[str | None] = mapped_column(String(500))
    category: Mapped[Category] = mapped_column(Enum(Category, name="category"), index=True)
    visibility: Mapped[Visibility] = mapped_column(Enum(Visibility, name="visibility"), default=Visibility.PUBLIC)
    pull_count: Mapped[int] = mapped_column(default=0, server_default="0")  # 티켓이 뽑힌 횟수
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), index=True)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    # relatinoship : 객체에 바로 접근 가능, db에 컬럼 생성 x
    author: Mapped["User"] = relationship(back_populates="posts")
    comments: Mapped[list["Comment"]] = relationship(
        back_populates="post", cascade="all, delete-orphan", passive_deletes=True
    )
    likes: Mapped[list["Like"]] = relationship(
        back_populates="post", cascade="all, delete-orphan", passive_deletes=True
    )

