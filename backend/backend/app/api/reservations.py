
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.core.auth import get_current_user, require_role
from app.core.database import get_db
from app.models.reservation import Reservation
from app.models.user import User
from app.schemas.reservation import (
    ReservationCreate,
    ReservationResponse,
)
from app.services.reservation_service import (
    InvalidReservationStateError,
    NoAvailableTableError,
    ReservationNotFoundError,
    RestaurantNotAvailableError,
    cancel_reservation,
    confirm_reservation,
    create_reservation,
)

router = APIRouter(
    prefix="/reservations",
    tags=["Reservations"],
)


@router.post(
    "/",
    response_model=ReservationResponse,
    status_code=status.HTTP_201_CREATED,
)
def book_reservation(
    reservation_data: ReservationCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    try:
        return create_reservation(
            db=db,
            restaurant_id=reservation_data.restaurant_id,
            user_id=current_user.id,
            guest_count=reservation_data.guest_count,
            start_time=reservation_data.start_time,
            end_time=reservation_data.end_time,
            status="pending",
            selected_table_id=reservation_data.selected_table_id,
        )
    except RestaurantNotAvailableError as exc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(exc),
        ) from exc
    except NoAvailableTableError as exc:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=str(exc),
        ) from exc
    except IntegrityError as exc:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Reservation could not be created due to a database conflict",
        ) from exc


@router.get(
    "/me",
    response_model=list[ReservationResponse],
)
def get_my_reservations(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return db.scalars(
        select(Reservation)
        .where(Reservation.user_id == current_user.id)
        .order_by(
            Reservation.created_at.desc(),
            Reservation.id.desc(),
        )
    ).all()


@router.post(
    "/{reservation_id}/cancel",
    response_model=ReservationResponse,
)
def cancel_my_reservation(
    reservation_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    try:
        return cancel_reservation(
            db=db,
            reservation_id=reservation_id,
            user_id=current_user.id,
        )
    except ReservationNotFoundError as exc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(exc),
        ) from exc
    except InvalidReservationStateError as exc:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=str(exc),
        ) from exc


@router.post(
    "/{reservation_id}/confirm",
    response_model=ReservationResponse,
)
def confirm_restaurant_reservation(
    reservation_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("owner")),
):
    try:
        return confirm_reservation(
            db=db,
            reservation_id=reservation_id,
            owner_id=current_user.id,
        )
    except ReservationNotFoundError as exc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(exc),
        ) from exc
    except InvalidReservationStateError as exc:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=str(exc),
        ) from exc
