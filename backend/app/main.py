from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.auth import router as auth_router
from app.api.tickets import router as tickets_router
from app.core.logging import setup_logging

setup_logging()

app = FastAPI(title="PremAI2 API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router)
app.include_router(tickets_router)


@app.get("/health")
async def health():
    return {"status": "ok"}
