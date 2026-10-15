from __future__ import annotations

import asyncio
import logging

from app.tasks.process_ticket import celery_app

logger = logging.getLogger(__name__)


@celery_app.task(name="tasks.discover_new_promos")
def discover_new_promos() -> dict:
    """Search the web for new promo pages and enqueue scraping for each."""
    logger.info("discover_new_promos start")
    return asyncio.get_event_loop().run_until_complete(_discover())


async def _discover() -> dict:
    from sqlalchemy import select

    from app.db.session import AsyncSessionLocal
    from app.models.promo_source import PromoSource
    from app.services.discovery.searcher import discover_promo_urls
    from app.tasks.scrape_promos import scrape_source

    discovered = discover_promo_urls()
    if not discovered:
        logger.info("discover_new_promos no_urls_found")
        return {"new": 0, "already_known": 0}

    new_count = 0
    known_count = 0

    async with AsyncSessionLocal() as session:
        for item in discovered:
            existing = await session.scalar(select(PromoSource).where(PromoSource.url == item.url))
            if existing:
                known_count += 1
                continue

            source = PromoSource(
                url=item.url,
                name=item.title[:255] if item.title else item.url[:255],
                source_type="discovered",
                brand=None,
                scrape_frequency_hours=24,
                is_active=True,
                notes=f"Auto-discovered by Tavily · score={item.score:.2f}",
                last_scraped_at=None,
            )
            session.add(source)
            await session.flush()
            scrape_source.delay(source.id)
            new_count += 1
            logger.info("discover_new_promos new_source url=%s", item.url[:80])

        await session.commit()

    logger.info("discover_new_promos done new=%s already_known=%s", new_count, known_count)
    return {"new": new_count, "already_known": known_count}
