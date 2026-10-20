# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased] — Sprint 5 — Perfil, notificaciones y bots

### Added (Sprint 5.1 — preferencias de usuario)
- `backend/app/models/user_preferences.py` — tabla `user_preferences` (1:1 con `users`, `ON DELETE CASCADE`): `promo_types` y `brands` (listas JSON; vacía = todas), `email_digest`, `digest_hour` (0–23, por defecto 8), `telegram_chat_id` (único, para Sprint 5.8)
- `backend/alembic/versions/a7c3e91f5b20_add_user_preferences_table.py` — migración (probada upgrade/downgrade en PostgreSQL 16)
- `backend/app/api/users.py` — `GET/PATCH /users/me` (editar `full_name`) y `GET/PATCH /users/me/preferences` (actualización parcial; crea preferencias por defecto en la primera lectura)
- `backend/app/schemas/user.py` — validación: tipos de promo del enum `PromoType`, marcas sin duplicados (case-insensitive) ni vacías, máx. 50 marcas
- `backend/tests/test_users.py` — 8 tests de los nuevos endpoints

## [Unreleased] — Sprint 4 — PromoType + Análisis IA + Dev UX

### Added (Sprint 4 — tipo de promo, extracción legal, endpoint promos, dev script)
- `backend/app/models/user.py` — campo `full_name: str | None` en modelo User; capturado automáticamente por Google OAuth (nombre + email)
- `backend/alembic/versions/` — migración `add_full_name_to_users`
- `backend/app/models/promotion.py` — enum `PromoType` (social / free / purchase) y columna `promo_type` indexada en `Promotion`
- `backend/alembic/versions/` — migración `add_promo_type_to_promotions` con `CREATE TYPE promotype` manual (autogenerate de Alembic no emite el `CREATE TYPE` en PostgreSQL)
- `backend/app/models/promotion.py` — columna `legal_summary: Text | None` en `Promotion`
- `backend/alembic/versions/` — migración `add_legal_summary_to_promotions`
- `backend/app/api/promos.py` — `GET /promos/`: lista promos activas; filtro opcional `?promo_type=social|free|purchase`; paginación (`limit` máx 200); autenticado con Bearer
- `backend/app/main.py` — registrado `promos_router` en `/promos`
- `backend/app/agents/promo_scraper.py` — prompt actualizado: Claude Haiku extrae `promo_type` y `legal_summary` (1–2 frases en español) del HTML; `upsert_db` persiste ambos campos
- `frontend/src/lib/promos.ts` — tipo `PromoType`, interface `Promo` con campos nuevos, `fetchPromos(promo_type?)`
- `frontend/src/app/(dashboard)/promos/page.tsx` — página reescrita: pills de filtro (Todas / Sorteos / Gratis / Cashback), `PromoCard` con badge de tipo en colores semánticos, llamadas reales a la API vía React Query
- `package.json` (raíz) — `npm run dev` con `concurrently` arranca frontend + backend simultáneamente con output etiquetado; `npm run dev:all` añade ngrok

## [Unreleased] — Sprint 3.7b — Quick Wins (UX)

### Added (Quick Wins — "Cómo funciona" + FAQ accordion)
- `frontend/src/app/(dashboard)/inicio/page.tsx` — sección "¿Cómo funciona?" con 4 pasos (📸 Sube tu ticket → 🤖 IA lo analiza → 🎯 Detectamos promos → 💰 Cobra el reembolso); iconos sobre fondo primary, layout flex con descripción
- `frontend/src/app/(dashboard)/ajustes/page.tsx` — reemplaza stub por FAQ accordion interactivo (6 preguntas: OCR, supermercados, cobro, gratuidad, tipos de promo, sugerir URL); `useState<number|null>` para open/close; tarjeta de versión al fondo (PremAI2 · Sprint 3.7 · Octubre 2026)

## [Unreleased] — Sprint 3.7 — Discovery Agent

### Added (Sprint 3.7 — Tavily web discovery + manual URL submission)
- `backend/app/services/discovery/searcher.py` — `discover_promo_urls()`: busca promos nuevas en internet con Tavily usando 5 queries predefinidas; devuelve URLs deduplicadas ordenadas por score
- `backend/app/tasks/discover_promos.py` — Celery task `discover_new_promos`: ejecuta el discovery, hace upsert en `promo_sources` con `source_type="discovered"`, lanza `scrape_source` por cada URL nueva
- `backend/app/api/promo_sources.py` — `POST /promo-sources/submit`: endpoint autenticado para que el usuario envíe una URL manualmente; crea `PromoSource` y lanza scraping inmediato
- `backend/app/core/config.py` — campo `TAVILY_API_KEY`
- `frontend/src/lib/promos.ts` — función `submitPromoUrl(url, brand?)` + interface `SubmitPromoResult`
- `frontend/src/app/(dashboard)/promos/page.tsx` — pantalla de promos reescrita: banner "Sugerir promo" con CTA, bottom sheet modal con formulario URL + marca opcional, feedback visual de resultado

## [Unreleased] — Sprint 3.6 — PII Sanitization + Security + OCR Refactor

### Added (Sprint 3.6 — PII sanitization + prompt injection guardrail + OCR fallback)
- `backend/app/services/ocr/sanitizer.py` — `sanitize_ticket_text()`: strips IBAN, NIF/NIE, card numbers, and phone numbers from raw OCR text using regex before persisting to DB
- `backend/app/tasks/process_ticket.py` — applies `sanitize_ticket_text()` to `raw_text` before saving; PII never reaches the database
- `backend/app/services/ocr/base.py` — added prompt injection guardrail: system prompt now instructs Claude to return `{"error":"INVALID_INPUT"}` if the ticket image contains embedded instructions
- `backend/app/services/ocr/factory.py` — replaced parallel ensemble (pays all providers) with sequential fallback: tries providers in order, stops at first success; cheaper and equally resilient

## [Unreleased] — Sprint 3.4 + 3.5 — OCR Match + Ticket Detail Screen

### Added (Sprint 3.5 — Ticket detail screen + feedback)
- `backend/app/models/ticket_feedback.py` — `TicketFeedback` ORM model (`ticket_id`, `vote: up|down`, `created_at`); one feedback per ticket enforced via unique constraint
- `backend/app/api/tickets.py` — `POST /tickets/{id}/feedback`: guarda o actualiza el voto 👍/👎; `GET /tickets/{id}` enriquecido con `matched_promo_id`, `match_confidence`, `matched_promo_title` consultando `ticket_promotions`
- `backend/app/schemas/ticket.py` — `TicketOut` añade campos `matched_promo_id`, `match_confidence`, `matched_promo_title`
- `frontend/src/lib/tickets.ts` — funciones `getTicket(id)` y `submitFeedback(ticketId, vote)` + campos nuevos en interface `Ticket`
- `frontend/src/components/TicketScreen.tsx` — nuevo componente `TicketDetail`: bottom sheet al tocar un ticket, muestra datos OCR, promo matchada con badge de confianza, botones 👍/👎 con estado post-voto

### Added (Sprint 3.4 — Match ticket ↔ promo en OCR)
- `backend/app/models/ticket_promotion.py` — junction table `ticket_promotions` (ticket_id, promotion_id, confidence, matched_at)
- `backend/app/models/ticket.py` — relación `promotions` back-reference a `TicketPromotion`
- `backend/app/models/promotion.py` — relación `ticket_matches` back-reference a `TicketPromotion`
- `backend/app/services/ocr/base.py` — `OCRResult` con campos `matched_promo_id` / `match_confidence`; `build_ocr_prompt(active_promos)` inyecta lista de promos activas en el prompt
- `backend/app/services/ocr/claude_client.py` — usa `build_ocr_prompt()`, extrae `matched_promo_id` y `match_confidence` del JSON de Claude; header `anthropic-workspace-id` para claves `sk-ant-usr-*`
- `backend/app/services/ocr/factory.py`, `openai_client.py`, `gemini_client.py` — firma `extract()` actualizada con parámetro `active_promos`
- `backend/app/tasks/process_ticket.py` — `_fetch_active_promos()` carga promos activas; `_save_match()` persiste el match; result dict incluye `matched_promo_id`
- `backend/app/core/config.py` — campo `ANTHROPIC_WORKSPACE_ID`; `env_file=".env"` apunta a `backend/.env`
- Logging completo en scraper, OCR y proceso de ticket
- `backend/alembic/versions/` — migraciones para `ticket_promotions` y `ticket_feedbacks`

## [Unreleased] — Sprint 2.x — Camera + View Mode + Architecture Analysis

### Added
- `frontend/src/components/DashboardShell.tsx` — DashboardShell con toggle App/Web: modo app muestra phone frame (iPhone/Android/Tablet) con notch; modo web muestra TopNav + layout desktop centrado a 1080px
- `frontend/src/contexts/ViewModeContext.tsx` — React context para modo app/web, persistido en localStorage
- `frontend/src/app/(dashboard)/layout.tsx` — simplificado: wrap con `ViewModeProvider` + `DashboardShell`
- Camera modal en `TicketScreen.tsx` vía `getUserMedia` (funciona en Chrome DevTools con webcam y en móvil con cámara trasera); botón galería mantiene `<input type="file">`
- `.gitignore` — añadido `backend/uploads/` para no versionar subidas locales

### Fixed
- `frontend/src/app/page.tsx` — ruta raíz simplificada; routing auth movido a middleware para evitar bloqueo de prerender con `cookies()`
- `frontend/src/middleware.ts` — añadido `pathname === "/"` al check de redirect para usuarios autenticados
- Bottom nav nunca queda tapada por contenido: `InlineBottomNav` usa flujo normal (no `position:fixed`) dentro del flex column del phone frame; `paddingBottom: 24` en inicio page

### Removed
- `pdfplumber` eliminado de dependencias de producción (era solo para análisis local de PDFs de arquitectura)

## [Unreleased] — Sprint 2 complete

### Added (Project completeness — tests & quality)
- `backend/tests/test_health.py` — health endpoint tests (public access, response shape)
- `backend/tests/test_auth.py` — 13 auth tests: register (201/400/422), login (200/401 wrong-pass/unknown/inactive), refresh (200/401 wrong-type/garbage), me (200/401)
- `backend/tests/conftest.py` — added `db_client` fixture for auth endpoints

### Fixed
- `backend/app/api/auth.py` — login endpoint now rejects inactive users (was missing `is_active` check, caught by test)

### Added (Task 2.6 — Integration tests)
- `backend/tests/conftest.py` — shared fixtures: `fake_user`, `fake_ticket`, `mock_db`, `auth_client` (FastAPI dependency overrides + tmp_path for uploads), `anon_client`
- `backend/tests/test_tickets.py` — 15 tests covering: OCRResult unit tests, Claude OCR client mock, upload 401/415/202/Celery enqueue/DB persist, list tickets (own/empty), get ticket (own/404/other-user)

### Added (Task 2.5 — Frontend UX)
- `frontend/src/components/BottomNav.tsx` — 5-tab bottom navigation (Inicio, Promos, Ticket FAB, Perfil, Más) with active-state highlighting via `usePathname`
- `frontend/src/components/TicketScreen.tsx` — ticket upload screen: camera/gallery buttons, React Query polling list, per-status chips (valid/invalid/processing/pending)
- `frontend/src/app/(dashboard)/inicio/page.tsx` — Inicio screen: indigo header, points card, 3 brand promo cards (Coca-Cola, Danone, Nestlé) with gradient backgrounds and progress bars
- `frontend/src/app/(dashboard)/tickets/page.tsx` — tickets route wrapping `TicketScreen`
- `frontend/src/lib/tickets.ts` — `uploadTicket()` and `getTickets()` API functions + `Ticket` TypeScript interface
- `frontend/src/app/globals.css` — design tokens via `@layer base`: primary (#4F46E5), secondary (#7C3AED), teal (#34D399), amber (#F59E0B), bg/card/border/text variables
- Fonts migrated to `next/font/google` (Syne 700/800 + DM Sans 400–700)
- `backend/fixtures/dev_user.json` — dev test user seed credentials
- `.claude/launch.json` — Next.js dev server config for browser preview

### Added (Task 2.7 — Fixes & stubs)
- Dev credentials pre-loaded in login page (`NODE_ENV=development`); amber badge to signal test mode
- Stub pages for `/promos`, `/perfil`, `/ajustes` — navigation no longer 404s
- `backend/fixtures/dev_user.json` — test user seed for local dev

### Fixed
- `(dashboard)/layout.tsx` — removed redundant `cookies()` check; middleware handles auth, eliminating Next.js prerender blocking warning
- Login post-auth redirect changed from `/dashboard` (404) to `/inicio`
- Middleware authenticated redirect updated to `/inicio`
- Root `app/page.tsx` redirect updated to `/inicio`; dashboard home moved to `(dashboard)/inicio/` to avoid route collision

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
