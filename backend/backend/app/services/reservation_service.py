import secrets
from datetime import datetime

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.reservation import Reservation
from app.models.restaurant import Restaurant
from app.models.restaurant_table import RestaurantTable
from app.services.transaction import transaction


class RestaurantNotAvailableError(Exception):
    pass


class NoAvailableTableError(Exception):
    pass


class ReservationNotFoundError(Exception):
    pass


class InvalidReservationStateError(Exception):
    pass


class ReservationPermissionError(Exception):
    pass


def create_reservation(
    db: Session,
    restaurant_id: int,
    user_id: int,
    guest_count: int,
    start_time: datetime,
    end_time: datetime,
    status: str = "confirmed",
    selected_table_id: int | None = None,
) -> Reservation:
    if status not in ("pending", "confirmed"):
        raise InvalidReservationStateError(
            "New reservations must be pending or confirmed"
        )

    with transaction(db):
        restaurant = db.scalar(
            select(Restaurant).where(
                Restaurant.id == restaurant_id,
                Restaurant.is_active.is_(True),
            )
        )

        if restaurant is None:
            raise RestaurantNotAvailableError(
                "Restaurant not found or inactive"
            )

        table_query = select(RestaurantTable).where(
            RestaurantTable.restaurant_id == restaurant_id,
            RestaurantTable.is_active.is_(True),
            RestaurantTable.capacity >= guest_count,
        )

        # If the customer selected a specific table, only consider it.
        if selected_table_id is not None:
            table_query = table_query.where(
                RestaurantTable.id == selected_table_id
            )

        # Lock eligible table rows so concurrent booking attempts
        # for the same tables are serialized by PostgreSQL.
        tables = db.scalars(
            table_query
            .order_by(
                RestaurantTable.capacity,
                RestaurantTable.id,
            )
            .with_for_update()
        ).all()

        selected_table = None

        for table in tables:
            conflict = db.scalar(
                select(Reservation.id)
                .where(
                    Reservation.table_id == table.id,
                    Reservation.status.in_(("pending", "confirmed")),
                    Reservation.start_time < end_time,
                    Reservation.end_time > start_time,
                )
                .limit(1)
            )

            if conflict is None:
                selected_table = table
                break

        if selected_table is None:
            raise NoAvailableTableError(
                "Selected table is unavailable or no suitable table is available"
            )

        reservation = Reservation(
            booking_reference=secrets.token_urlsafe(18),
            user_id=user_id,
            restaurant_id=restaurant_id,
            table_id=selected_table.id,
            guest_count=guest_count,
            start_time=start_time,
            end_time=end_time,
            status=status,
        )

        db.add(reservation)
        db.flush()
        db.refresh(reservation)

    return reservation


def cancel_reservation(
    db: Session,
    reservation_id: int,
    user_id: int,
) -> Reservation:
    with transaction(db):
        reservation = db.scalar(
            select(Reservation)
            .where(
                Reservation.id == reservation_id,
                Reservation.user_id == user_id,
            )
            .with_for_update()
        )

        if reservation is None:
            raise ReservationNotFoundError("Reservation not found")

        if reservation.status == "cancelled":
            raise InvalidReservationStateError(
                "Reservation is already cancelled"
            )

        reservation.status = "cancelled"
        db.flush()
        db.refresh(reservation)

    return reservation


def confirm_reservation(
    db: Session,
    reservation_id: int,
    owner_id: int,
) -> Reservation:
    with transaction(db):
        reservation = db.scalar(
            select(Reservation)
            .join(
                Restaurant,
                Reservation.restaurant_id == Restaurant.id,
            )
            .where(
                Reservation.id == reservation_id,
                Restaurant.owner_id == owner_id,
            )
            # Lock only the reservation row, not the joined restaurant row.
            .with_for_update(of=Reservation)
        )

        if reservation is None:
            raise ReservationNotFoundError("Reservation not found")

        if reservation.status != "pending":
            raise InvalidReservationStateError(
                "Only pending reservations can be confirmed"
            )

        reservation.status = "confirmed"
        db.flush()
        db.refresh(reservation)

    return reservation