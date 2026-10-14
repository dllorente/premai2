import asyncio
import logging
from datetime import UTC, datetime

from app.tasks.process_ticket import celery_app

logger = logging.getLogger(__name__)


@celery_app.task(name="tasks.scrape_source", bind=True, max_retries=2)
def scrape_source(self, source_id: int) -> dict:
    """Scrape one promo source and upsert found promotions."""
    logger.info("scrape_source start source_id=%s attempt=%s", source_id, self.request.retries)
    return asyncio.get_event_loop().run_until_complete(_scrape(self, source_id))


async def _scrape(task, source_id: int) -> dict:

    from app.agents.promo_scraper import scraper_graph
    from app.db.session import AsyncSessionLocal
    from app.models.promo_source import PromoSource

    async with AsyncSessionLocal() as session:
        source = await session.get(PromoSource, source_id)
        if not source or not source.is_active:
            return {"skipped": True}

        result = await scraper_graph.ainvoke(
            {
                "source_id": source.id,
                "url": source.url,
                "source_type": source.source_type,
                "brand": source.brand,
                "html": None,
                "content_hash": None,
                "hash_unchanged": False,
                "links": [],
                "extracted": None,
                "error": None,
            }
        )

        source.last_scraped_at = datetime.now(UTC)
        await session.commit()

    error = result.get("error")
    if error:
        logger.warning("scrape_source done source_id=%s error=%s", source_id, error)
    else:
        logger.info("scrape_source done source_id=%s ok", source_id)
    return {"source_id": source_id, "error": error}


@celery_app.task(name="tasks.scrape_all_sources")
def scrape_all_sources() -> dict:
    """Enqueue one scrape_source task per due source."""
    logger.info("scrape_all_sources triggered")
    return asyncio.get_event_loop().run_until_complete(_enqueue_all())


async def _enqueue_all() -> dict:
    from datetime import timedelta

    from sqlalchemy import select

    from app.db.session import AsyncSessionLocal
    from app.models.promo_source import PromoSource

    async with AsyncSessionLocal() as session:
        sources = (
            (await session.execute(select(PromoSource).where(PromoSource.is_active == True)))
            .scalars()
            .all()
        )

    now = datetime.now(UTC)
    enqueued = 0
    for s in sources:
        if s.last_scraped_at is None:
            due = True
        else:
            due = (now - s.last_scraped_at) >= timedelta(hours=s.scrape_frequency_hours)
        if due:
            scrape_source.delay(s.id)
            enqueued += 1

    logger.info("scrape_all_sources enqueued=%s tasks", enqueued)
    return {"enqueued": enqueued}
