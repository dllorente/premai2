from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

import app.models as _models  # noqa: F401 — registers ORM models before routers load
from app.api.auth import router as auth_router
from app.api.promo_sources import router as promo_sources_router
from app.api.promos import router as promos_router
from app.api.tickets import router as tickets_router
from app.api.users import router as users_router
from app.core.logging import setup_logging

setup_logging()

app = FastAPI(title="PremAI2 API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    # Browsers reach the API through the Next.js /api proxy (same origin), so
    # only direct calls from localhost:3000 need CORS.
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router)
app.include_router(tickets_router)
app.include_router(promos_router)
app.include_router(promo_sources_router)
app.include_router(users_router)


@app.get("/health")
async def health():
    return {"status": "ok"}
