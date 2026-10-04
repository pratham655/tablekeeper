from datetime import datetime

from sqlalchemy import exists, select
from sqlalchemy.orm import Session

from app.models.reservation import Reservation
from app.models.restaurant import Restaurant
from app.models.restaurant_table import RestaurantTable

BLOCKING_STATUSES = ("pending", "confirmed")


def get_available_tables(
    db: Session,
    restaurant_id: int,
    start_time: datetime,
    end_time: datetime,
    guest_count: int,
) -> list[RestaurantTable] | None:
    """
    Return active tables with sufficient capacity and no overlapping
    pending or confirmed reservations.

    Return None if the restaurant does not exist or is inactive.
    Raise ValueError for invalid input.
    """
    if guest_count < 1:
        raise ValueError("guest_count must be at least 1")

    if (start_time.tzinfo is None) != (end_time.tzinfo is None):
        raise ValueError(
            "start_time and end_time must both be timezone-aware or both naive"
        )

    if start_time >= end_time:
        raise ValueError("start_time must be before end_time")

    restaurant_id_found = db.scalar(
        select(Restaurant.id).where(
            Restaurant.id == restaurant_id,
            Restaurant.is_active.is_(True),
        )
    )

    if restaurant_id_found is None:
        return None

    overlapping_reservation = exists(
        select(Reservation.id).where(
            Reservation.table_id == RestaurantTable.id,
            Reservation.status.in_(BLOCKING_STATUSES),
            Reservation.start_time < end_time,
            Reservation.end_time > start_time,
        )
    )

    query = (
        select(RestaurantTable)
        .where(
            RestaurantTable.restaurant_id == restaurant_id,
            RestaurantTable.is_active.is_(True),
            RestaurantTable.capacity >= guest_count,
            ~overlapping_reservation,
        )
        .order_by(
            RestaurantTable.capacity,
            RestaurantTable.id,
        )
    )

    return list(db.scalars(query).all())