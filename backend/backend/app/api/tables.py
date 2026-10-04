
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.core.auth import require_role
from app.core.database import get_db
from app.models.restaurant import Restaurant
from app.models.restaurant_table import RestaurantTable
from app.models.user import User
from app.schemas.restaurant_table import (
    RestaurantTableCreate,
    RestaurantTableResponse,
    RestaurantTableUpdate,
)
from app.services.table_service import (
    create_table,
    update_table,
    InvalidTableUpdateError,
    RestaurantNotFoundError,
    TableNotFoundError,
)

router = APIRouter(prefix="/tables", tags=["Tables"])


@router.post(
    "/",
    response_model=RestaurantTableResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_restaurant_table(
    table_data: RestaurantTableCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("owner")),
):
    try:
        return create_table(
            db=db,
            table_data=table_data,
            owner_id=current_user.id,
        )
    except RestaurantNotFoundError as exc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(exc),
        ) from exc
    except InvalidTableUpdateError as exc:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=str(exc),
        ) from exc
    except IntegrityError as exc:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="A table with this number already exists in the restaurant",
        ) from exc


@router.get(
    "/restaurant/{restaurant_id}",
    response_model=list[RestaurantTableResponse],
)
def get_restaurant_tables(
    restaurant_id: int,
    db: Session = Depends(get_db),
):
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

    tables = db.scalars(
        select(RestaurantTable)
        .where(
            RestaurantTable.restaurant_id == restaurant_id,
            RestaurantTable.is_active.is_(True),
        )
        .order_by(RestaurantTable.id)
    ).all()

    return tables


@router.put(
    "/{table_id}",
    response_model=RestaurantTableResponse,
)
def update_restaurant_table(
    table_id: int,
    table_data: RestaurantTableUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("owner")),
):
    try:
        return update_table(
            db=db,
            table_id=table_id,
            owner_id=current_user.id,
            table_data=table_data,
        )
    except TableNotFoundError as exc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(exc),
        ) from exc
    except InvalidTableUpdateError as exc:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=str(exc),
        ) from exc
    except IntegrityError as exc:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="A table with this number already exists in the restaurant",
        ) from exc