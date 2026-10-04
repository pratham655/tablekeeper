
from datetime import datetime

from sqlalchemy import (
    Boolean,
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


class RestaurantTable(Base):
    __tablename__ = "restaurant_tables"

    __table_args__ = (
        UniqueConstraint(
            "restaurant_id",
            "table_number",
            name="uq_restaurant_table_number",
        ),
        CheckConstraint(
            "capacity > 0",
            name="ck_restaurant_table_capacity_positive",
        ),
        CheckConstraint(
            "length(trim(table_number)) > 0",
            name="ck_restaurant_table_number_not_empty",
        ),
    )

    id: Mapped[int] = mapped_column(
        Integer, primary_key=True, index=True
    )

    restaurant_id: Mapped[int] = mapped_column(
        ForeignKey("restaurants.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    table_number: Mapped[str] = mapped_column(
        String(30),
        nullable=False,
    )

    capacity: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
    )

    is_active: Mapped[bool] = mapped_column(
        Boolean,
        nullable=False,
        default=True,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
    )

    restaurant: Mapped["Restaurant"] = relationship(
        "Restaurant",
        back_populates="tables",
    )
    reservations: Mapped[list["Reservation"]] = relationship(
        "Reservation",
        back_populates="table",
    )