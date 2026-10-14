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
| Frontend web | Next.js 15 (PWA, App Router) |
| Mobile (planned) | React Native + Expo (iOS & Android) |
| Infra | Docker Compose |
| CI/CD | GitHub Actions → GHCR |

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

```bash
# 7. Start the frontend (separate terminal)
cd frontend
npm install
npm run dev
```

Frontend available at `http://localhost:3000`

## Project Structure

```
premai2/
├── backend/               # FastAPI application
│   ├── app/
│   │   ├── api/           # Route handlers
│   │   ├── core/          # Config, security, deps, logging
│   │   ├── db/            # SQLAlchemy engine & base
│   │   ├── models/        # ORM models
│   │   ├── schemas/       # Pydantic request/response models
│   │   ├── services/      # Business logic
│   │   ├── agents/        # AI agents
│   │   └── tasks/         # Celery tasks
│   ├── alembic/           # Database migrations
│   ├── tests/
│   └── Dockerfile
├── frontend/              # Next.js 16 PWA
│   └── src/
│       ├── app/           # App Router pages (inicio, tickets, promos, perfil, ajustes)
│       ├── components/    # DashboardShell (App/Web toggle), TicketScreen (camera+gallery), shared UI
│       ├── contexts/      # ViewModeContext (app/web mode, persisted in localStorage)
│       ├── lib/           # API client, auth helpers, tickets API
│       └── middleware.ts  # Route protection
├── infra/                 # Docker Compose
│   └── docker-compose.yml
├── logs/                  # Daily rotating logs (gitignored)
└── .github/workflows/     # CI/CD pipeline
```

## API Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/health` | — | Health check |
| POST | `/auth/register` | — | Create account |
| POST | `/auth/login` | — | Get tokens |
| POST | `/auth/refresh` | — | Rotate tokens |
| GET | `/auth/me` | Bearer | Current user |
| POST | `/tickets/upload` | Bearer | Upload ticket image (OCR async) |
| GET | `/tickets/` | Bearer | List user tickets |
| GET | `/tickets/{id}` | Bearer | Get ticket detail (includes matched promo) |
| POST | `/tickets/{id}/feedback` | Bearer | Submit 👍/👎 OCR accuracy feedback |

## Development

```bash
# Run pre-commit hooks manually
cd backend
poetry run pre-commit run --all-files -c ../.pre-commit-config.yaml

# Create a new migration after model changes
poetry run alembic revision --autogenerate -m "description"
poetry run alembic upgrade head

# View logs
tail -f ../logs/premai2.log
```

## Roadmap

| Sprint | Feature |
|--------|---------|
| ✅ 1 | Foundations: auth, CI/CD, Docker, Next.js |
| ✅ 2 | OCR Agent — ticket ingestion, mobile-first UI, integration tests |
| 3 | Promo Scraper Agent |
| 4 | Legal RAG Agent |
| 5 | Auto-participation with Playwright |
| 6 | Reports & notifications |
| 7 | Observability & security |
| 8 | Production deploy |
| 9+ | Mobile app (iOS & Android with React Native + Expo) |

**Planned auth additions:** Google OAuth (Sprint 2+)

## License

Private — all rights reserved.
