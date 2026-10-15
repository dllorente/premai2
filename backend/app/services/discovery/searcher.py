from __future__ import annotations

import logging
from dataclasses import dataclass

from tavily import TavilyClient

from app.core.config import settings

logger = logging.getLogger(__name__)

SEARCH_QUERIES = [
    "promoción cashback subir ticket supermercado España 2026",
    "cupón descuento ticket compra marcas España 2026",
    "sorteo concurso ticket compra España site:.es",
    "gana premios subir ticket Mercadona Carrefour Lidl España",
    "reembolso cashback compra productos España promoción",
]


@dataclass
class DiscoveredUrl:
    url: str
    title: str
    score: float


def discover_promo_urls(max_results_per_query: int = 5) -> list[DiscoveredUrl]:
    """Search the web for Spanish promo pages. Returns deduplicated URLs."""
    if not settings.TAVILY_API_KEY:
        logger.warning("discovery.searcher TAVILY_API_KEY not set — skipping")
        return []

    client = TavilyClient(api_key=settings.TAVILY_API_KEY)
    seen: set[str] = set()
    results: list[DiscoveredUrl] = []

    for query in SEARCH_QUERIES:
        try:
            response = client.search(
                query=query,
                search_depth="basic",
                max_results=max_results_per_query,
                include_domains=[".es"],
            )
            for hit in response.get("results", []):
                url: str = hit.get("url", "")
                if not url or url in seen:
                    continue
                seen.add(url)
                results.append(
                    DiscoveredUrl(
                        url=url,
                        title=hit.get("title", ""),
                        score=hit.get("score", 0.0),
                    )
                )
            logger.info(
                "discovery.searcher query=%r hits=%s", query[:40], len(response.get("results", []))
            )
        except Exception as e:  # noqa: BLE001
            logger.warning("discovery.searcher query=%r error=%s", query[:40], e)

    logger.info("discovery.searcher total_unique_urls=%s", len(results))
    return results
