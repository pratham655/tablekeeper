"""Add a positive-capacity constraint to restaurant tables."""

from typing import Sequence, Union

from alembic import op

revision: str = "d4966db1aa64"
down_revision: Union[str, Sequence[str], None] = "00b48ac8e018"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_check_constraint(
        "ck_restaurant_table_capacity_positive",
        "restaurant_tables",
        "capacity > 0",
    )


def downgrade() -> None:
    op.drop_constraint(
        "ck_restaurant_table_capacity_positive",
        "restaurant_tables",
        type_="check",
    )
