from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.schemas.restaurant_table import RestaurantTableResponse
from app.services.availability_service import get_available_tables

router = APIRouter(
    prefix="/availability",
    tags=["Availability"],
)


@router.get(
    "/{restaurant_id}",
    response_model=list[RestaurantTableResponse],
    status_code=status.HTTP_200_OK,
)
def check_availability(
    restaurant_id: int,
    start_time: datetime,
    end_time: datetime,
    guest_count: int = Query(..., gt=0, le=50),
    db: Session = Depends(get_db),
):
    if restaurant_id <= 0:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Restaurant ID must be positive",
        )

    if start_time.tzinfo is None or start_time.utcoffset() is None:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="start_time must include a timezone",
        )

    if end_time.tzinfo is None or end_time.utcoffset() is None:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="end_time must include a timezone",
        )

    if end_time <= start_time:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="end_time must be later than start_time",
        )

    available_tables = get_available_tables(
        db=db,
        restaurant_id=restaurant_id,
        start_time=start_time,
        end_time=end_time,
        guest_count=guest_count,
    )

    if available_tables is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Restaurant not found or inactive",
        )

    return available_tables