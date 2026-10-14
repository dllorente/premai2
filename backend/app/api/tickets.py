import logging
import uuid
from pathlib import Path

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from app.core.config import settings
from app.core.deps import get_current_user, get_db
from app.models.ticket import Ticket
from app.models.ticket_feedback import TicketFeedback
from app.models.user import User
from app.schemas.ticket import TicketOut, TicketUploadResponse

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/tickets", tags=["tickets"])

_ALLOWED_MIME = {"image/jpeg", "image/png", "image/webp", "image/heic"}


@router.post("/upload", response_model=TicketUploadResponse, status_code=status.HTTP_202_ACCEPTED)
async def upload_ticket(
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> TicketUploadResponse:
    if file.content_type not in _ALLOWED_MIME:
        raise HTTPException(
            status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
            detail=f"Unsupported file type: {file.content_type}",
        )

    file_id = uuid.uuid4().hex
    ext = Path(file.filename or "ticket.jpg").suffix or ".jpg"
    relative_path = f"{current_user.id}/{file_id}{ext}"
    dest = Path(settings.UPLOAD_DIR) / relative_path
    dest.parent.mkdir(parents=True, exist_ok=True)

    content = await file.read()
    dest.write_bytes(content)

    ticket = Ticket(user_id=current_user.id, image_path=relative_path, status="pending")
    db.add(ticket)
    await db.commit()
    await db.refresh(ticket)

    logger.info("Ticket %d created — user=%d path=%s", ticket.id, current_user.id, relative_path)

    # Enqueue async processing
    try:
        from app.tasks.process_ticket import process_ticket

        process_ticket.delay(ticket.id)
        logger.debug("Ticket %d enqueued for OCR processing", ticket.id)
    except Exception as exc:  # noqa: BLE001
        # Celery not available in dev without broker — ticket stays pending
        logger.warning("Could not enqueue ticket %d: %s", ticket.id, exc)

    return TicketUploadResponse(
        ticket_id=ticket.id,
        status="pending",
        message="Ticket recibido. El procesamiento OCR comenzará en breve.",
    )


@router.get("/", response_model=list[TicketOut])
async def list_tickets(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> list[Ticket]:
    result = await db.execute(
        select(Ticket).where(Ticket.user_id == current_user.id).order_by(Ticket.created_at.desc())
    )
    return list(result.scalars().all())


@router.get("/{ticket_id}", response_model=TicketOut)
async def get_ticket(
    ticket_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> dict:
    ticket = await db.get(Ticket, ticket_id)
    if not ticket or ticket.user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Ticket not found")

    from app.models.promotion import Promotion
    from app.models.ticket_promotion import TicketPromotion

    ticket_promo = (
        await db.execute(select(TicketPromotion).where(TicketPromotion.ticket_id == ticket_id))
    ).scalar_one_or_none()

    promo_title: str | None = None
    matched_promo_id: int | None = None
    match_confidence: str | None = None
    if ticket_promo:
        matched_promo_id = ticket_promo.promotion_id
        match_confidence = ticket_promo.confidence
        promo = await db.get(Promotion, ticket_promo.promotion_id)
        promo_title = promo.title if promo else None

    data = {c.key: getattr(ticket, c.key) for c in ticket.__table__.columns}
    data["matched_promo_id"] = matched_promo_id
    data["match_confidence"] = match_confidence
    data["matched_promo_title"] = promo_title
    return data


class _FeedbackIn(BaseModel):
    vote: str  # "up" | "down"


@router.post("/{ticket_id}/feedback", status_code=status.HTTP_204_NO_CONTENT)
async def submit_feedback(
    ticket_id: int,
    body: _FeedbackIn,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> None:
    if body.vote not in ("up", "down"):
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="vote must be 'up' or 'down'"
        )
    ticket = await db.get(Ticket, ticket_id)
    if not ticket or ticket.user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Ticket not found")
    existing = (
        await db.execute(select(TicketFeedback).where(TicketFeedback.ticket_id == ticket_id))
    ).scalar_one_or_none()
    if existing:
        existing.vote = body.vote
    else:
        db.add(TicketFeedback(ticket_id=ticket_id, vote=body.vote))
    await db.commit()
    logger.info("feedback ticket_id=%s vote=%s user=%s", ticket_id, body.vote, current_user.id)
