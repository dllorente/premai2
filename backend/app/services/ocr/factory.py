import asyncio
import logging

from app.core.config import settings
from app.services.ocr.base import OCRClient, OCRResult

logger = logging.getLogger(__name__)


def get_ocr_client() -> "OCRClient | _EnsembleClient":
    provider = settings.OCR_PROVIDER.lower()
    logger.debug("OCR client requested — provider=%s", provider)
    if provider == "ensemble":
        return _EnsembleClient(settings.OCR_ENSEMBLE_PROVIDERS)
    return _build_single(provider)


def _build_single(provider: str) -> OCRClient:
    if provider == "claude":
        from app.services.ocr.claude_client import ClaudeOCRClient

        return ClaudeOCRClient(api_key=settings.ANTHROPIC_API_KEY)
    if provider == "gemini":
        from app.services.ocr.gemini_client import GeminiOCRClient

        return GeminiOCRClient(api_key=settings.GEMINI_API_KEY)
    if provider == "openai":
        from app.services.ocr.openai_client import OpenAIOCRClient

        return OpenAIOCRClient(api_key=settings.OPENAI_API_KEY)
    raise ValueError(f"Unknown OCR provider: {provider!r}")


class _EnsembleClient(OCRClient):
    """Calls multiple providers concurrently and returns the first successful result."""

    def __init__(self, providers: list[str]) -> None:
        self._clients = [_build_single(p) for p in providers]

    async def extract(self, image_bytes: bytes, mime_type: str = "image/jpeg") -> OCRResult:
        tasks = [c.extract(image_bytes, mime_type) for c in self._clients]
        results: list[OCRResult] = await asyncio.gather(*tasks)
        for r in results:
            if not r.error:
                logger.info("Ensemble OCR selected provider=%s", r.provider)
                return r
        logger.warning("Ensemble OCR — all providers failed, returning first result")
        return results[0]
