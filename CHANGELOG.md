# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased] — Sprint 2 in progress

### Added (Sprint 2 — OCR Agent)
- `backend/app/models/ticket.py` — `Ticket` ORM model with `purchased_at` (date+time), `brands`/`products` (JSON text), `ocr_provider`, `ocr_error`
- `backend/alembic/versions/e6276270121a_add_tickets_table.py` — migration creates `tickets` table with indexes on `user_id`, `status`, `ticket_number`
- `backend/app/services/ocr/` — multi-provider OCR package:
  - `base.py`: abstract `OCRClient` interface + `OCRResult` dataclass + shared system prompt
  - `claude_client.py`: Anthropic claude-haiku-4-5 Vision implementation
  - `gemini_client.py`: Google Gemini 1.5 Flash Vision via REST
  - `openai_client.py`: GPT-4o Vision implementation
  - `factory.py`: creates client from `OCR_PROVIDER` config (`claude|gemini|openai|ensemble`)
- `backend/app/api/tickets.py` — `POST /tickets/upload` (multipart image), `GET /tickets/`, `GET /tickets/{id}`
- `backend/app/tasks/process_ticket.py` — Celery task: reads image, calls OCR, updates ticket status
- `backend/app/schemas/ticket.py` — `TicketOut` and `TicketUploadResponse` Pydantic schemas
- `backend/tests/test_tickets.py` — unit tests for OCR parsing and upload endpoint
- `.env.example`: added `OCR_PROVIDER`, `OCR_ENSEMBLE_PROVIDERS`, `ANTHROPIC_API_KEY`, `GEMINI_API_KEY`, `OPENAI_API_KEY`, `UPLOAD_DIR`

## [Unreleased] — Sprint 1 complete

### Added
- Monorepo structure (backend/, frontend/, infra/, .github/workflows/)
- GitHub repo (private) with branch protection and Dependabot security alerts
- Poetry 2.5.1 for Python dependency management with `pyproject.toml`
- Pre-commit hooks: ruff lint + ruff-format (pre-commit), mypy + pytest (pre-push)
- Docker Compose with PostgreSQL 16, Redis 7, ChromaDB, and API service
- `backend/Dockerfile` — python:3.12-slim image with uvicorn
- SQLAlchemy 2.0 async engine and session factory (`AsyncSession`)
- Alembic migrations with async support — initial `create_users_table` migration
- `User` ORM model: email, hashed_password, is_active, is_superuser, timestamps
- JWT authentication: `POST /auth/register`, `POST /auth/login`, `POST /auth/refresh`, `GET /auth/me`
- Pydantic v2 schemas for all auth request/response models
- CORS middleware configured for `localhost:3000`
- Structured daily-rotating logs (`logs/premai2.log`, 30-day retention)
- GitHub Actions CI/CD: lint → test (with real postgres+redis) → Docker build & push to GHCR
- Next.js 15 frontend with App Router, TypeScript, Tailwind CSS
- Route protection via Next.js middleware (edge, cookie-based)
- Login and register pages with JWT token storage in cookies
- Protected dashboard layout with header and logout
- React Query (`@tanstack/react-query`) provider
- Axios client with automatic `Authorization: Bearer` injection
- `README.md` with setup instructions and project structure
- `.env.example` with all required environment variables

### Fixed
- Ruff version mismatch between pre-commit and CI (switched to local poetry hooks)
- `B008` false positive for FastAPI `Depends()` pattern (added to ruff ignore)
- `alembic/versions/` excluded from ruff (auto-generated code)
- Import order issues in `alembic/env.py` and `app/core/deps.py`
- Docker build cache error (added `setup-buildx-action`)
- Next.js prerender error with `cookies()` (replaced with middleware)
- `package-mode = false` in Poetry to prevent app-as-package install error in CI
