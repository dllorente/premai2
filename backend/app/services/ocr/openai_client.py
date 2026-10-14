import base64
import json
import logging

import openai

from app.services.ocr.base import OCR_PROMPT, OCRClient, OCRResult

logger = logging.getLogger(__name__)


class OpenAIOCRClient(OCRClient):
    def __init__(self, api_key: str) -> None:
        self._client = openai.AsyncOpenAI(api_key=api_key)

    async def extract(
        self,
        image_bytes: bytes,
        mime_type: str = "image/jpeg",
        active_promos: list[dict] | None = None,
    ) -> OCRResult:
        b64 = base64.standard_b64encode(image_bytes).decode()
        data_url = f"data:{mime_type};base64,{b64}"
        try:
            response = await self._client.chat.completions.create(
                model="gpt-4o-mini",
                max_tokens=2048,
                messages=[
                    {
                        "role": "user",
                        "content": [
                            {"type": "image_url", "image_url": {"url": data_url}},
                            {"type": "text", "text": OCR_PROMPT},
                        ],
                    }
                ],
            )
            content = response.choices[0].message.content or ""
            raw = content.strip()
            if raw.startswith("```"):
                raw = raw.split("\n", 1)[-1].rsplit("```", 1)[0].strip()
            data = json.loads(raw)
            result = OCRResult(provider="openai", **_coerce(data))
            logger.info(
                "OpenAI OCR success — store=%s products=%d", result.store, len(result.products)
            )
            return result
        except Exception as exc:  # noqa: BLE001
            logger.warning("OpenAI OCR error: %s", exc)
            return OCRResult(provider="openai", error=str(exc))


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
