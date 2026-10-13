import base64
import json
import logging

import httpx

from app.services.ocr.base import OCR_PROMPT, OCRClient, OCRResult

logger = logging.getLogger(__name__)

_GEMINI_URL = (
    "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent"
)


class GeminiOCRClient(OCRClient):
    def __init__(self, api_key: str) -> None:
        self._api_key = api_key

    async def extract(self, image_bytes: bytes, mime_type: str = "image/jpeg") -> OCRResult:
        b64 = base64.standard_b64encode(image_bytes).decode()
        payload = {
            "contents": [
                {
                    "parts": [
                        {"inline_data": {"mime_type": mime_type, "data": b64}},
                        {"text": OCR_PROMPT},
                    ]
                }
            ]
        }
        try:
            async with httpx.AsyncClient(timeout=60) as client:
                resp = await client.post(
                    _GEMINI_URL,
                    params={"key": self._api_key},
                    json=payload,
                )
                resp.raise_for_status()
                raw = resp.json()["candidates"][0]["content"]["parts"][0]["text"].strip()
                # strip markdown fences if any
                if raw.startswith("```"):
                    raw = raw.split("\n", 1)[-1].rsplit("```", 1)[0].strip()
                data = json.loads(raw)
                result = OCRResult(provider="gemini", **_coerce(data))
                logger.info(
                    "Gemini OCR success — store=%s products=%d", result.store, len(result.products)
                )
                return result
        except Exception as exc:  # noqa: BLE001
            logger.warning("Gemini OCR error: %s", exc)
            return OCRResult(provider="gemini", error=str(exc))


def _coerce(data: dict) -> dict:
    return {
        "store": data.get("store"),
        "purchased_at": data.get("purchased_at"),
        "total_amount": data.get("total_amount"),
        "ticket_number": data.get("ticket_number"),
        "brands": data.get("brands") or [],
        "products": data.get("products") or [],
        "raw_text": data.get("raw_text"),
    }
