import asyncio
import json
import logging
from datetime import datetime
from pathlib import Path

import anyio
from celery import Celery
from celery.schedules import crontab
from sqlalchemy import select

from app.core.config import settings
from app.db.session import AsyncSessionLocal
from app.models.ticket import Ticket
from app.services.ocr import get_ocr_client
from app.services.ocr.sanitizer import sanitize_ticket_text

celery_app = Celery("premai2", broker=settings.REDIS_URL, backend=settings.REDIS_URL)
logger = logging.getLogger(__name__)
celery_app.conf.beat_schedule = {
    "scrape-all-sources-every-hour": {
        "task": "tasks.scrape_all_sources",
        "schedule": crontab(minute=0),
    },
}
celery_app.conf.timezone = "Europe/Madrid"


@celery_app.task(bind=True, max_retries=3, default_retry_delay=30)
def process_ticket(self, ticket_id: int) -> dict:  # type: ignore[override]
    return asyncio.run(_process(self, ticket_id))


async def _fetch_active_promos(session) -> list[dict]:
    """Return active promotions as plain dicts for the OCR prompt."""
    from app.models.promotion import Promotion

    rows = (
        (await session.execute(select(Promotion).where(Promotion.is_active == True)))
        .scalars()
        .all()
    )
    return [
        {
            "id": p.id,
            "title": p.title,
            "brand": p.brand,
            "requires_ticket": p.requires_ticket,
            "end_date": str(p.end_date) if p.end_date else None,
        }
        for p in rows
    ]


async def _save_match(session, ticket_id: int, promo_id: int, confidence: str | None) -> None:
    """Persist ticket↔promo match in ticket_promotions."""
    from app.models.ticket_promotion import TicketPromotion

    match = TicketPromotion(
        ticket_id=ticket_id,
        promotion_id=promo_id,
        confidence=confidence,
    )
    session.add(match)
    logger.info(
        "ticket_match saved ticket_id=%s promo_id=%s confidence=%s", ticket_id, promo_id, confidence
    )


async def _process(task: object, ticket_id: int) -> dict:
    async with AsyncSessionLocal() as session:
        ticket: Ticket | None = await session.get(Ticket, ticket_id)
        if not ticket:
            return {"error": f"Ticket {ticket_id} not found"}

        ticket.status = "processing"
        await session.commit()

        try:
            if not ticket.image_path:
                ticket.status = "invalid"
                ticket.ocr_error = "No image path"
                await session.commit()
                return {"ticket_id": ticket_id, "status": "invalid"}

            image_path = Path(settings.UPLOAD_DIR) / ticket.image_path
            image_bytes = await anyio.Path(image_path).read_bytes()

            active_promos = await _fetch_active_promos(session)
            logger.info(
                "process_ticket ticket_id=%s active_promos=%s", ticket_id, len(active_promos)
            )

            client = get_ocr_client()
            result = await client.extract(image_bytes, active_promos=active_promos)

            if result.error:
                ticket.status = "invalid"
                ticket.ocr_error = result.error
            else:
                ticket.status = "valid"
                ticket.store = result.store
                ticket.total_amount = result.total_amount
                ticket.ticket_number = result.ticket_number
                ticket.brands = json.dumps(result.brands, ensure_ascii=False)
                ticket.products = json.dumps(result.products, ensure_ascii=False)
                ticket.raw_text = sanitize_ticket_text(result.raw_text) if result.raw_text else None
                ticket.ocr_provider = result.provider

                if result.purchased_at:
                    try:
                        ticket.purchased_at = datetime.strptime(
                            result.purchased_at, "%Y-%m-%d %H:%M"
                        )
                    except ValueError:
                        pass

                if result.matched_promo_id:
                    await _save_match(
                        session, ticket_id, result.matched_promo_id, result.match_confidence
                    )

            await session.commit()
            logger.info(
                "process_ticket done ticket_id=%s status=%s provider=%s matched_promo=%s",
                ticket_id,
                ticket.status,
                ticket.ocr_provider,
                result.matched_promo_id if not result.error else None,
            )
            return {
                "ticket_id": ticket_id,
                "status": ticket.status,
                "matched_promo_id": result.matched_promo_id if not result.error else None,
            }

        except Exception as exc:
            ticket.status = "invalid"
            ticket.ocr_error = str(exc)
            await session.commit()
            logger.exception("Error processing ticket %d", ticket_id)
            raise
