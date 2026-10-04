from typing import Literal
from typing import Literal
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func, or_, select
from sqlalchemy.orm import Session

from app.core.auth import require_role
from app.core.database import get_db
from app.models.restaurant import Restaurant
from app.models.user import User
from app.schemas.restaurant import (
    RestaurantCreate,
    RestaurantResponse,
    RestaurantUpdate,
)
from app.services.restaurant_service import (
    InvalidRestaurantUpdateError,
    OwnerNotFoundError,
    RestaurantNotFoundError,
    create_restaurant,
    update_restaurant,
)

router = APIRouter(
    prefix="/restaurants",
    tags=["Restaurants"],
)


def _like_pattern(value: str) -> str:
    """Escape LIKE wildcards so user input is matched literally."""
    escaped = (
        value.replace("\\", "\\\\")
        .replace("%", "\\%")
        .replace("_", "\\_")
    )
    return f"%{escaped}%"


@router.get(
    "/",
    response_model=list[RestaurantResponse],
    status_code=status.HTTP_200_OK,
)
def get_restaurants(
    search: str | None = Query(default=None, min_length=1, max_length=100),
    city: str | None = Query(default=None, max_length=100),
    cuisine: str | None = Query(default=None, max_length=100),
    price_range: str | None = Query(default=None, max_length=30),
    sort_by: Literal["name", "city", "cuisine", "price_range"] = "name",
    sort_order: Literal["asc", "desc"] = "asc",
    limit: int = Query(default=50, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
    db: Session = Depends(get_db),
):
    """
    Get active restaurants with optional search, filters,
    sorting, and pagination.
    """
    statement = select(Restaurant).where(Restaurant.is_active.is_(True))

    if search and search.strip():
        term = _like_pattern(search.strip())
        statement = statement.where(
            or_(
                Restaurant.name.ilike(term, escape="\\"),
                Restaurant.description.ilike(term, escape="\\"),
                Restaurant.cuisine.ilike(term, escape="\\"),
                Restaurant.city.ilike(term, escape="\\"),
                Restaurant.address.ilike(term, escape="\\"),
            )
        )

    if city and city.strip():
        statement = statement.where(
            func.lower(Restaurant.city) == city.strip().lower()
        )

    if cuisine and cuisine.strip():
        statement = statement.where(
            func.lower(Restaurant.cuisine) == cuisine.strip().lower()
        )

    if price_range and price_range.strip():
        statement = statement.where(
            Restaurant.price_range == price_range.strip()
        )

    sort_column = getattr(Restaurant, sort_by)
    ordering = sort_column.asc() if sort_order == "asc" else sort_column.desc()

    statement = (
        statement.order_by(ordering, Restaurant.id.asc())
        .limit(limit)
        .offset(offset)
    )

    return db.scalars(statement).all()


@router.get(
    "/{restaurant_id}",
    response_model=RestaurantResponse,
    status_code=status.HTTP_200_OK,
)
def get_restaurant(
    restaurant_id: int,
    db: Session = Depends(get_db),
):
    """Get a single active restaurant by ID."""
    restaurant = db.scalar(
        select(Restaurant).where(
            Restaurant.id == restaurant_id,
            Restaurant.is_active.is_(True),
        )
    )

    if restaurant is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Restaurant not found",
        )

    return restaurant


@router.post(
    "/",
    response_model=RestaurantResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_owner_restaurant(
    restaurant_data: RestaurantCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("owner")),
):
    """Create a restaurant for the authenticated owner."""
    try:
        return create_restaurant(
            db=db,
            restaurant_data=restaurant_data,
            owner_id=current_user.id,
        )
    except OwnerNotFoundError:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Active restaurant owner not found",
        ) from None


@router.put(
    "/{restaurant_id}",
    response_model=RestaurantResponse,
    status_code=status.HTTP_200_OK,
)
def update_owner_restaurant(
    restaurant_id: int,
    restaurant_data: RestaurantUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("owner")),
):
    """Update a restaurant owned by the authenticated owner."""
    try:
        return update_restaurant(
            db=db,
            restaurant_id=restaurant_id,
            owner_id=current_user.id,
            restaurant_data=restaurant_data,
        )
    except RestaurantNotFoundError:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Restaurant not found",
        ) from None
    except InvalidRestaurantUpdateError as exc:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=str(exc),
        ) from None