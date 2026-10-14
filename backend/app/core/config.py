from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    DATABASE_URL: str = "postgresql+asyncpg://premai:premai_secret@localhost:5432/premai_db"
    REDIS_URL: str = "redis://localhost:6379/0"

    SECRET_KEY: str = "change_me_in_production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    ENVIRONMENT: str = "development"
    DEBUG: bool = True

    # OCR providers
    OCR_PROVIDER: str = "claude"  # claude | gemini | openai | ensemble
    OCR_ENSEMBLE_PROVIDERS: list[str] = ["claude", "gemini"]
    ANTHROPIC_API_KEY: str = ""
    ANTHROPIC_WORKSPACE_ID: str = ""
    GEMINI_API_KEY: str = ""
    OPENAI_API_KEY: str = ""

    UPLOAD_DIR: str = "uploads/tickets"


settings = Settings()
