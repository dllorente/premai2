"""Seed promo_sources table from fixtures/promo_sources.json."""

import asyncio
import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

import app.models.promotion  # noqa: F401 — must be imported to resolve relationship
from app.core.config import settings
from app.models.promo_source import PromoSource


async def seed() -> None:
    fixtures_path = Path(__file__).resolve().parents[1] / "fixtures" / "promo_sources.json"
    sources = json.loads(fixtures_path.read_text())

    engine = create_async_engine(settings.DATABASE_URL)
    SessionLocal = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

    async with SessionLocal() as session:
        added = 0
        skipped = 0
        for data in sources:
            existing = await session.scalar(
                select(PromoSource).where(PromoSource.url == data["url"])
            )
            if existing:
                skipped += 1
                continue
            session.add(PromoSource(**data))
            added += 1
        await session.commit()

    await engine.dispose()
    print(f"Done — {added} added, {skipped} already existed.")


if __name__ == "__main__":
    asyncio.run(seed())
