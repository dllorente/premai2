from abc import ABC, abstractmethod
from dataclasses import dataclass, field


@dataclass
class OCRResult:
    store: str | None = None
    purchased_at: str | None = None  # "YYYY-MM-DD HH:MM" or None
    total_amount: float | None = None
    ticket_number: str | None = None
    brands: list[str] = field(default_factory=list)
    products: list[dict] = field(default_factory=list)
    raw_text: str | None = None
    matched_promo_id: int | None = None
    match_confidence: str | None = None  # high | medium | low
    provider: str = ""
    error: str | None = None


OCR_PROMPT_BASE = """Eres un sistema especializado en extraer datos estructurados de tickets
de compra de supermercados españoles.

Analiza la imagen del ticket y devuelve ÚNICAMENTE un JSON válido con
esta estructura exacta (sin texto adicional, sin markdown):

{
  "store": "nombre del establecimiento o null",
  "purchased_at": "YYYY-MM-DD HH:MM o null",
  "total_amount": número o null,
  "ticket_number": "número de ticket o null",
  "brands": ["lista de marcas únicas detectadas"],
  "products": [
    {
      "name": "nombre del producto",
      "brand": "marca o null",
      "price": precio unitario o null,
      "quantity": unidades compradas (integer) o 1,
      "subtotal": precio total línea o null
    }
  ],
  "raw_text": "transcripción completa del ticket",
  "matched_promo_id": null,
  "match_confidence": null
}

Reglas:
- Si no puedes leer un campo con seguridad, pon null
- quantity siempre es un entero positivo (mínimo 1)
- purchased_at debe incluir hora si aparece en el ticket
- brands es la lista ÚNICA de marcas (sin duplicados)
- Solo devuelve el JSON, sin ningún texto adicional"""


def build_ocr_prompt(active_promos: list[dict] | None = None) -> str:
    """Build OCR prompt, optionally injecting active promos for matching."""
    if not active_promos:
        return OCR_PROMPT_BASE.replace(
            '"matched_promo_id": null,\n  "match_confidence": null',
            '"matched_promo_id": null,\n  "match_confidence": null',
        )

    promo_lines = "\n".join(
        f'  - id={p["id"]} brand="{p.get("brand") or "?"}" title="{p["title"]}" '
        f"requires_ticket={p.get('requires_ticket', True)} end_date={p.get('end_date') or '?'}"
        for p in active_promos
    )
    promo_section = f"""
PROMOCIONES ACTIVAS (compara las marcas del ticket con esta lista):
{promo_lines}

Regla de matching:
- Si alguna marca del ticket coincide con una promo activa Y el ticket es válido para participar,
  pon el id de esa promo en matched_promo_id y la confianza (high/medium/low) en match_confidence.
- Si hay varias coincidencias, elige la de mayor confianza.
- Si no hay match, deja matched_promo_id y match_confidence en null."""

    return OCR_PROMPT_BASE + promo_section


# Backwards-compat alias used in existing tests
OCR_PROMPT = OCR_PROMPT_BASE


class OCRClient(ABC):
    @abstractmethod
    async def extract(
        self,
        image_bytes: bytes,
        mime_type: str = "image/jpeg",
        active_promos: list[dict] | None = None,
    ) -> OCRResult:
        """Extract structured data from a ticket image, optionally matching against active promos."""
