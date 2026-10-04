from datetime import datetime, timezone
from sqlalchemy import exists, select
from sqlalchemy.orm import Session

from app.models.reservation import Reservation
from app.models.restaurant import Restaurant
from app.models.restaurant_table import RestaurantTable
from app.models.table_assignment_history import TableAssignmentHistory
from app.schemas.restaurant_table import (
    RestaurantTableCreate,
    RestaurantTableResponse,
    RestaurantTableUpdate,
)
from app.schemas.table_recovery import (
    AffectedReservation,
    RecoveryPreviewItemResult,
    RecoveryReassignmentItem,
)
from app.services.transaction import transaction


class TableServiceError(ValueError):
    pass


class RestaurantNotFoundError(TableServiceError):
    pass


class TableNotFoundError(TableServiceError):
    pass


class InvalidTableUpdateError(TableServiceError):
    pass


UPDATABLE_FIELDS = {
    "table_number",
    "capacity",
    "is_active",
    "status",
}


def create_table(
    db: Session,
    table_data: RestaurantTableCreate,
    owner_id: int,
) -> RestaurantTable:
    """
    Create a table only for an active restaurant
    belonging to the authenticated owner.
    """
    table_number = table_data.table_number.strip()

    if not table_number:
        raise InvalidTableUpdateError("Table number cannot be empty")

    with transaction(db):
        restaurant = db.scalar(
            select(Restaurant)
            .where(
                Restaurant.id == table_data.restaurant_id,
                Restaurant.owner_id == owner_id,
                Restaurant.is_active.is_(True),
            )
            .with_for_update()
        )

        if restaurant is None:
            raise RestaurantNotFoundError("Restaurant not found")

        table = RestaurantTable(
            restaurant_id=restaurant.id,
            table_number=table_number,
            capacity=table_data.capacity,
            is_active=True,
            status="available",
        )

        db.add(table)
        db.flush()

    db.refresh(table)
    return table


def update_table(
    db: Session,
    table_id: int,
    owner_id: int,
    table_data: RestaurantTableUpdate,
) -> RestaurantTable:
    """
    Update a table only if it belongs to
    an active restaurant owned by the user.
    """
    update_data = table_data.model_dump(exclude_unset=True)

    if not update_data:
        raise InvalidTableUpdateError("No fields provided for update")

    disallowed = update_data.keys() - UPDATABLE_FIELDS
    if disallowed:
        raise InvalidTableUpdateError(
            f"Fields cannot be updated: {', '.join(sorted(disallowed))}"
        )

    for field, value in update_data.items():
        if value is None:
            raise InvalidTableUpdateError(f"{field} cannot be null")

    if "table_number" in update_data:
        update_data["table_number"] = update_data["table_number"].strip()
        if not update_data["table_number"]:
            raise InvalidTableUpdateError("Table number cannot be empty")

    with transaction(db):
        table = db.scalar(
            select(RestaurantTable)
            .join(
                Restaurant,
                Restaurant.id == RestaurantTable.restaurant_id,
            )
            .where(
                RestaurantTable.id == table_id,
                Restaurant.owner_id == owner_id,
                Restaurant.is_active.is_(True),
            )
            .with_for_update()
        )

        if table is None:
            raise TableNotFoundError("Table not found")

        for field, value in update_data.items():
            setattr(table, field, value)

        db.flush()

    db.refresh(table)
    return table


def get_affected_reservations_for_table(
    db: Session,
    table: RestaurantTable,
) -> list[AffectedReservation]:
    """
    Find all active / upcoming reservations assigned to this table,
    and find available alternative tables for each.
    """
    now = datetime.now(timezone.utc)

    reservations = db.scalars(
        select(Reservation)
        .where(
            Reservation.table_id == table.id,
            Reservation.status.in_(("pending", "confirmed")),
            Reservation.end_time >= now,
        )
        .order_by(Reservation.start_time.asc())
    ).all()

    affected_list: list[AffectedReservation] = []

    for res in reservations:
        # Find other active tables in the same restaurant with enough capacity and no conflict
        overlapping = exists(
            select(Reservation.id).where(
                Reservation.table_id == RestaurantTable.id,
                Reservation.id != res.id,
                Reservation.status.in_(("pending", "confirmed")),
                Reservation.start_time < res.end_time,
                Reservation.end_time > res.start_time,
            )
        )

        alt_tables = db.scalars(
            select(RestaurantTable)
            .where(
                RestaurantTable.restaurant_id == table.restaurant_id,
                RestaurantTable.id != table.id,
                RestaurantTable.is_active.is_(True),
                RestaurantTable.status != "maintenance",
                RestaurantTable.capacity >= res.guest_count,
                ~overlapping,
            )
            .order_by(RestaurantTable.capacity.asc(), RestaurantTable.table_number.asc())
        ).all()

        affected_list.append(
            AffectedReservation(
                reservation_id=res.id,
                booking_reference=res.booking_reference,
                customer_name=res.customer_name,
                customer_email=res.customer_email,
                customer_phone=res.customer_phone,
                guest_count=res.guest_count,
                start_time=res.start_time,
                end_time=res.end_time,
                current_table_id=table.id,
                current_table_number=table.table_number,
                available_alternative_tables=[
                    RestaurantTableResponse.model_validate(t) for t in alt_tables
                ],
            )
        )

    return affected_list


def toggle_table_maintenance(
    db: Session,
    table_id: int,
    owner_id: int,
    is_active: bool,
    status_text: str = "maintenance",
    reason: str | None = None,
) -> tuple[RestaurantTable, list[AffectedReservation]]:
    """
    Set a table to maintenance/inactive or available, and return affected reservations.
    """
    with transaction(db):
        table = db.scalar(
            select(RestaurantTable)
            .join(
                Restaurant,
                Restaurant.id == RestaurantTable.restaurant_id,
            )
            .where(
                RestaurantTable.id == table_id,
                Restaurant.owner_id == owner_id,
                Restaurant.is_active.is_(True),
            )
            .with_for_update()
        )

        if table is None:
            raise TableNotFoundError("Table not found or unauthorized")

        table.is_active = is_active
        table.status = status_text if not is_active else "available"
        db.flush()

        affected = []
        if not is_active or status_text == "maintenance":
            affected = get_affected_reservations_for_table(db, table)

    db.refresh(table)
    return table, affected


def preview_seating_recovery(
    db: Session,
    restaurant_id: int,
    owner_id: int,
    reassignments: list[RecoveryReassignmentItem],
    reason: str | None = None,
) -> tuple[bool, list[RecoveryPreviewItemResult]]:
    """
    Validate proposed table reassignments for seating recovery without mutating data.
    """
    restaurant = db.scalar(
        select(Restaurant).where(
            Restaurant.id == restaurant_id,
            Restaurant.owner_id == owner_id,
            Restaurant.is_active.is_(True),
        )
    )
    if restaurant is None:
        raise RestaurantNotFoundError("Restaurant not found or unauthorized")

    all_valid = True
    preview_items: list[RecoveryPreviewItemResult] = []

    # Track proposed allocations in memory to detect intra-batch conflicts
    simulated_assignments: list[tuple[int, datetime, datetime]] = []

    for item in reassignments:
        res = db.scalar(
            select(Reservation).where(
                Reservation.id == item.reservation_id,
                Reservation.restaurant_id == restaurant_id,
            )
        )

        if res is None:
            all_valid = False
            preview_items.append(
                RecoveryPreviewItemResult(
                    reservation_id=item.reservation_id,
                    booking_reference="Unknown",
                    guest_count=0,
                    start_time=datetime.now(timezone.utc),
                    end_time=datetime.now(timezone.utc),
                    current_table_id=0,
                    current_table_number="Unknown",
                    new_table_id=item.new_table_id,
                    new_table_number="Unknown",
                    valid=False,
                    error_message="Reservation not found for this restaurant",
                )
            )
            continue

        current_table = db.scalar(
            select(RestaurantTable).where(RestaurantTable.id == res.table_id)
        )
        current_table_num = current_table.table_number if current_table else str(res.table_id)

        target_table = db.scalar(
            select(RestaurantTable).where(
                RestaurantTable.id == item.new_table_id,
                RestaurantTable.restaurant_id == restaurant_id,
            )
        )

        if target_table is None:
            all_valid = False
            preview_items.append(
                RecoveryPreviewItemResult(
                    reservation_id=res.id,
                    booking_reference=res.booking_reference,
                    guest_count=res.guest_count,
                    start_time=res.start_time,
                    end_time=res.end_time,
                    current_table_id=res.table_id,
                    current_table_number=current_table_num,
                    new_table_id=item.new_table_id,
                    new_table_number="Unknown",
                    valid=False,
                    error_message="Target table not found in this restaurant",
                )
            )
            continue

        # Check capacity
        if target_table.capacity < res.guest_count:
            all_valid = False
            preview_items.append(
                RecoveryPreviewItemResult(
                    reservation_id=res.id,
                    booking_reference=res.booking_reference,
                    guest_count=res.guest_count,
                    start_time=res.start_time,
                    end_time=res.end_time,
                    current_table_id=res.table_id,
                    current_table_number=current_table_num,
                    new_table_id=target_table.id,
                    new_table_number=target_table.table_number,
                    valid=False,
                    error_message=f"Table capacity ({target_table.capacity}) is less than party size ({res.guest_count})",
                )
            )
            continue

        # Check database conflicts with other reservations on target table
        conflict = db.scalar(
            select(Reservation.id).where(
                Reservation.table_id == target_table.id,
                Reservation.id != res.id,
                Reservation.status.in_(("pending", "confirmed")),
                Reservation.start_time < res.end_time,
                Reservation.end_time > res.start_time,
            ).limit(1)
        )

        if conflict is not None:
            all_valid = False
            preview_items.append(
                RecoveryPreviewItemResult(
                    reservation_id=res.id,
                    booking_reference=res.booking_reference,
                    guest_count=res.guest_count,
                    start_time=res.start_time,
                    end_time=res.end_time,
                    current_table_id=res.table_id,
                    current_table_number=current_table_num,
                    new_table_id=target_table.id,
                    new_table_number=target_table.table_number,
                    valid=False,
                    error_message="Target table already has an overlapping booking at this time",
                )
            )
            continue

        # Check intra-batch conflicts
        batch_conflict = any(
            t_id == target_table.id and s_time < res.end_time and e_time > res.start_time
            for (t_id, s_time, e_time) in simulated_assignments
        )

        if batch_conflict:
            all_valid = False
            preview_items.append(
                RecoveryPreviewItemResult(
                    reservation_id=res.id,
                    booking_reference=res.booking_reference,
                    guest_count=res.guest_count,
                    start_time=res.start_time,
                    end_time=res.end_time,
                    current_table_id=res.table_id,
                    current_table_number=current_table_num,
                    new_table_id=target_table.id,
                    new_table_number=target_table.table_number,
                    valid=False,
                    error_message="Multiple reassignments in this batch target the same table at the same time",
                )
            )
            continue

        simulated_assignments.append((target_table.id, res.start_time, res.end_time))
        preview_items.append(
            RecoveryPreviewItemResult(
                reservation_id=res.id,
                booking_reference=res.booking_reference,
                guest_count=res.guest_count,
                start_time=res.start_time,
                end_time=res.end_time,
                current_table_id=res.table_id,
                current_table_number=current_table_num,
                new_table_id=target_table.id,
                new_table_number=target_table.table_number,
                valid=True,
                error_message=None,
            )
        )

    return all_valid, preview_items


def apply_seating_recovery(
    db: Session,
    restaurant_id: int,
    owner_id: int,
    reassignments: list[RecoveryReassignmentItem],
    reason: str | None = "Seating recovery",
) -> list[RecoveryPreviewItemResult]:
    """
    Apply seating recovery reassignments atomically with row locking.
    Rolls back automatically on failure.
    """
    with transaction(db):
        is_valid, preview_items = preview_seating_recovery(
            db, restaurant_id, owner_id, reassignments, reason
        )

        if not is_valid:
            errors = [f"Res #{p.reservation_id}: {p.error_message}" for p in preview_items if not p.valid]
            raise InvalidTableUpdateError(
                f"Cannot apply invalid recovery plan: {'; '.join(errors)}"
            )

        for item in reassignments:
            res = db.scalar(
                select(Reservation)
                .where(
                    Reservation.id == item.reservation_id,
                    Reservation.restaurant_id == restaurant_id,
                )
                .with_for_update()
            )

            if res is None:
                raise TableServiceError(f"Reservation {item.reservation_id} not found")

            original_table_id = res.table_id
            res.table_id = item.new_table_id

            # Create audit history log
            history = TableAssignmentHistory(
                reservation_id=res.id,
                original_table_id=original_table_id,
                new_table_id=item.new_table_id,
                changed_by_user_id=owner_id,
                reason=reason or "Seating recovery",
            )
            db.add(history)

        db.flush()

    return preview_items