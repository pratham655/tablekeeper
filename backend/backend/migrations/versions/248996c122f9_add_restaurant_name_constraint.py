
"""Add non-empty restaurant name constraint."""

from typing import Sequence, Union

from alembic import op


revision: str = "248996c122f9"
down_revision: Union[str, Sequence[str], None] = "79b7f40853a5"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_check_constraint(
        "ck_restaurant_name_not_empty",
        "restaurants",
        "length(trim(name)) > 0",
    )


def downgrade() -> None:
    op.drop_constraint(
        "ck_restaurant_name_not_empty",
        "restaurants",
        type_="check",
    )