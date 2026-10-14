from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import DateTime, ForeignKey, Numeric, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base

if TYPE_CHECKING:
    from app.models.ticket_feedback import TicketFeedback
    from app.models.ticket_promotion import TicketPromotion


class Ticket(Base):
    __tablename__ = "tickets"

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False, index=True)

    image_path: Mapped[str | None] = mapped_column(String(500))
    # pending → processing → valid | invalid
    status: Mapped[str] = mapped_column(String(50), default="pending", index=True)

    store: Mapped[str | None] = mapped_column(String(255))
    purchased_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    total_amount: Mapped[float | None] = mapped_column(Numeric(10, 2))
    ticket_number: Mapped[str | None] = mapped_column(String(100), index=True)

    # JSON arrays stored as text
    brands: Mapped[str | None] = mapped_column(Text)
    products: Mapped[str | None] = mapped_column(Text)
    raw_text: Mapped[str | None] = mapped_column(Text)

    ocr_provider: Mapped[str | None] = mapped_column(String(50))
    ocr_error: Mapped[str | None] = mapped_column(Text)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    promotions: Mapped[list["TicketPromotion"]] = relationship(back_populates="ticket")
    feedback: Mapped["TicketFeedback | None"] = relationship(back_populates="ticket", uselist=False)
