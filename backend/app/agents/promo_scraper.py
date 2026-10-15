import hashlib
import json
import logging
import re
from datetime import date

import httpx
from anthropic import AsyncAnthropic
from bs4 import BeautifulSoup
from langgraph.graph import END, StateGraph
from sqlalchemy import select
from typing_extensions import TypedDict

import app.models.promo_source  # noqa: F401 — must load before Promotion resolves relationship
from app.core.config import settings
from app.db.session import AsyncSessionLocal
from app.models.promotion import Promotion

logger = logging.getLogger(__name__)

# ── State ────────────────────────────────────────────────────────────────────


class ScraperState(TypedDict):
    source_id: int
    url: str
    source_type: str  # aggregator | brand_direct | brand_platform
    brand: str | None
    html: str | None
    content_hash: str | None
    hash_unchanged: bool  # True → skip extraction, content not changed
    links: list[str]  # for aggregator pages: links found
    extracted: dict | None
    error: str | None


# ── Nodes ─────────────────────────────────────────────────────────────────────


async def fetch_url(state: ScraperState) -> dict:
    url = state["url"]
    logger.info("scraper.fetch_url start source_id=%s url=%s", state["source_id"], url)
    try:
        async with httpx.AsyncClient(timeout=20, follow_redirects=True) as client:
            resp = await client.get(
                url,
                headers={"User-Agent": "Mozilla/5.0 (compatible; PremAI-scraper/1.0)"},
            )
            resp.raise_for_status()
            html = resp.text
            content_hash = hashlib.sha256(html.encode()).hexdigest()
            logger.info(
                "scraper.fetch_url ok source_id=%s bytes=%s hash=%s",
                state["source_id"],
                len(html),
                content_hash[:8],
            )
            return {"html": html, "content_hash": content_hash, "error": None}
    except Exception as e:  # noqa: BLE001
        logger.warning(
            "scraper.fetch_url error source_id=%s url=%s error=%s", state["source_id"], url, e
        )
        return {"html": None, "content_hash": None, "error": str(e)}


async def check_hash(state: ScraperState) -> dict:
    if state.get("error") or not state.get("content_hash"):
        logger.info("scraper.check_hash skip source_id=%s reason=fetch_error", state["source_id"])
        return {"hash_unchanged": True}

    async with AsyncSessionLocal() as session:
        existing = await session.scalar(
            select(Promotion)
            .where(Promotion.source_id == state["source_id"])
            .where(Promotion.content_hash == state["content_hash"])
        )
    unchanged = existing is not None
    logger.info("scraper.check_hash source_id=%s hash_unchanged=%s", state["source_id"], unchanged)
    return {"hash_unchanged": unchanged}


async def extract_links(state: ScraperState) -> dict:
    soup = BeautifulSoup(state["html"] or "", "lxml")
    links = []
    for a in soup.find_all("a", href=True):
        href = str(a["href"])
        if href.startswith("http") and any(
            kw in href.lower() for kw in ["promo", "sorteo", "concurs", "gana", "premi"]
        ):
            links.append(href)
    unique = list(set(links))[:20]
    logger.info(
        "scraper.extract_links source_id=%s links_found=%s", state["source_id"], len(unique)
    )
    return {"links": unique}


async def extract_promo(state: ScraperState) -> dict:
    if not state.get("html"):
        logger.warning("scraper.extract_promo source_id=%s skipped=no_html", state["source_id"])
        return {"extracted": None}

    soup = BeautifulSoup(state["html"] or "", "lxml")
    for tag in soup(["script", "style", "nav", "footer", "header"]):
        tag.decompose()
    clean_text = soup.get_text(separator="\n", strip=True)[:8000]

    logger.info(
        "scraper.extract_promo source_id=%s text_chars=%s calling_claude",
        state["source_id"],
        len(clean_text),
    )

    client = AsyncAnthropic(
        api_key=settings.ANTHROPIC_API_KEY,
        default_headers={"anthropic-workspace-id": settings.ANTHROPIC_WORKSPACE_ID},
    )
    prompt = f"""Analyzes this text from a Spanish promotional website and extract active promotions.
        Brand hint (may be null): {state.get("brand")}

        Return ONLY a valid JSON object with this exact structure:
        {{
        "is_promotion_found": true or false,
        "title": "promotion title in Spanish",
        "brand": "brand name or null",
        "promo_type": "social" if it is a raffle/giveaway with no purchase needed, "free" if it is 100% refund or free sample, "purchase" if it requires a purchase receipt — or null if unclear,
        "requirements": "what the user must buy/do to participate, in Spanish",
        "participation_url": "direct URL to participate or null",
        "start_date": "YYYY-MM-DD or null",
        "end_date": "YYYY-MM-DD or null",
        "prize_description": "what can be won, in Spanish",
        "legal_summary": "1-2 sentence summary of the legal bases / terms in Spanish, or null",
        "requires_ticket": true if a purchase receipt must be uploaded,
        "tickets_required": number of tickets needed or null
        }}

        If there is no active promotion or the page requires login to see promotions, return {{"is_promotion_found": false}}.

        PAGE TEXT:
        {clean_text}"""

    message = await client.messages.create(
        model="claude-haiku-4-5-20251001",
        max_tokens=512,
        messages=[{"role": "user", "content": prompt}],
    )
    from anthropic.types import TextBlock

    raw = next(b for b in message.content if isinstance(b, TextBlock)).text.strip()
    try:
        data = json.loads(raw)
    except json.JSONDecodeError:
        match = re.search(r"\{.*\}", raw, re.DOTALL)
        data = json.loads(match.group()) if match else {"is_promotion_found": False}

    found = data.get("is_promotion_found", False)
    logger.info(
        "scraper.extract_promo source_id=%s promotion_found=%s title=%s",
        state["source_id"],
        found,
        data.get("title"),
    )
    return {"extracted": data}


async def upsert_db(state: ScraperState) -> dict:
    data = state.get("extracted")
    if not data or not data.get("is_promotion_found"):
        logger.info("scraper.upsert_db source_id=%s skipped=no_promotion", state["source_id"])
        return {}

    def parse_date(s: str | None) -> date | None:
        if not s:
            return None
        try:
            return date.fromisoformat(s)
        except ValueError:
            return None

    async with AsyncSessionLocal() as session:
        promo = Promotion(
            source_id=state["source_id"],
            title=data.get("title", "Sin título"),
            brand=data.get("brand") or state.get("brand"),
            promo_type=data.get("promo_type"),
            legal_summary=data.get("legal_summary"),
            requirements=data.get("requirements"),
            participation_url=data.get("participation_url") or state["url"],
            start_date=parse_date(data.get("start_date")),
            end_date=parse_date(data.get("end_date")),
            prize_description=data.get("prize_description"),
            requires_ticket=data.get("requires_ticket", True),
            tickets_required=data.get("tickets_required"),
            is_active=True,
            content_hash=state.get("content_hash"),
            raw_data=json.dumps(data),
        )
        session.add(promo)
        await session.commit()
        logger.info(
            "scraper.upsert_db source_id=%s promotion_saved title=%s",
            state["source_id"],
            promo.title,
        )

    return {}


# ── Routing ───────────────────────────────────────────────────────────────────


def should_skip(state: ScraperState) -> str:
    if state.get("error") or state.get("hash_unchanged"):
        return "skip"
    if state.get("source_type") == "aggregator":
        return "aggregator"
    return "extract"


# ── Graph ─────────────────────────────────────────────────────────────────────


def build_scraper_graph():
    graph = StateGraph(ScraperState)

    graph.add_node("fetch", fetch_url)
    graph.add_node("check_hash", check_hash)
    graph.add_node("extract_links", extract_links)
    graph.add_node("extract_promo", extract_promo)
    graph.add_node("upsert_db", upsert_db)

    graph.set_entry_point("fetch")
    graph.add_edge("fetch", "check_hash")
    graph.add_conditional_edges(
        "check_hash",
        should_skip,
        {
            "skip": END,
            "aggregator": "extract_links",
            "extract": "extract_promo",
        },
    )
    graph.add_edge("extract_links", END)
    graph.add_edge("extract_promo", "upsert_db")
    graph.add_edge("upsert_db", END)

    return graph.compile()


scraper_graph = build_scraper_graph()
