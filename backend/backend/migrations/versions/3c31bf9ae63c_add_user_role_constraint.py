
"""Add user role constraint."""

from typing import Sequence, Union

from alembic import op


revision: str = "3c31bf9ae63c"
down_revision: Union[str, Sequence[str], None] = "248996c122f9"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_check_constraint(
        "ck_user_role",
        "users",
        "role IN ('customer', 'owner', 'admin')",
    )


def downgrade() -> None:
    op.drop_constraint(
        "ck_user_role",
        "users",
        type_="check",
    )