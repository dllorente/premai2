import re

_IBAN = re.compile(r"\b[A-Z]{2}\d{2}[\s\d]{15,30}\b", re.IGNORECASE)
_NIF = re.compile(r"\b[0-9XYZxyz]\d{7}[A-Za-z]\b")
_CARD = re.compile(r"\b(?:\d[\s\-]?){13,19}\b")
_PHONE = re.compile(r"\b(?:\+34\s?)?\d{3}[\s\-]?\d{3}[\s\-]?\d{3}\b")


def sanitize_ticket_text(text: str) -> str:
    """Strip PII from raw OCR text before persisting to DB."""
    text = _IBAN.sub("[IBAN]", text)
    text = _NIF.sub("[NIF]", text)
    text = _CARD.sub("[CARD]", text)
    text = _PHONE.sub("[TEL]", text)
    return text
