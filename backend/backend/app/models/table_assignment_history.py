from datetime import datetime
from sqlalchemy import (
    DateTime,
    ForeignKey,
    Integer,
    String,
    func,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class TableAssignmentHistory(Base):
    __tablename__ = "table_assignment_history"

    id: Mapped[int] = mapped_column(
        Integer, primary_key=True, index=True
    )

    reservation_id: Mapped[int] = mapped_column(
        ForeignKey("reservations.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    original_table_id: Mapped[int | None] = mapped_column(
        ForeignKey("restaurant_tables.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )

    new_table_id: Mapped[int | None] = mapped_column(
        ForeignKey("restaurant_tables.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )

    changed_by_user_id: Mapped[int | None] = mapped_column(
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )

    reason: Mapped[str | None] = mapped_column(
        String(255), nullable=True
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
    )

    reservation: Mapped["Reservation"] = relationship(
        "Reservation",
        back_populates="assignment_history",
    )

    original_table: Mapped["RestaurantTable | None"] = relationship(
        "RestaurantTable",
        foreign_keys=[original_table_id],
    )

    new_table: Mapped["RestaurantTable | None"] = relationship(
        "RestaurantTable",
        foreign_keys=[new_table_id],
    )

    changed_by_user: Mapped["User | None"] = relationship(
        "User",
        foreign_keys=[changed_by_user_id],
    )
