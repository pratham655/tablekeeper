"""Add policies, audit log, table status, and extended reservation details.

Revision ID: e5a892b10f3c
Revises: ccfdc2d2503c
Create Date: 2026-10-04
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "e5a892b10f3c"
down_revision: Union[str, Sequence[str], None] = "ccfdc2d2503c"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. Restaurant policies
    op.add_column(
        "restaurants",
        sa.Column(
            "cancellation_hours",
            sa.Integer(),
            nullable=False,
            server_default="2",
        ),
    )
    op.add_column(
        "restaurants",
        sa.Column(
            "late_arrival_minutes",
            sa.Integer(),
            nullable=False,
            server_default="15",
        ),
    )
    op.add_column(
        "restaurants",
        sa.Column(
            "reservation_duration_minutes",
            sa.Integer(),
            nullable=False,
            server_default="90",
        ),
    )
    op.add_column(
        "restaurants",
        sa.Column(
            "max_party_size",
            sa.Integer(),
            nullable=False,
            server_default="10",
        ),
    )
    op.add_column(
        "restaurants",
        sa.Column("policy_terms", sa.Text(), nullable=True),
    )
    op.add_column(
        "restaurants",
        sa.Column(
            "policy_version",
            sa.Integer(),
            nullable=False,
            server_default="1",
        ),
    )

    # 2. Table status
    op.add_column(
        "restaurant_tables",
        sa.Column(
            "status",
            sa.String(length=30),
            nullable=False,
            server_default="available",
        ),
    )

    # 3. Reservation extensions
    op.add_column(
        "reservations",
        sa.Column("customer_name", sa.String(length=150), nullable=True),
    )
    op.add_column(
        "reservations",
        sa.Column("customer_email", sa.String(length=255), nullable=True),
    )
    op.add_column(
        "reservations",
        sa.Column("customer_phone", sa.String(length=50), nullable=True),
    )
    op.add_column(
        "reservations",
        sa.Column("special_request", sa.Text(), nullable=True),
    )
    op.add_column(
        "reservations",
        sa.Column("policy_version_accepted", sa.Integer(), nullable=True),
    )
    op.add_column(
        "reservations",
        sa.Column("accepted_policy_terms", sa.Text(), nullable=True),
    )

    # 4. Update status check constraint on reservations
    op.drop_constraint("ck_reservation_status", "reservations", type_="check")
    op.create_check_constraint(
        "ck_reservation_status",
        "reservations",
        "status IN ('pending', 'confirmed', 'cancelled', 'seated', 'completed')",
    )

    # 5. Table Assignment History (Audit Log)
    op.create_table(
        "table_assignment_history",
        sa.Column("id", sa.Integer(), primary_key=True, index=True),
        sa.Column(
            "reservation_id",
            sa.Integer(),
            sa.ForeignKey("reservations.id", ondelete="CASCADE"),
            nullable=False,
            index=True,
        ),
        sa.Column(
            "original_table_id",
            sa.Integer(),
            sa.ForeignKey("restaurant_tables.id", ondelete="SET NULL"),
            nullable=True,
            index=True,
        ),
        sa.Column(
            "new_table_id",
            sa.Integer(),
            sa.ForeignKey("restaurant_tables.id", ondelete="SET NULL"),
            nullable=True,
            index=True,
        ),
        sa.Column(
            "changed_by_user_id",
            sa.Integer(),
            sa.ForeignKey("users.id", ondelete="SET NULL"),
            nullable=True,
            index=True,
        ),
        sa.Column("reason", sa.String(length=255), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.func.now(),
        ),
    )


def downgrade() -> None:
    op.drop_table("table_assignment_history")

    op.drop_constraint("ck_reservation_status", "reservations", type_="check")
    op.create_check_constraint(
        "ck_reservation_status",
        "reservations",
        "status IN ('pending', 'confirmed', 'cancelled')",
    )

    op.drop_column("reservations", "accepted_policy_terms")
    op.drop_column("reservations", "policy_version_accepted")
    op.drop_column("reservations", "special_request")
    op.drop_column("reservations", "customer_phone")
    op.drop_column("reservations", "customer_email")
    op.drop_column("reservations", "customer_name")

    op.drop_column("restaurant_tables", "status")

    op.drop_column("restaurants", "policy_version")
    op.drop_column("restaurants", "policy_terms")
    op.drop_column("restaurants", "max_party_size")
    op.drop_column("restaurants", "reservation_duration_minutes")
    op.drop_column("restaurants", "late_arrival_minutes")
    op.drop_column("restaurants", "cancellation_hours")
