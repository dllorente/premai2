"""Shared fixtures for all tests."""

from datetime import UTC, datetime
from unittest.mock import AsyncMock

import pytest
from httpx import ASGITransport, AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.deps import get_current_user, get_db
from app.main import app
from app.models.ticket import Ticket
from app.models.user import User


@pytest.fixture
def fake_user() -> User:
    return User(
        id=99,
        email="integration@test.example.com",
        hashed_password="irrelevant",
        is_active=True,
        is_superuser=False,
    )


_NOW = datetime(2026, 10, 13, 12, 0, 0, tzinfo=UTC)


@pytest.fixture
def fake_ticket(fake_user: User) -> Ticket:
    return Ticket(
        id=7,
        user_id=fake_user.id,
        status="pending",
        image_path=f"{fake_user.id}/abc123.jpg",
        brands="[]",
        products="[]",
        created_at=_NOW,
        updated_at=_NOW,
    )


@pytest.fixture
def mock_db() -> AsyncMock:
    session = AsyncMock(spec=AsyncSession)

    async def _refresh(obj: object) -> None:
        if isinstance(obj, Ticket):
            obj.id = 7

    session.refresh = AsyncMock(side_effect=_refresh)
    return session


@pytest.fixture
def auth_client(fake_user: User, mock_db: AsyncMock, tmp_path):
    """AsyncClient with auth + mocked DB. Yields (client, mock_db)."""

    async def _get_db():
        yield mock_db

    async def _get_current_user():
        return fake_user

    app.dependency_overrides[get_db] = _get_db
    app.dependency_overrides[get_current_user] = _get_current_user

    # Redirect file uploads to tmp dir so the filesystem stays clean
    import app.api.tickets as tickets_module

    tickets_module.settings.UPLOAD_DIR = str(tmp_path)

    yield mock_db

    app.dependency_overrides.clear()


@pytest.fixture
def db_client(mock_db: AsyncMock):
    """AsyncClient with only DB mocked — for auth endpoints that need DB but no user session."""

    async def _get_db():
        yield mock_db

    app.dependency_overrides[get_db] = _get_db
    yield mock_db
    app.dependency_overrides.clear()


@pytest.fixture
def anon_client():
    """AsyncClient with no auth overrides."""
    return AsyncClient(transport=ASGITransport(app=app), base_url="http://test")
