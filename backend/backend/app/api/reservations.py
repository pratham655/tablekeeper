from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.core.auth import get_current_user, require_role
from app.core.database import get_db
from app.models.reservation import Reservation
from app.models.restaurant import Restaurant
from app.models.restaurant_table import RestaurantTable
from app.models.user import User
from app.schemas.reservation import (
    ReservationCreate,
    ReservationReassignRequest,
    ReservationResponse,
    ReservationStatusUpdate,
    TableAssignmentHistoryResponse,
)
from app.services.reservation_service import (
    InvalidReservationStateError,
    NoAvailableTableError,
    PolicyViolationError,
    ReservationNotFoundError,
    ReservationPermissionError,
    RestaurantNotAvailableError,
    cancel_reservation,
    confirm_reservation,
    create_reservation,
    get_owner_reservations,
    get_reservation_history,
    reassign_reservation_table,
    update_reservation_status,
)

router = APIRouter(
    prefix="/reservations",
    tags=["Reservations"],
)


def _enrich_reservation_response(res: Reservation, db: Session) -> ReservationResponse:
    restaurant = db.scalar(select(Restaurant.name).where(Restaurant.id == res.restaurant_id))
    table = db.scalar(select(RestaurantTable.table_number).where(RestaurantTable.id == res.table_id))

    return ReservationResponse(
        id=res.id,
        booking_reference=res.booking_reference,
        user_id=res.user_id,
        restaurant_id=res.restaurant_id,
        restaurant_name=restaurant or "Tablekeeper Restaurant",
        table_id=res.table_id,
        table_number=table or f"T{res.table_id}",
        guest_count=res.guest_count,
        start_time=res.start_time,
        end_time=res.end_time,
        status=res.status,
        customer_name=res.customer_name,
        customer_email=res.customer_email,
        customer_phone=res.customer_phone,
        special_request=res.special_request,
        policy_version_accepted=res.policy_version_accepted,
        accepted_policy_terms=res.accepted_policy_terms,
        created_at=res.created_at,
        updated_at=res.updated_at,
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
        reservation = create_reservation(
            db=db,
            restaurant_id=reservation_data.restaurant_id,
            user_id=current_user.id,
            guest_count=reservation_data.guest_count,
            start_time=reservation_data.start_time,
            end_time=reservation_data.end_time,
            status="confirmed",
            selected_table_id=reservation_data.selected_table_id,
            customer_name=reservation_data.customer_name or current_user.full_name,
            customer_email=reservation_data.customer_email or current_user.email,
            customer_phone=reservation_data.customer_phone,
            special_request=reservation_data.special_request,
            policy_version_accepted=reservation_data.policy_version_accepted,
            accepted_policy_terms=reservation_data.accepted_policy_terms,
            idempotency_key=reservation_data.idempotency_key,
        )
        return _enrich_reservation_response(reservation, db)
    except RestaurantNotAvailableError as exc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(exc),
        ) from exc
    except (NoAvailableTableError, PolicyViolationError) as exc:
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
    reservations = db.scalars(
        select(Reservation)
        .where(Reservation.user_id == current_user.id)
        .order_by(
            Reservation.start_time.desc(),
            Reservation.id.desc(),
        )
    ).all()

    return [_enrich_reservation_response(res, db) for res in reservations]


@router.get(
    "/owner/{restaurant_id}",
    response_model=list[ReservationResponse],
)
def get_owner_restaurant_reservations(
    restaurant_id: int,
    date: str | None = Query(default=None),
    status: str | None = Query(default=None),
    search: str | None = Query(default=None),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("owner")),
):
    """Retrieve reservations for an owned restaurant with filtering."""
    try:
        reservations = get_owner_reservations(
            db=db,
            restaurant_id=restaurant_id,
            owner_id=current_user.id,
            date_filter=date,
            status_filter=status,
            search=search,
        )
        return [_enrich_reservation_response(res, db) for res in reservations]
    except ReservationPermissionError as exc:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=str(exc),
        ) from exc


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
        # Check if user is the booking customer or the restaurant owner
        res = db.scalar(select(Reservation).where(Reservation.id == reservation_id))
        if res is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Reservation not found",
            )

        if res.user_id == current_user.id:
            reservation = cancel_reservation(
                db=db,
                reservation_id=reservation_id,
                user_id=current_user.id,
            )
        elif current_user.role == "owner":
            reservation = update_reservation_status(
                db=db,
                reservation_id=reservation_id,
                owner_id=current_user.id,
                new_status="cancelled",
                reason="Cancelled by owner",
            )
        else:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You do not have permission to cancel this reservation",
            )

        return _enrich_reservation_response(reservation, db)
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
        reservation = confirm_reservation(
            db=db,
            reservation_id=reservation_id,
            owner_id=current_user.id,
        )
        return _enrich_reservation_response(reservation, db)
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
    "/{reservation_id}/status",
    response_model=ReservationResponse,
)
def change_reservation_status(
    reservation_id: int,
    status_data: ReservationStatusUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("owner")),
):
    """Owner status update: confirmed, seated, completed, cancelled."""
    try:
        reservation = update_reservation_status(
            db=db,
            reservation_id=reservation_id,
            owner_id=current_user.id,
            new_status=status_data.status,
            reason=status_data.reason,
        )
        return _enrich_reservation_response(reservation, db)
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
    "/{reservation_id}/reassign",
    response_model=ReservationResponse,
)
def reassign_table(
    reservation_id: int,
    reassign_data: ReservationReassignRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("owner")),
):
    """Owner reassigns reservation to a new table with capacity & conflict validation."""
    try:
        reservation = reassign_reservation_table(
            db=db,
            reservation_id=reservation_id,
            owner_id=current_user.id,
            new_table_id=reassign_data.new_table_id,
            reason=reassign_data.reason,
        )
        return _enrich_reservation_response(reservation, db)
    except ReservationNotFoundError as exc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(exc),
        ) from exc
    except NoAvailableTableError as exc:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=str(exc),
        ) from exc


@router.get(
    "/{reservation_id}/history",
    response_model=list[TableAssignmentHistoryResponse],
)
def get_table_history(
    reservation_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("owner")),
):
    """Retrieve audit history of table assignments for a reservation."""
    history = get_reservation_history(db, reservation_id)

    response_items = []
    for h in history:
        orig_t = db.scalar(select(RestaurantTable.table_number).where(RestaurantTable.id == h.original_table_id)) if h.original_table_id else None
        new_t = db.scalar(select(RestaurantTable.table_number).where(RestaurantTable.id == h.new_table_id)) if h.new_table_id else None
        response_items.append(
            TableAssignmentHistoryResponse(
                id=h.id,
                reservation_id=h.reservation_id,
                original_table_id=h.original_table_id,
                original_table_number=orig_t,
                new_table_id=h.new_table_id,
                new_table_number=new_t,
                changed_by_user_id=h.changed_by_user_id,
                reason=h.reason,
                created_at=h.created_at,
            )
        )

    return response_items
