from __future__ import annotations

from datetime import date

from fastapi import APIRouter, Depends, Query
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.deps import get_current_user, get_db
from app.models.promotion import Promotion, PromoType
from app.models.user import User

router = APIRouter(prefix="/promos", tags=["promos"])


class PromoOut(BaseModel):
    id: int
    title: str
    brand: str | None
    description: str | None
    requirements: str | None
    participation_url: str
    prize_description: str | None
    start_date: date | None
    end_date: date | None
    requires_ticket: bool
    tickets_required: int | None
    is_active: bool
    promo_type: PromoType | None
    model_config = {"from_attributes": True}


@router.get("/", response_model=list[PromoOut])
async def list_promos(
    promo_type: PromoType | None = Query(None, description="Filter by promo type"),
    is_active: bool = Query(True),
    limit: int = Query(50, le=200),
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_user),
) -> list[Promotion]:
    q = select(Promotion).where(Promotion.is_active == is_active)
    if promo_type is not None:
        q = q.where(Promotion.promo_type == promo_type)
    q = q.limit(limit)
    result = await db.execute(q)
    return list(result.scalars().all())
