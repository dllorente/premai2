# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Monorepo structure (backend, frontend, infra, .github/workflows)
- GitHub repo with branch protection and Dependabot security alerts
- Poetry 2.5.1 for Python dependency management
- Pre-commit hooks: ruff (lint) + ruff-format
- Docker Compose with PostgreSQL 16, Redis 7, ChromaDB, and API service
- SQLAlchemy 2.0 async setup with `AsyncSession`
- Alembic migrations — initial `create_users_table` migration
- `User` model with email, hashed_password, is_active, is_superuser, timestamps
- JWT authentication endpoints: register, login, refresh, /me
- Pydantic v2 schemas for auth request/response
- `.env.example` with all required environment variables
