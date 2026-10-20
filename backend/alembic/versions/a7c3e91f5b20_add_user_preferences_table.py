"""add_user_preferences_table

Revision ID: a7c3e91f5b20
Revises: cde7809bcd06
Create Date: 2026-10-20 14:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'a7c3e91f5b20'
down_revision: Union[str, Sequence[str], None] = 'cde7809bcd06'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.create_table(
        'user_preferences',
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('promo_types', sa.JSON(), nullable=False),
        sa.Column('brands', sa.JSON(), nullable=False),
        sa.Column('email_digest', sa.Boolean(), nullable=False, server_default=sa.true()),
        sa.Column('digest_hour', sa.Integer(), nullable=False, server_default='8'),
        sa.Column('telegram_chat_id', sa.BigInteger(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('user_id'),
        sa.UniqueConstraint('telegram_chat_id'),
    )


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_table('user_preferences')
