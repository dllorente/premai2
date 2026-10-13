"""Integration tests for auth endpoints."""

from unittest.mock import AsyncMock, MagicMock

from httpx import ASGITransport, AsyncClient

from app.core.security import create_refresh_token, hash_password
from app.main import app
from app.models.user import User


def _mock_no_user(mock_db: AsyncMock) -> None:
    """Configure mock DB to return no user on execute."""
    result = MagicMock()
    result.scalar_one_or_none.return_value = None
    mock_db.execute = AsyncMock(return_value=result)


def _mock_existing_user(mock_db: AsyncMock, user: User) -> None:
    """Configure mock DB to return a specific user on execute."""
    result = MagicMock()
    result.scalar_one_or_none.return_value = user
    mock_db.execute = AsyncMock(return_value=result)


class TestRegister:
    async def test_new_user_returns_201_with_tokens(self, db_client):
        _mock_no_user(db_client)

        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            response = await client.post(
                "/auth/register",
                json={"email": "new@test.example.com", "password": "Test1234!"},
            )

        assert response.status_code == 201
        data = response.json()
        assert "access_token" in data
        assert "refresh_token" in data
        assert data["token_type"] == "bearer"
        db_client.add.assert_called_once()
        db_client.commit.assert_called_once()

    async def test_duplicate_email_returns_400(self, db_client, fake_user):
        _mock_existing_user(db_client, fake_user)

        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            response = await client.post(
                "/auth/register",
                json={"email": fake_user.email, "password": "Test1234!"},
            )

        assert response.status_code == 400
        assert "already registered" in response.json()["detail"]

    async def test_missing_fields_returns_422(self, anon_client):
        async with anon_client as client:
            response = await client.post("/auth/register", json={"email": "only@email.com"})
        assert response.status_code == 422


class TestLogin:
    async def test_valid_credentials_returns_tokens(self, db_client, fake_user):
        fake_user.hashed_password = hash_password("Correct1!")
        _mock_existing_user(db_client, fake_user)

        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            response = await client.post(
                "/auth/login",
                json={"email": fake_user.email, "password": "Correct1!"},
            )

        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
        assert "refresh_token" in data

    async def test_wrong_password_returns_401(self, db_client, fake_user):
        fake_user.hashed_password = hash_password("CorrectPassword1!")
        _mock_existing_user(db_client, fake_user)

        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            response = await client.post(
                "/auth/login",
                json={"email": fake_user.email, "password": "WrongPassword!"},
            )

        assert response.status_code == 401

    async def test_unknown_email_returns_401(self, db_client):
        _mock_no_user(db_client)

        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            response = await client.post(
                "/auth/login",
                json={"email": "ghost@nowhere.example.com", "password": "any"},
            )

        assert response.status_code == 401

    async def test_inactive_user_returns_401(self, db_client, fake_user):
        fake_user.is_active = False
        fake_user.hashed_password = hash_password("Pass123!")
        _mock_existing_user(db_client, fake_user)

        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            response = await client.post(
                "/auth/login",
                json={"email": fake_user.email, "password": "Pass123!"},
            )

        assert response.status_code == 401


class TestRefresh:
    async def test_valid_refresh_token_returns_new_tokens(self, db_client, fake_user):
        fake_user.is_active = True
        _mock_existing_user(db_client, fake_user)
        token = create_refresh_token(fake_user.email)

        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            response = await client.post(
                "/auth/refresh",
                json={"refresh_token": token},
            )

        assert response.status_code == 200
        assert "access_token" in response.json()

    async def test_access_token_as_refresh_returns_401(self, anon_client):
        """Using an access token (wrong type) as refresh token must fail."""
        from app.core.security import create_access_token

        access_token = create_access_token("someone@example.com")

        async with anon_client as client:
            response = await client.post(
                "/auth/refresh",
                json={"refresh_token": access_token},
            )

        assert response.status_code == 401

    async def test_garbage_token_returns_401(self, anon_client):
        async with anon_client as client:
            response = await client.post(
                "/auth/refresh",
                json={"refresh_token": "not.a.real.token"},
            )
        assert response.status_code == 401


class TestMe:
    async def test_authenticated_returns_user_profile(self, auth_client, fake_user):
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            response = await client.get(
                "/auth/me",
                headers={"Authorization": "Bearer faketoken"},
            )

        assert response.status_code == 200
        data = response.json()
        assert data["email"] == fake_user.email
        assert "hashed_password" not in data

    async def test_unauthenticated_returns_401(self, anon_client):
        async with anon_client as client:
            response = await client.get("/auth/me")
        assert response.status_code == 401
