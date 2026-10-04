
from datetime import datetime

from sqlalchemy import (
    CheckConstraint,
    DateTime,
    ForeignKey,
    Integer,
    String,
    UniqueConstraint,
    func,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class Reservation(Base):
    __tablename__ = "reservations"

    __table_args__ = (
        CheckConstraint(
            "guest_count > 0",
            name="ck_reservation_guest_count",
        ),
        CheckConstraint(
            "end_time > start_time",
            name="ck_reservation_time",
        ),
        CheckConstraint(
            "status IN ('pending', 'confirmed', 'cancelled', 'seated', 'completed')",
            name="ck_reservation_status",
        ),
        UniqueConstraint(
            "booking_reference",
            name="uq_booking_reference",
        ),
    )

    id: Mapped[int] = mapped_column(
        Integer, primary_key=True, index=True
    )

    booking_reference: Mapped[str] = mapped_column(
        String(40), nullable=False
    )

    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="RESTRICT"),
        nullable=False,
        index=True,
    )

    restaurant_id: Mapped[int] = mapped_column(
        ForeignKey("restaurants.id", ondelete="RESTRICT"),
        nullable=False,
        index=True,
    )

    table_id: Mapped[int] = mapped_column(
        ForeignKey("restaurant_tables.id", ondelete="RESTRICT"),
        nullable=False,
        index=True,
    )

    guest_count: Mapped[int] = mapped_column(
        Integer, nullable=False
    )

    start_time: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        index=True,
    )

    end_time: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
    )

    status: Mapped[str] = mapped_column(
        String(20),
        nullable=False,
        default="confirmed",
        index=True,
    )

    customer_name: Mapped[str | None] = mapped_column(
        String(150), nullable=True
    )

    customer_email: Mapped[str | None] = mapped_column(
        String(255), nullable=True
    )

    customer_phone: Mapped[str | None] = mapped_column(
        String(50), nullable=True
    )

    special_request: Mapped[str | None] = mapped_column(
        String(500), nullable=True
    )

    policy_version_accepted: Mapped[int | None] = mapped_column(
        Integer, nullable=True
    )

    accepted_policy_terms: Mapped[str | None] = mapped_column(
        String(1000), nullable=True
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
    )

    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
        onupdate=func.now(),
    )

    restaurant: Mapped["Restaurant"] = relationship(
        "Restaurant",
        back_populates="reservations",
    )

    table: Mapped["RestaurantTable"] = relationship(
        "RestaurantTable",
        back_populates="reservations",
    )

    user: Mapped["User"] = relationship(
        "User",
        back_populates="reservations",
    )

    assignment_history: Mapped[list["TableAssignmentHistory"]] = relationship(
        "TableAssignmentHistory",
        back_populates="reservation",
        cascade="all, delete-orphan",
    )