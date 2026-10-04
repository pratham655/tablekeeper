from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.restaurant import Restaurant
from app.models.user import User
from app.schemas.restaurant import (
    RestaurantCreate,
    RestaurantPolicyUpdate,
    RestaurantUpdate,
)
from app.services.transaction import transaction


class RestaurantServiceError(ValueError):
    """Base class, so existing `except ValueError` handlers keep working."""


class OwnerNotFoundError(RestaurantServiceError):
    pass


class RestaurantNotFoundError(RestaurantServiceError):
    pass


class InvalidRestaurantUpdateError(RestaurantServiceError):
    pass


# Only these fields can be changed through update_restaurant.
UPDATABLE_FIELDS = {
    "name",
    "description",
    "address",
    "city",
    "cuisine",
    "price_range",
    "phone",
    "image_url",
    "cancellation_hours",
    "late_arrival_minutes",
    "reservation_duration_minutes",
    "max_party_size",
    "policy_terms",
}

# Fields that must never be set to None.
NON_NULLABLE_FIELDS = {"name", "address", "city", "cuisine"}


def create_restaurant(
    db: Session,
    restaurant_data: RestaurantCreate,
    owner_id: int,
) -> Restaurant:
    """
    Create a restaurant for an existing, active owner.
    owner_id must come from trusted authentication context, never from the request body.
    """
    owner = db.scalar(
        select(User).where(
            User.id == owner_id,
            User.role == "owner",
            User.is_active.is_(True),
        )
    )
    if owner is None:
        raise OwnerNotFoundError("Active restaurant owner not found")

    restaurant = Restaurant(
        **restaurant_data.model_dump(exclude={"owner_id", "id", "is_active"}),
        owner_id=owner.id,
    )

    with transaction(db):
        db.add(restaurant)
        db.flush()

    db.refresh(restaurant)
    return restaurant


def update_restaurant(
    db: Session,
    restaurant_id: int,
    owner_id: int,
    restaurant_data: RestaurantUpdate,
) -> Restaurant:
    """
    Update a restaurant owned by the authenticated owner.
    Only fields in UPDATABLE_FIELDS can be changed.
    """
    update_data = restaurant_data.model_dump(exclude_unset=True)

    if not update_data:
        raise InvalidRestaurantUpdateError("No fields provided for update")

    disallowed = update_data.keys() - UPDATABLE_FIELDS
    if disallowed:
        raise InvalidRestaurantUpdateError(
            f"Fields cannot be updated: {', '.join(sorted(disallowed))}"
        )

    for field in NON_NULLABLE_FIELDS & update_data.keys():
        if update_data[field] is None:
            raise InvalidRestaurantUpdateError(f"{field} cannot be null")

    with transaction(db):
        restaurant = db.scalar(
            select(Restaurant)
            .where(
                Restaurant.id == restaurant_id,
                Restaurant.owner_id == owner_id,
                Restaurant.is_active.is_(True),
            )
            .with_for_update()
        )
        if restaurant is None:
            raise RestaurantNotFoundError("Restaurant not found")

        for field, value in update_data.items():
            setattr(restaurant, field, value)

        db.flush()

    db.refresh(restaurant)
    return restaurant


def get_owner_restaurants(
    db: Session,
    owner_id: int,
) -> list[Restaurant]:
    """Return all active restaurants belonging to the authenticated owner."""
    return list(
        db.scalars(
            select(Restaurant)
            .where(
                Restaurant.owner_id == owner_id,
                Restaurant.is_active.is_(True),
            )
            .order_by(Restaurant.id.asc())
        ).all()
    )


def get_restaurant_policies(
    db: Session,
    restaurant_id: int,
) -> dict:
    """Retrieve current booking policies for a restaurant."""
    restaurant = db.scalar(
        select(Restaurant).where(
            Restaurant.id == restaurant_id,
            Restaurant.is_active.is_(True),
        )
    )
    if restaurant is None:
        raise RestaurantNotFoundError("Restaurant not found")

    return {
        "restaurant_id": restaurant.id,
        "restaurant_name": restaurant.name,
        "cancellation_hours": restaurant.cancellation_hours,
        "late_arrival_minutes": restaurant.late_arrival_minutes,
        "reservation_duration_minutes": restaurant.reservation_duration_minutes,
        "max_party_size": restaurant.max_party_size,
        "policy_terms": restaurant.policy_terms,
        "policy_version": restaurant.policy_version,
    }


def update_restaurant_policies(
    db: Session,
    restaurant_id: int,
    owner_id: int,
    policy_data: RestaurantPolicyUpdate,
) -> dict:
    """
    Update booking policies for an owned restaurant and increment the policy version.
    """
    with transaction(db):
        restaurant = db.scalar(
            select(Restaurant)
            .where(
                Restaurant.id == restaurant_id,
                Restaurant.owner_id == owner_id,
                Restaurant.is_active.is_(True),
            )
            .with_for_update()
        )
        if restaurant is None:
            raise RestaurantNotFoundError("Restaurant not found or unauthorized")

        restaurant.cancellation_hours = policy_data.cancellation_hours
        restaurant.late_arrival_minutes = policy_data.late_arrival_minutes
        restaurant.reservation_duration_minutes = policy_data.reservation_duration_minutes
        restaurant.max_party_size = policy_data.max_party_size
        restaurant.policy_terms = policy_data.policy_terms
        # Automatically increment policy version when rules change
        restaurant.policy_version = (restaurant.policy_version or 1) + 1

        db.flush()

    db.refresh(restaurant)
    return {
        "restaurant_id": restaurant.id,
        "restaurant_name": restaurant.name,
        "cancellation_hours": restaurant.cancellation_hours,
        "late_arrival_minutes": restaurant.late_arrival_minutes,
        "reservation_duration_minutes": restaurant.reservation_duration_minutes,
        "max_party_size": restaurant.max_party_size,
        "policy_terms": restaurant.policy_terms,
        "policy_version": restaurant.policy_version,
    }