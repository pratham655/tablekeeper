
"""Add non-empty table number constraint."""

from typing import Sequence, Union

from alembic import op


revision: str = "79b7f40853a5"
down_revision: Union[str, Sequence[str], None] = "78243917fc53"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_check_constraint(
        "ck_restaurant_table_number_not_empty",
        "restaurant_tables",
        "length(trim(table_number)) > 0",
    )


def downgrade() -> None:
    op.drop_constraint(
        "ck_restaurant_table_number_not_empty",
        "restaurant_tables",
        type_="check",
    )