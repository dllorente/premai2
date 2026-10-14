from __future__ import annotations

from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import Boolean, DateTime, Integer, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base

if TYPE_CHECKING:
    from app.models.promotion import Promotion


class PromoSource(Base):
    __tablename__ = "promo_sources"

    id: Mapped[int] = mapped_column(primary_key=True)
    url: Mapped[str] = mapped_column(String(1000), unique=True, nullable=False)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    # aggregator | brand_direct | brand_platform
    source_type: Mapped[str] = mapped_column(String(50), nullable=False)
    brand: Mapped[str | None] = mapped_column(String(100), index=True)
    scrape_frequency_hours: Mapped[int] = mapped_column(Integer, default=24)
    last_scraped_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    notes: Mapped[str | None] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    promotions: Mapped[list[Promotion]] = relationship(back_populates="source")
