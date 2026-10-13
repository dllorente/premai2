import json
from datetime import datetime

from pydantic import BaseModel, field_validator


class TicketOut(BaseModel):
    id: int
    user_id: int
    image_path: str | None
    status: str
    store: str | None
    purchased_at: datetime | None
    total_amount: float | None
    ticket_number: str | None
    brands: list[str]
    products: list[dict]
    raw_text: str | None
    ocr_provider: str | None
    ocr_error: str | None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}

    @field_validator("brands", mode="before")
    @classmethod
    def parse_brands(cls, v: object) -> list:
        if isinstance(v, str):
            return json.loads(v)  # type: ignore[no-any-return]
        return list(v) if isinstance(v, list) else []

    @field_validator("products", mode="before")
    @classmethod
    def parse_products(cls, v: object) -> list:
        if isinstance(v, str):
            return json.loads(v)  # type: ignore[no-any-return]
        return list(v) if isinstance(v, list) else []


class TicketUploadResponse(BaseModel):
    ticket_id: int
    status: str
    message: str
