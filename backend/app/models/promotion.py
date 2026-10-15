from __future__ import annotations

import enum
from datetime import date, datetime
from typing import TYPE_CHECKING

from sqlalchemy import Boolean, Date, DateTime, Enum, ForeignKey, Integer, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class PromoType(str, enum.Enum):
    social = "social"  # sorteo / RRSS — no requiere compra
    free = "free"  # reembolso 100% / muestra gratuita
    purchase = "purchase"  # cashback / descuento con ticket de compra


if TYPE_CHECKING:
    from app.models.promo_source import PromoSource
    from app.models.ticket_promotion import TicketPromotion


class Promotion(Base):
    __tablename__ = "promotions"

    id: Mapped[int] = mapped_column(primary_key=True)
    source_id: Mapped[int] = mapped_column(
        ForeignKey("promo_sources.id"), nullable=False, index=True
    )

    title: Mapped[str] = mapped_column(String(500), nullable=False)
    promo_type: Mapped[PromoType | None] = mapped_column(
        Enum(PromoType, name="promotype"), nullable=True, index=True
    )
    brand: Mapped[str | None] = mapped_column(String(100), index=True)
    description: Mapped[str | None] = mapped_column(Text)
    # What the user must buy/do: "Compra 2 productos Danone y sube el ticket"
    requirements: Mapped[str | None] = mapped_column(Text)
    # Direct URL to participate (may differ from source URL)
    participation_url: Mapped[str] = mapped_column(String(1000), nullable=False)
    prize_description: Mapped[str | None] = mapped_column(Text)
    legal_summary: Mapped[str | None] = mapped_column(Text)
    start_date: Mapped[date | None] = mapped_column(Date)
    end_date: Mapped[date | None] = mapped_column(Date)

    # Ticket upload required (True = needs physical receipt, False = code/form only)
    requires_ticket: Mapped[bool] = mapped_column(Boolean, default=True)
    tickets_required: Mapped[int | None] = mapped_column(Integer)

    is_active: Mapped[bool] = mapped_column(Boolean, default=True, index=True)
    # SHA256 of scraped content — skip re-processing if unchanged
    content_hash: Mapped[str | None] = mapped_column(String(64))
    # Raw JSON from Claude extraction
    raw_data: Mapped[str | None] = mapped_column(Text)

    scraped_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    source: Mapped[PromoSource] = relationship(back_populates="promotions")
    ticket_matches: Mapped[list[TicketPromotion]] = relationship(back_populates="promotion")
