"""add_promo_type_to_promotions

Revision ID: 0d87067104db
Revises: 92fb28309dd7
Create Date: 2026-10-15 18:04:49.287673

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '0d87067104db'
down_revision: Union[str, Sequence[str], None] = '92fb28309dd7'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    promotype = sa.Enum('social', 'free', 'purchase', name='promotype')
    promotype.create(op.get_bind(), checkfirst=True)
    op.add_column('promotions', sa.Column('promo_type', promotype, nullable=True))
    op.create_index(op.f('ix_promotions_promo_type'), 'promotions', ['promo_type'], unique=False)


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_index(op.f('ix_promotions_promo_type'), table_name='promotions')
    op.drop_column('promotions', 'promo_type')
    sa.Enum(name='promotype').drop(op.get_bind(), checkfirst=True)
