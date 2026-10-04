
"""Add reservation status constraint."""

from typing import Sequence, Union

from alembic import op


revision: str = "78243917fc53"
down_revision: Union[str, Sequence[str], None] = "d4966db1aa64"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_check_constraint(
        "ck_reservation_status",
        "reservations",
        "status IN ('pending', 'confirmed', 'cancelled')",
    )


def downgrade() -> None:
    op.drop_constraint(
        "ck_reservation_status",
        "reservations",
        type_="check",
    )