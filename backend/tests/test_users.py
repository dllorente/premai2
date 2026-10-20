"""Integration tests for /users/me and /users/me/preferences."""

from unittest.mock import AsyncMock, MagicMock

from httpx import ASGITransport, AsyncClient

from app.main import app
from app.models.user_preferences import UserPreferences


def _mock_prefs(mock_db: AsyncMock, prefs: UserPreferences | None) -> None:
    result = MagicMock()
    result.scalar_one_or_none.return_value = prefs
    mock_db.execute = AsyncMock(return_value=result)


def _client() -> AsyncClient:
    return AsyncClient(transport=ASGITransport(app=app), base_url="http://test")


def _existing_prefs(user_id: int) -> UserPreferences:
    return UserPreferences(
        user_id=user_id,
        promo_types=["free"],
        brands=["Danone"],
        email_digest=True,
        digest_hour=8,
        telegram_chat_id=None,
    )


class TestMe:
    async def test_get_me(self, auth_client, fake_user):
        async with _client() as client:
            response = await client.get("/users/me")
        assert response.status_code == 200
        assert response.json()["email"] == fake_user.email

    async def test_patch_full_name(self, auth_client, fake_user):
        async with _client() as client:
            response = await client.patch("/users/me", json={"full_name": "  Ana López "})
        assert response.status_code == 200
        assert response.json()["full_name"] == "Ana López"
        auth_client.commit.assert_called_once()

    async def test_requires_auth(self, anon_client):
        async with anon_client as client:
            response = await client.get("/users/me")
        assert response.status_code == 401


class TestPreferences:
    async def test_get_creates_defaults(self, auth_client, fake_user):
        _mock_prefs(auth_client, None)
        async with _client() as client:
            response = await client.get("/users/me/preferences")
        assert response.status_code == 200
        assert response.json() == {
            "promo_types": [],
            "brands": [],
            "email_digest": True,
            "digest_hour": 8,
            "telegram_linked": False,
        }
        created = auth_client.add.call_args.args[0]
        assert isinstance(created, UserPreferences)
        assert created.user_id == fake_user.id

    async def test_get_existing(self, auth_client, fake_user):
        _mock_prefs(auth_client, _existing_prefs(fake_user.id))
        async with _client() as client:
            response = await client.get("/users/me/preferences")
        assert response.status_code == 200
        assert response.json()["promo_types"] == ["free"]
        auth_client.add.assert_not_called()

    async def test_patch_partial_update(self, auth_client, fake_user):
        prefs = _existing_prefs(fake_user.id)
        _mock_prefs(auth_client, prefs)
        async with _client() as client:
            response = await client.patch(
                "/users/me/preferences",
                json={
                    "promo_types": ["social", "purchase", "social"],
                    "brands": [" Coca-Cola", "coca-cola", ""],
                },
            )
        assert response.status_code == 200
        data = response.json()
        assert data["promo_types"] == ["social", "purchase"]
        assert data["brands"] == ["Coca-Cola"]
        # Untouched fields keep their value
        assert data["email_digest"] is True
        assert prefs.promo_types == ["social", "purchase"]

    async def test_patch_rejects_invalid_type(self, auth_client):
        async with _client() as client:
            response = await client.patch("/users/me/preferences", json={"promo_types": ["vip"]})
        assert response.status_code == 422

    async def test_patch_rejects_invalid_hour(self, auth_client):
        async with _client() as client:
            response = await client.patch("/users/me/preferences", json={"digest_hour": 24})
        assert response.status_code == 422
