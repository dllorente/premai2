# PremAI2

AI-powered system for detecting, analyzing, and auto-participating in brand promotions and sweepstakes.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend API | FastAPI + SQLAlchemy 2.0 (async) |
| Database | PostgreSQL 16 |
| Cache / Queue broker | Redis 7 |
| Vector store | ChromaDB |
| Migrations | Alembic |
| Auth | JWT (python-jose + passlib argon2) |
| Task queue | Celery |
| Frontend | Next.js 15 (PWA) |
| Infra | Docker Compose |
| CI | GitHub Actions |

## Prerequisites

- Python 3.12+
- Poetry 2.5.1
- Docker + Docker Compose
- Node.js 20+

## Local Setup

```bash
# 1. Clone
git clone https://github.com/dllorente/premai2.git
cd premai2

# 2. Copy env vars
cp .env.example .env

# 3. Start infrastructure (postgres, redis, chromadb)
cd infra
docker compose up -d postgres redis chromadb
cd ..

# 4. Install Python dependencies
cd backend
poetry install

# 5. Run database migrations
poetry run alembic upgrade head

# 6. Start the API
poetry run uvicorn app.main:app --reload
```

API available at `http://localhost:8000`  
Interactive docs at `http://localhost:8000/docs`

## Project Structure

```
premai2/
├── backend/               # FastAPI application
│   ├── app/
│   │   ├── api/           # Route handlers
│   │   ├── core/          # Config, security, dependencies
│   │   ├── db/            # SQLAlchemy engine & base
│   │   ├── models/        # ORM models
│   │   ├── schemas/       # Pydantic request/response models
│   │   ├── services/      # Business logic
│   │   ├── agents/        # AI agents
│   │   └── tasks/         # Celery tasks
│   ├── alembic/           # Database migrations
│   └── tests/
├── frontend/              # Next.js PWA
├── infra/                 # Docker Compose
└── .github/workflows/     # CI/CD
```

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| POST | `/auth/register` | Create account |
| POST | `/auth/login` | Get tokens |
| POST | `/auth/refresh` | Rotate tokens |
| GET | `/auth/me` | Current user |
| GET | `/health` | Health check |

## Development

```bash
# Run pre-commit hooks manually
cd backend
poetry run pre-commit run --all-files -c ../.pre-commit-config.yaml

# Create a new migration
poetry run alembic revision --autogenerate -m "description"
poetry run alembic upgrade head
```

## License

Private — all rights reserved.
