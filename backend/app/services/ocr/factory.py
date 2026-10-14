import logging

from app.core.config import settings
from app.services.ocr.base import OCRClient, OCRResult

logger = logging.getLogger(__name__)


def get_ocr_client() -> "OCRClient | _FallbackClient":
    provider = settings.OCR_PROVIDER.lower()
    logger.debug("OCR client requested — provider=%s", provider)
    if provider == "ensemble":
        return _FallbackClient(settings.OCR_ENSEMBLE_PROVIDERS)
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


class _FallbackClient(OCRClient):
    """Tries providers in order, paying only for the first that succeeds."""

    def __init__(self, providers: list[str]) -> None:
        self._providers = providers

    async def extract(
        self,
        image_bytes: bytes,
        mime_type: str = "image/jpeg",
        active_promos: list[dict] | None = None,
    ) -> OCRResult:
        last: OCRResult | None = None
        for provider in self._providers:
            client = _build_single(provider)
            result = await client.extract(image_bytes, mime_type, active_promos)
            if not result.error:
                logger.info("Fallback OCR succeeded — provider=%s", provider)
                return result
            logger.warning("Fallback OCR provider=%s failed: %s", provider, result.error)
            last = result
        logger.error("Fallback OCR — all providers failed")
        return last  # type: ignore[return-value]
