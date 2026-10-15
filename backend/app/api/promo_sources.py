from __future__ import annotations

from fastapi import APIRouter, Depends, status
from pydantic import BaseModel, HttpUrl
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.deps import get_current_user, get_db
from app.models.promo_source import PromoSource
from app.models.user import User

router = APIRouter(prefix="/promo-sources", tags=["promo-sources"])


class _SubmitIn(BaseModel):
    url: HttpUrl
    brand: str | None = None


class _SubmitOut(BaseModel):
    source_id: int
    url: str
    already_existed: bool
    scraping_queued: bool


@router.post("/submit", response_model=_SubmitOut, status_code=status.HTTP_202_ACCEPTED)
async def submit_promo_url(
    body: _SubmitIn,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> _SubmitOut:
    """User submits a URL to be scraped for promotions."""
    url_str = str(body.url)

    existing = await db.scalar(select(PromoSource).where(PromoSource.url == url_str))
    if existing:
        return _SubmitOut(
            source_id=existing.id,
            url=url_str,
            already_existed=True,
            scraping_queued=False,
        )

    source = PromoSource(
        url=url_str,
        name=f"User submission — {url_str[:100]}",
        source_type="brand_direct",
        brand=body.brand,
        scrape_frequency_hours=24,
        is_active=True,
        notes=f"Submitted by user_id={current_user.id}",
    )
    db.add(source)
    await db.flush()

    from app.tasks.scrape_promos import scrape_source

    scrape_source.delay(source.id)

    await db.commit()
    return _SubmitOut(
        source_id=source.id,
        url=url_str,
        already_existed=False,
        scraping_queued=True,
    )
