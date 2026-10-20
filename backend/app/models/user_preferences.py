from __future__ import annotations

from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import JSON, BigInteger, Boolean, DateTime, ForeignKey, Integer, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base

if TYPE_CHECKING:
    from app.models.user import User


class UserPreferences(Base):
    __tablename__ = "user_preferences"

    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), primary_key=True
    )
    # PromoType values the user cares about; empty list = all types
    promo_types: Mapped[list[str]] = mapped_column(JSON, nullable=False, default=list)
    # Brand names the user follows; empty list = all brands
    brands: Mapped[list[str]] = mapped_column(JSON, nullable=False, default=list)

    email_digest: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    # Local hour (Europe/Madrid) for the daily digest
    digest_hour: Mapped[int] = mapped_column(Integer, nullable=False, default=8)
    # Set when the user links the Telegram bot (Sprint 5.8)
    telegram_chat_id: Mapped[int | None] = mapped_column(BigInteger, unique=True, nullable=True)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    user: Mapped[User] = relationship(back_populates="preferences")
