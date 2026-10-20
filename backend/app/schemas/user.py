from pydantic import BaseModel, Field, field_validator

from app.models.promotion import PromoType


class UserUpdate(BaseModel):
    full_name: str | None = Field(None, max_length=255)


class PreferencesOut(BaseModel):
    promo_types: list[PromoType]
    brands: list[str]
    email_digest: bool
    digest_hour: int
    telegram_linked: bool


class PreferencesUpdate(BaseModel):
    """Partial update — only fields sent are changed."""

    promo_types: list[PromoType] | None = None
    brands: list[str] | None = Field(None, max_length=50)
    email_digest: bool | None = None
    digest_hour: int | None = Field(None, ge=0, le=23)

    @field_validator("brands")
    @classmethod
    def _clean_brands(cls, v: list[str] | None) -> list[str] | None:
        if v is None:
            return v
        seen: dict[str, str] = {}
        for brand in v:
            name = brand.strip()[:100]
            if name and name.lower() not in seen:
                seen[name.lower()] = name
        return list(seen.values())

    @field_validator("promo_types")
    @classmethod
    def _dedupe_types(cls, v: list[PromoType] | None) -> list[PromoType] | None:
        return list(dict.fromkeys(v)) if v is not None else v
