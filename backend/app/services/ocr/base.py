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
    provider: str = ""
    error: str | None = None


OCR_PROMPT = """Eres un sistema especializado en extraer datos estructurados de tickets
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
  "raw_text": "transcripción completa del ticket"
}

Reglas:
- Si no puedes leer un campo con seguridad, pon null
- quantity siempre es un entero positivo (mínimo 1)
- purchased_at debe incluir hora si aparece en el ticket
- brands es la lista ÚNICA de marcas (sin duplicados)
- Solo devuelve el JSON, sin ningún texto adicional"""


class OCRClient(ABC):
    @abstractmethod
    async def extract(self, image_bytes: bytes, mime_type: str = "image/jpeg") -> OCRResult:
        """Extract structured data from a ticket image."""
