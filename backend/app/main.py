from fastapi import FastAPI

from app.api.auth import router as auth_router

app = FastAPI(title="PremAI2 API", version="0.1.0")

app.include_router(auth_router)


@app.get("/health")
async def health():
    return {"status": "ok"}
