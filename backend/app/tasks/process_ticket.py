import asyncio
import json
import logging
from datetime import datetime
from pathlib import Path

import anyio
from celery import Celery

from app.core.config import settings
from app.db.session import AsyncSessionLocal
from app.models.ticket import Ticket
from app.services.ocr import get_ocr_client

celery_app = Celery("premai2", broker=settings.REDIS_URL, backend=settings.REDIS_URL)
logger = logging.getLogger(__name__)


@celery_app.task(bind=True, max_retries=3, default_retry_delay=30)
def process_ticket(self, ticket_id: int) -> dict:  # type: ignore[override]
    return asyncio.run(_process(self, ticket_id))


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

            client = get_ocr_client()
            result = await client.extract(image_bytes)

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
                ticket.raw_text = result.raw_text
                ticket.ocr_provider = result.provider

                if result.purchased_at:
                    try:
                        ticket.purchased_at = datetime.strptime(
                            result.purchased_at, "%Y-%m-%d %H:%M"
                        )
                    except ValueError:
                        pass  # leave as None if format unexpected

            await session.commit()
            logger.info(
                "Ticket %d processed — status=%s provider=%s",
                ticket_id,
                ticket.status,
                ticket.ocr_provider,
            )
            return {"ticket_id": ticket_id, "status": ticket.status}

        except Exception as exc:
            ticket.status = "invalid"
            ticket.ocr_error = str(exc)
            await session.commit()
            logger.exception("Error processing ticket %d", ticket_id)
            raise
