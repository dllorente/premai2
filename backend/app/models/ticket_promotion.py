from __future__ import annotations

from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import DateTime, ForeignKey, String, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base

if TYPE_CHECKING:
    from app.models.promotion import Promotion
    from app.models.ticket import Ticket


class TicketPromotion(Base):
    __tablename__ = "ticket_promotions"

    id: Mapped[int] = mapped_column(primary_key=True)
    ticket_id: Mapped[int] = mapped_column(ForeignKey("tickets.id"), nullable=False, index=True)
    promotion_id: Mapped[int] = mapped_column(
        ForeignKey("promotions.id"), nullable=False, index=True
    )
    confidence: Mapped[str | None] = mapped_column(String(20))  # high | medium | low
    matched_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    ticket: Mapped[Ticket] = relationship(back_populates="promotions")
    promotion: Mapped[Promotion] = relationship(back_populates="ticket_matches")
