from datetime import datetime
from typing import TYPE_CHECKING   

from sqlalchemy import DateTime, String, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base

if TYPE_CHECKING: 
    # 타입 표시용으로만 import, 실제 실행시에는 x -> 순환 import 회피 장치
    # 실행할 때 항상 False임. -> if 안은 실행 x
    # 그러나 에디터는 true로 보고 안을 읽는다 -> post.author.까지 치면 nickname, email 자동완성 뜸
    from app.models.post import Post

class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(primary_key=True)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True)
    nickname: Mapped[str] = mapped_column(String(20), unique=True, index=True)
    hashed_password: Mapped[str] = mapped_column(String(255)) # 비번 원문 저장 절대 x. 해시값만 저장 가능
    profile_image_url: Mapped[str | None] = mapped_column(String(500))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now()) # 값을 안넣으면 DB가 현재 시각으로 넣어줌

    # 실행시 Post가 실제로 import 되지 않았음 -> 따옴표 없이 쓰면 NameError
    # 대신 문자열로 써서 넘어가기
    # 나중에 configure_mappers() 실행할 때 SQLAlchemy가 Base에서 찾아서 진짜 클래스와 연결함
    posts: Mapped[list["Post"]] = relationship(back_populates="author")  