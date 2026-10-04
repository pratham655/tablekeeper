import secrets
from datetime import datetime, timedelta, timezone

from sqlalchemy import func, or_, select
from sqlalchemy.orm import Session

from app.models.reservation import Reservation
from app.models.restaurant import Restaurant
from app.models.restaurant_table import RestaurantTable
from app.models.table_assignment_history import TableAssignmentHistory
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


class PolicyViolationError(Exception):
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
    customer_name: str | None = None,
    customer_email: str | None = None,
    customer_phone: str | None = None,
    special_request: str | None = None,
    policy_version_accepted: int | None = None,
    accepted_policy_terms: str | None = None,
    idempotency_key: str | None = None,
) -> Reservation:
    if status not in ("pending", "confirmed", "seated", "completed", "cancelled"):
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
            raise RestaurantNotAvailableError("Restaurant not found or inactive")

        if restaurant.max_party_size and guest_count > restaurant.max_party_size:
            raise PolicyViolationError(
                f"Guest count ({guest_count}) exceeds restaurant maximum limit of {restaurant.max_party_size} guests"
            )

        # Record accepted policy version if not passed
        effective_policy_version = policy_version_accepted or restaurant.policy_version or 1
        effective_policy_terms = accepted_policy_terms or restaurant.policy_terms or (
            f"Standard Policy (v{effective_policy_version}): Cancel up to {restaurant.cancellation_hours}h prior. "
            f"{restaurant.late_arrival_minutes} min arrival grace period."
        )

        table_query = select(RestaurantTable).where(
            RestaurantTable.restaurant_id == restaurant_id,
            RestaurantTable.is_active.is_(True),
            RestaurantTable.status != "maintenance",
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
            table_query.order_by(
                RestaurantTable.capacity,
                RestaurantTable.id,
            ).with_for_update()
        ).all()

        selected_table = None

        for table in tables:
            conflict = db.scalar(
                select(Reservation.id)
                .where(
                    Reservation.table_id == table.id,
                    Reservation.status.in_(("pending", "confirmed", "seated")),
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

        # Check for duplicate idempotent submission within 30 seconds
        recent_duplicate = db.scalar(
            select(Reservation)
            .where(
                Reservation.user_id == user_id,
                Reservation.restaurant_id == restaurant_id,
                Reservation.table_id == selected_table.id,
                Reservation.start_time == start_time,
                Reservation.status.in_(("pending", "confirmed")),
            )
            .limit(1)
        )
        if recent_duplicate is not None:
            return recent_duplicate

        booking_ref = f"TK-{secrets.randbelow(90000000) + 10000000}"

        reservation = Reservation(
            booking_reference=booking_ref,
            user_id=user_id,
            restaurant_id=restaurant_id,
            table_id=selected_table.id,
            guest_count=guest_count,
            start_time=start_time,
            end_time=end_time,
            status=status,
            customer_name=customer_name,
            customer_email=customer_email,
            customer_phone=customer_phone,
            special_request=special_request,
            policy_version_accepted=effective_policy_version,
            accepted_policy_terms=effective_policy_terms,
        )

        db.add(reservation)
        db.flush()
        db.refresh(reservation)

    return reservation


def cancel_reservation(
    db: Session,
    reservation_id: int,
    user_id: int,
    reason: str | None = None,
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
            raise InvalidReservationStateError("Reservation is already cancelled")

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
            .with_for_update(of=Reservation)
        )

        if reservation is None:
            raise ReservationNotFoundError("Reservation not found or unauthorized")

        if reservation.status not in ("pending", "confirmed"):
            raise InvalidReservationStateError(
                f"Cannot confirm reservation in '{reservation.status}' state"
            )

        reservation.status = "confirmed"
        db.flush()
        db.refresh(reservation)

    return reservation


def update_reservation_status(
    db: Session,
    reservation_id: int,
    owner_id: int,
    new_status: str,
    reason: str | None = None,
) -> Reservation:
    """Owner status update: confirmed, seated, completed, cancelled."""
    if new_status not in ("pending", "confirmed", "seated", "completed", "cancelled"):
        raise InvalidReservationStateError(f"Invalid status: {new_status}")

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
            .with_for_update(of=Reservation)
        )

        if reservation is None:
            raise ReservationNotFoundError("Reservation not found or unauthorized")

        reservation.status = new_status
        db.flush()
        db.refresh(reservation)

    return reservation


def reassign_reservation_table(
    db: Session,
    reservation_id: int,
    owner_id: int,
    new_table_id: int,
    reason: str | None = "Manual owner reassignment",
) -> Reservation:
    """Reassign a single reservation to another table in the same restaurant."""
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
            .with_for_update(of=Reservation)
        )

        if reservation is None:
            raise ReservationNotFoundError("Reservation not found or unauthorized")

        target_table = db.scalar(
            select(RestaurantTable)
            .where(
                RestaurantTable.id == new_table_id,
                RestaurantTable.restaurant_id == reservation.restaurant_id,
                RestaurantTable.is_active.is_(True),
            )
            .with_for_update()
        )

        if target_table is None:
            raise NoAvailableTableError("Target table not found or inactive")

        if target_table.capacity < reservation.guest_count:
            raise NoAvailableTableError(
                f"Target table capacity ({target_table.capacity}) is smaller than party size ({reservation.guest_count})"
            )

        conflict = db.scalar(
            select(Reservation.id)
            .where(
                Reservation.table_id == target_table.id,
                Reservation.id != reservation.id,
                Reservation.status.in_(("pending", "confirmed", "seated")),
                Reservation.start_time < reservation.end_time,
                Reservation.end_time > reservation.start_time,
            )
            .limit(1)
        )

        if conflict is not None:
            raise NoAvailableTableError(
                "Target table already has an overlapping reservation at this time"
            )

        orig_table_id = reservation.table_id
        reservation.table_id = target_table.id

        history = TableAssignmentHistory(
            reservation_id=reservation.id,
            original_table_id=orig_table_id,
            new_table_id=target_table.id,
            changed_by_user_id=owner_id,
            reason=reason or "Manual owner table reassignment",
        )
        db.add(history)
        db.flush()
        db.refresh(reservation)

    return reservation


def get_owner_reservations(
    db: Session,
    restaurant_id: int,
    owner_id: int,
    date_filter: str | None = None,
    status_filter: str | None = None,
    search: str | None = None,
) -> list[Reservation]:
    """Retrieve reservations for a restaurant owned by the current user."""
    # Verify ownership
    restaurant = db.scalar(
        select(Restaurant).where(
            Restaurant.id == restaurant_id,
            Restaurant.owner_id == owner_id,
        )
    )
    if restaurant is None:
        raise ReservationPermissionError("Restaurant not found or unauthorized")

    query = select(Reservation).where(Reservation.restaurant_id == restaurant_id)

    if date_filter:
        try:
            target_date = datetime.strptime(date_filter, "%Y-%m-%d").date()
            start_of_day = datetime(target_date.year, target_date.month, target_date.day, 0, 0, 0, tzinfo=timezone.utc)
            end_of_day = start_of_day + timedelta(days=1)
            query = query.where(
                Reservation.start_time >= start_of_day,
                Reservation.start_time < end_of_day,
            )
        except ValueError:
            pass

    if status_filter and status_filter.lower() != "all":
        query = query.where(Reservation.status == status_filter.lower())

    if search and search.strip():
        term = f"%{search.strip()}%"
        query = query.where(
            or_(
                Reservation.booking_reference.ilike(term),
                Reservation.customer_name.ilike(term),
                Reservation.customer_email.ilike(term),
                Reservation.customer_phone.ilike(term),
            )
        )

    return list(
        db.scalars(
            query.order_by(
                Reservation.start_time.asc(),
                Reservation.id.asc(),
            )
        ).all()
    )


def get_reservation_history(
    db: Session,
    reservation_id: int,
) -> list[TableAssignmentHistory]:
    """Get audit trail of table changes for a reservation."""
    return list(
        db.scalars(
            select(TableAssignmentHistory)
            .where(TableAssignmentHistory.reservation_id == reservation_id)
            .order_by(TableAssignmentHistory.created_at.desc())
        ).all()
    )