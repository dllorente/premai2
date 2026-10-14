import base64
import json
import logging

import anthropic
from anthropic.types import TextBlock

from app.core.config import settings
from app.services.ocr.base import OCRClient, OCRResult, build_ocr_prompt

logger = logging.getLogger(__name__)


class ClaudeOCRClient(OCRClient):
    def __init__(self, api_key: str) -> None:
        self._client = anthropic.AsyncAnthropic(
            api_key=api_key,
            default_headers={"anthropic-workspace-id": settings.ANTHROPIC_WORKSPACE_ID},
        )

    async def extract(
        self,
        image_bytes: bytes,
        mime_type: str = "image/jpeg",
        active_promos: list[dict] | None = None,
    ) -> OCRResult:
        b64 = base64.standard_b64encode(image_bytes).decode()
        prompt = build_ocr_prompt(active_promos)
        logger.info(
            "claude_ocr.extract start mime=%s promos_count=%s",
            mime_type,
            len(active_promos) if active_promos else 0,
        )
        try:
            response = await self._client.messages.create(
                model="claude-haiku-4-5-20251001",
                max_tokens=2048,
                messages=[
                    {
                        "role": "user",
                        "content": [
                            {  # type: ignore[list-item]
                                "type": "image",
                                "source": {
                                    "type": "base64",
                                    "media_type": mime_type,
                                    "data": b64,
                                },
                            },
                            {"type": "text", "text": prompt},
                        ],
                    }
                ],
            )
            first_block = response.content[0]
            if not isinstance(first_block, TextBlock):
                return OCRResult(provider="claude", error="Unexpected response block type")
            raw = first_block.text.strip()
            data = json.loads(raw)
            result = OCRResult(provider="claude", **_coerce(data))
            logger.info(
                "claude_ocr.extract ok store=%s products=%d matched_promo_id=%s confidence=%s",
                result.store,
                len(result.products),
                result.matched_promo_id,
                result.match_confidence,
            )
            return result
        except Exception as exc:  # noqa: BLE001
            logger.warning("claude_ocr.extract error: %s", exc)
            return OCRResult(provider="claude", error=str(exc))


def _coerce(data: dict) -> dict:
    """Normalize provider response to OCRResult fields."""
    return {
        "store": data.get("store"),
        "purchased_at": data.get("purchased_at"),
        "total_amount": data.get("total_amount"),
        "ticket_number": data.get("ticket_number"),
        "brands": data.get("brands") or [],
        "products": data.get("products") or [],
        "raw_text": data.get("raw_text"),
        "matched_promo_id": data.get("matched_promo_id"),
        "match_confidence": data.get("match_confidence"),
    }
