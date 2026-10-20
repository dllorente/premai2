import logging

from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.deps import get_current_user, get_db
from app.models.user import User
from app.models.user_preferences import UserPreferences
from app.schemas.auth import UserResponse
from app.schemas.user import PreferencesOut, PreferencesUpdate, UserUpdate

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/users", tags=["users"])


async def _get_or_create_preferences(db: AsyncSession, user: User) -> UserPreferences:
    result = await db.execute(select(UserPreferences).where(UserPreferences.user_id == user.id))
    prefs = result.scalar_one_or_none()
    if prefs is None:
        prefs = UserPreferences(
            user_id=user.id, promo_types=[], brands=[], email_digest=True, digest_hour=8
        )
        db.add(prefs)
        await db.commit()
        await db.refresh(prefs)
        logger.info("Created default preferences for user_id=%s", user.id)
    return prefs


def _to_out(prefs: UserPreferences) -> PreferencesOut:
    return PreferencesOut(
        promo_types=prefs.promo_types,
        brands=prefs.brands,
        email_digest=prefs.email_digest,
        digest_hour=prefs.digest_hour,
        telegram_linked=prefs.telegram_chat_id is not None,
    )


@router.get("/me", response_model=UserResponse)
async def get_me(current_user: User = Depends(get_current_user)) -> User:
    return current_user


@router.patch("/me", response_model=UserResponse)
async def update_me(
    body: UserUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> User:
    if "full_name" in body.model_fields_set:
        current_user.full_name = body.full_name.strip() if body.full_name else None
    db.add(current_user)
    await db.commit()
    await db.refresh(current_user)
    return current_user


@router.get("/me/preferences", response_model=PreferencesOut)
async def get_preferences(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> PreferencesOut:
    return _to_out(await _get_or_create_preferences(db, current_user))


@router.patch("/me/preferences", response_model=PreferencesOut)
async def update_preferences(
    body: PreferencesUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> PreferencesOut:
    prefs = await _get_or_create_preferences(db, current_user)
    changes = body.model_dump(exclude_unset=True, exclude_none=True)
    if "promo_types" in changes:
        changes["promo_types"] = [t.value for t in body.promo_types or []]
    for field, value in changes.items():
        setattr(prefs, field, value)
    await db.commit()
    await db.refresh(prefs)
    logger.info("Updated preferences user_id=%s fields=%s", current_user.id, list(changes))
    return _to_out(prefs)
