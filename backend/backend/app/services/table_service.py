
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.restaurant import Restaurant
from app.models.restaurant_table import RestaurantTable
from app.schemas.restaurant_table import (
    RestaurantTableCreate,
    RestaurantTableUpdate,
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
        raise InvalidTableUpdateError(
            "Table number cannot be empty"
        )

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
            raise RestaurantNotFoundError(
                "Restaurant not found"
            )

        table = RestaurantTable(
            restaurant_id=restaurant.id,
            table_number=table_number,
            capacity=table_data.capacity,
            is_active=True,
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
    update_data = table_data.model_dump(
        exclude_unset=True
    )

    if not update_data:
        raise InvalidTableUpdateError(
            "No fields provided for update"
        )

    disallowed = update_data.keys() - UPDATABLE_FIELDS
    if disallowed:
        raise InvalidTableUpdateError(
            f"Fields cannot be updated: {', '.join(sorted(disallowed))}"
        )

    for field, value in update_data.items():
        if value is None:
            raise InvalidTableUpdateError(
                f"{field} cannot be null"
            )

    if "table_number" in update_data:
        update_data["table_number"] = (
            update_data["table_number"].strip()
        )
        if not update_data["table_number"]:
            raise InvalidTableUpdateError(
                "Table number cannot be empty"
            )

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