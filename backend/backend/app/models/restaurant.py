
from datetime import datetime

from sqlalchemy import (
    Boolean,
    CheckConstraint,
    DateTime,
    ForeignKey,
    Integer,
    String,
    Text,
    func,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class Restaurant(Base):
    __tablename__ = "restaurants"

    __table_args__ = (
        CheckConstraint(
            "length(trim(name)) > 0",
            name="ck_restaurant_name_not_empty",
        ),
    )

    id: Mapped[int] = mapped_column(
        Integer, primary_key=True, index=True
    )
    owner_id: Mapped[int | None] = mapped_column(
        ForeignKey("users.id", ondelete="RESTRICT"),
        nullable=True,
        index=True,
    )
    name: Mapped[str] = mapped_column(
        String(150), nullable=False, index=True
    )
    description: Mapped[str | None] = mapped_column(
        Text, nullable=True
    )
    address: Mapped[str] = mapped_column(
        String(300), nullable=False
    )
    city: Mapped[str] = mapped_column(
        String(100), nullable=False, index=True
    )
    cuisine: Mapped[str] = mapped_column(
        String(100), nullable=False, index=True
    )
    price_range: Mapped[str | None] = mapped_column(
        String(20), nullable=True
    )
    phone: Mapped[str | None] = mapped_column(
        String(30), nullable=True
    )
    image_url: Mapped[str | None] = mapped_column(
        String(500), nullable=True
    )
    is_active: Mapped[bool] = mapped_column(
        Boolean, nullable=False, default=True
    )
    cancellation_hours: Mapped[int] = mapped_column(
        Integer, nullable=False, default=2, server_default="2"
    )
    late_arrival_minutes: Mapped[int] = mapped_column(
        Integer, nullable=False, default=15, server_default="15"
    )
    reservation_duration_minutes: Mapped[int] = mapped_column(
        Integer, nullable=False, default=90, server_default="90"
    )
    max_party_size: Mapped[int] = mapped_column(
        Integer, nullable=False, default=10, server_default="10"
    )
    policy_terms: Mapped[str | None] = mapped_column(
        Text, nullable=True
    )
    policy_version: Mapped[int] = mapped_column(
        Integer, nullable=False, default=1, server_default="1"
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

    owner: Mapped["User | None"] = relationship(
        "User",
        back_populates="owned_restaurants",
    )

    tables: Mapped[list["RestaurantTable"]] = relationship(
        "RestaurantTable",
        back_populates="restaurant",
        cascade="all, delete-orphan",
    )

    reservations: Mapped[list["Reservation"]] = relationship(
        "Reservation",
        back_populates="restaurant",
    )