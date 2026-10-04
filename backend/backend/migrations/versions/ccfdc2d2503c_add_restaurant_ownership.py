
"""Add restaurant ownership."""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "ccfdc2d2503c"
down_revision: Union[str, Sequence[str], None] = "3c31bf9ae63c"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "restaurants",
        sa.Column("owner_id", sa.Integer(), nullable=True),
    )
    op.create_index(
        "ix_restaurants_owner_id",
        "restaurants",
        ["owner_id"],
        unique=False,
    )
    op.create_foreign_key(
        "fk_restaurants_owner_id_users",
        "restaurants",
        "users",
        ["owner_id"],
        ["id"],
        ondelete="RESTRICT",
    )


def downgrade() -> None:
    op.drop_constraint(
        "fk_restaurants_owner_id_users",
        "restaurants",
        type_="foreignkey",
    )
    op.drop_index(
        "ix_restaurants_owner_id",
        table_name="restaurants",
    )
    op.drop_column("restaurants", "owner_id")