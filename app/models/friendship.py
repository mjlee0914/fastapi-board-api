from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import CheckConstraint, DateTime, Enum, ForeignKey, Index, func, text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base
from app.models.enums import FriendshipStatus

if TYPE_CHECKING:
    from app.models.user import User


class Friendship(Base):
    __tablename__ = "friendships"
    __table_args__ = (
        CheckConstraint("requester_id <> addressee_id", name="ck_friendship_not_self"),
        Index(
            "uq_friendship_pair",
            text("LEAST(requester_id, addressee_id)"),
            text("GREATEST(requester_id, addressee_id)"),
            unique=True,
        ),
    )

    id: Mapped[int] = mapped_column(primary_key=True)
    requester_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    addressee_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    status: Mapped[FriendshipStatus] = mapped_column(
        Enum(FriendshipStatus, name="friendship_status"), default=FriendshipStatus.PENDING
    )
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    requester: Mapped["User"] = relationship(foreign_keys=[requester_id])
    addressee: Mapped["User"] = relationship(foreign_keys=[addressee_id])
