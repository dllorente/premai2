"""Integration tests for ticket upload endpoint."""

import io
from unittest.mock import AsyncMock, patch

import pytest
from httpx import ASGITransport, AsyncClient

from app.main import app
from app.services.ocr.base import OCRResult


@pytest.mark.asyncio
async def test_upload_ticket_unauthenticated():
    """Upload without auth returns 401."""
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        response = await client.post(
            "/tickets/upload",
            files={"file": ("ticket.jpg", io.BytesIO(b"fake"), "image/jpeg")},
        )
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_ocr_result_no_error():
    """OCRResult without error is considered successful."""
    result = OCRResult(
        store="Mercadona",
        purchased_at="2026-10-13 17:42",
        total_amount=23.40,
        brands=["Danone"],
        products=[{"name": "Yogur", "brand": "Danone", "price": 1.29, "quantity": 4}],
        raw_text="MERCADONA S.A.",
        provider="claude",
    )
    assert result.error is None
    assert result.store == "Mercadona"
    assert len(result.products) == 1
    assert result.products[0]["quantity"] == 4


@pytest.mark.asyncio
async def test_ocr_result_with_error():
    """OCRResult with error reports the error."""
    result = OCRResult(provider="claude", error="API timeout")
    assert result.error == "API timeout"
    assert result.store is None


@pytest.mark.asyncio
async def test_claude_client_parse_mocked():
    """ClaudeOCRClient parses a valid JSON response correctly."""
    import json

    from app.services.ocr.claude_client import ClaudeOCRClient

    mock_text = json.dumps(
        {
            "store": "Carrefour",
            "purchased_at": "2026-10-13 10:30",
            "total_amount": 15.50,
            "ticket_number": "T-001",
            "brands": ["Nestlé"],
            "products": [
                {"name": "Leche Nidina", "brand": "Nestlé", "price": 15.50, "quantity": 1}
            ],
            "raw_text": "CARREFOUR...",
        }
    )

    fake_response = AsyncMock()
    fake_response.content = [AsyncMock(text=mock_text)]

    client = ClaudeOCRClient(api_key="fake")
    with patch.object(client._client.messages, "create", return_value=fake_response):
        result = await client.extract(b"fake_image_bytes")

    assert result.error is None
    assert result.store == "Carrefour"
    assert result.total_amount == 15.50
    assert result.products[0]["quantity"] == 1
    assert result.provider == "claude"
