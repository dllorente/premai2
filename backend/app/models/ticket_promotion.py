from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, String, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class TicketPromotion(Base):
    __tablename__ = "ticket_promotions"

    id: Mapped[int] = mapped_column(primary_key=True)
    ticket_id: Mapped[int] = mapped_column(ForeignKey("tickets.id"), nullable=False, index=True)
    promotion_id: Mapped[int] = mapped_column(
        ForeignKey("promotions.id"), nullable=False, index=True
    )
    confidence: Mapped[str | None] = mapped_column(String(20))  # high | medium | low
    matched_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    ticket: Mapped["Ticket"] = relationship(back_populates="promotions")  # noqa: F821
    promotion: Mapped["Promotion"] = relationship(back_populates="ticket_matches")  # noqa: F821
