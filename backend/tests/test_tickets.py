"""Integration tests for tickets endpoints + OCR plumbing."""

import io
from unittest.mock import AsyncMock, MagicMock, patch

import pytest
from httpx import ASGITransport, AsyncClient

from app.main import app
from app.models.ticket import Ticket
from app.services.ocr.base import OCRResult

# ── Unit tests: OCRResult dataclass ──────────────────────────────────────────


class TestOCRResult:
    def test_successful_result(self):
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
        assert result.products[0]["quantity"] == 4

    def test_error_result(self):
        result = OCRResult(provider="claude", error="API timeout")
        assert result.error == "API timeout"
        assert result.store is None


# ── Unit test: Claude OCR client (mocked API call) ───────────────────────────


@pytest.mark.asyncio
async def test_claude_client_parse_mocked():
    import json
    from unittest.mock import MagicMock

    from anthropic.types import TextBlock

    from app.services.ocr.claude_client import ClaudeOCRClient

    mock_text = json.dumps(
        {
            "store": "Carrefour",
            "purchased_at": "2026-10-13 10:30",
            "total_amount": 15.50,
            "ticket_number": "T-001",
            "brands": ["Nestlé"],
            "products": [{"name": "Leche", "brand": "Nestlé", "price": 15.50, "quantity": 1}],
            "raw_text": "CARREFOUR...",
        }
    )

    fake_block = MagicMock(spec=TextBlock)
    fake_block.text = mock_text
    fake_response = MagicMock()
    fake_response.content = [fake_block]

    client = ClaudeOCRClient(api_key="fake")
    with patch.object(client._client.messages, "create", AsyncMock(return_value=fake_response)):
        result = await client.extract(b"fake_image_bytes")

    assert result.error is None
    assert result.store == "Carrefour"
    assert result.total_amount == 15.50
    assert result.provider == "claude"


# ── Integration tests: HTTP endpoints ────────────────────────────────────────


class TestUploadTicket:
    async def test_unauthenticated_returns_401(self, anon_client):
        async with anon_client as client:
            response = await client.post(
                "/tickets/upload",
                files={"file": ("ticket.jpg", io.BytesIO(b"fake"), "image/jpeg")},
            )
        assert response.status_code == 401

    async def test_unsupported_mime_returns_415(self, auth_client):
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            response = await client.post(
                "/tickets/upload",
                files={"file": ("ticket.pdf", io.BytesIO(b"fake"), "application/pdf")},
                headers={"Authorization": "Bearer faketoken"},
            )
        assert response.status_code == 415

    async def test_authenticated_upload_returns_202(self, auth_client):
        # Celery is in a try/except inside the route — no patch needed; exception is swallowed
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            response = await client.post(
                "/tickets/upload",
                files={"file": ("ticket.jpg", io.BytesIO(b"fake_image_data"), "image/jpeg")},
                headers={"Authorization": "Bearer faketoken"},
            )

        assert response.status_code == 202
        data = response.json()
        assert data["ticket_id"] == 7
        assert data["status"] == "pending"
        assert "message" in data

    async def test_authenticated_upload_enqueues_celery_task(self, auth_client):
        # Patch at the tasks module so the lazy import inside the route gets the mock
        with patch("app.tasks.process_ticket.process_ticket") as mock_task:
            mock_task.delay = MagicMock()
            async with AsyncClient(
                transport=ASGITransport(app=app), base_url="http://test"
            ) as client:
                await client.post(
                    "/tickets/upload",
                    files={"file": ("ticket.jpg", io.BytesIO(b"img"), "image/jpeg")},
                    headers={"Authorization": "Bearer faketoken"},
                )
            mock_task.delay.assert_called_once_with(7)

    async def test_authenticated_upload_persists_ticket(self, auth_client):
        """Verifies the route calls db.add + db.commit."""
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            await client.post(
                "/tickets/upload",
                files={"file": ("ticket.jpg", io.BytesIO(b"img"), "image/jpeg")},
                headers={"Authorization": "Bearer faketoken"},
            )
        auth_client.add.assert_called_once()
        auth_client.commit.assert_called()


class TestListTickets:
    async def test_unauthenticated_returns_401(self, anon_client):
        async with anon_client as client:
            response = await client.get("/tickets/")
        assert response.status_code == 401

    async def test_returns_own_tickets(self, auth_client, fake_ticket):
        mock_result = MagicMock()
        mock_result.scalars.return_value.all.return_value = [fake_ticket]
        auth_client.execute = AsyncMock(return_value=mock_result)

        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            response = await client.get("/tickets/", headers={"Authorization": "Bearer faketoken"})

        assert response.status_code == 200
        tickets = response.json()
        assert isinstance(tickets, list)
        assert len(tickets) == 1
        assert tickets[0]["id"] == fake_ticket.id
        assert tickets[0]["status"] == "pending"

    async def test_returns_empty_list_when_no_tickets(self, auth_client):
        mock_result = MagicMock()
        mock_result.scalars.return_value.all.return_value = []
        auth_client.execute = AsyncMock(return_value=mock_result)

        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            response = await client.get("/tickets/", headers={"Authorization": "Bearer faketoken"})

        assert response.status_code == 200
        assert response.json() == []


class TestGetTicket:
    async def test_unauthenticated_returns_401(self, anon_client):
        async with anon_client as client:
            response = await client.get("/tickets/7")
        assert response.status_code == 401

    async def test_returns_own_ticket(self, auth_client, fake_ticket):
        auth_client.get = AsyncMock(return_value=fake_ticket)
        execute_result = MagicMock()
        execute_result.scalar_one_or_none.return_value = None
        auth_client.execute = AsyncMock(return_value=execute_result)

        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            response = await client.get(
                f"/tickets/{fake_ticket.id}",
                headers={"Authorization": "Bearer faketoken"},
            )

        assert response.status_code == 200
        assert response.json()["id"] == fake_ticket.id

    async def test_other_users_ticket_returns_404(self, auth_client, fake_user):
        other_ticket = Ticket(id=99, user_id=fake_user.id + 1, status="valid")
        auth_client.get = AsyncMock(return_value=other_ticket)
        execute_result = MagicMock()
        execute_result.scalar_one_or_none.return_value = None
        auth_client.execute = AsyncMock(return_value=execute_result)

        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            response = await client.get(
                "/tickets/99",
                headers={"Authorization": "Bearer faketoken"},
            )

        assert response.status_code == 404

    async def test_nonexistent_ticket_returns_404(self, auth_client):
        auth_client.get = AsyncMock(return_value=None)

        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            response = await client.get(
                "/tickets/999",
                headers={"Authorization": "Bearer faketoken"},
            )

        assert response.status_code == 404
