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
from app.schemas.table_recovery import (
    RecoveryApplyRequest,
    RecoveryApplyResponse,
    RecoveryPreviewRequest,
    RecoveryPreviewResponse,
    TableMaintenanceRequest,
    TableMaintenanceResponse,
)
from app.services.table_service import (
    InvalidTableUpdateError,
    RestaurantNotFoundError,
    TableNotFoundError,
    TableServiceError,
    apply_seating_recovery,
    create_table,
    preview_seating_recovery,
    toggle_table_maintenance,
    update_table,
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


@router.get(
    "/restaurant/{restaurant_id}/all",
    response_model=list[RestaurantTableResponse],
)
def get_all_restaurant_tables(
    restaurant_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("owner")),
):
    """Retrieve all tables including inactive / in maintenance for an owned restaurant."""
    restaurant = db.scalar(
        select(Restaurant).where(
            Restaurant.id == restaurant_id,
            Restaurant.owner_id == current_user.id,
            Restaurant.is_active.is_(True),
        )
    )

    if restaurant is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Restaurant not found or unauthorized",
        )

    tables = db.scalars(
        select(RestaurantTable)
        .where(RestaurantTable.restaurant_id == restaurant_id)
        .order_by(RestaurantTable.table_number.asc(), RestaurantTable.id.asc())
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


@router.post(
    "/{table_id}/maintenance",
    response_model=TableMaintenanceResponse,
)
def set_table_maintenance(
    table_id: int,
    request_data: TableMaintenanceRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("owner")),
):
    """
    Set a table to maintenance/inactive, and return any affected reservations
    with alternative table suggestions.
    """
    try:
        table, affected = toggle_table_maintenance(
            db=db,
            table_id=table_id,
            owner_id=current_user.id,
            is_active=request_data.is_active,
            status_text=request_data.status,
            reason=request_data.reason,
        )

        return TableMaintenanceResponse(
            table_id=table.id,
            table_number=table.table_number,
            is_active=table.is_active,
            status=table.status,
            affected_reservations=affected,
        )
    except TableNotFoundError as exc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(exc),
        ) from exc


@router.post(
    "/recovery/preview",
    response_model=RecoveryPreviewResponse,
)
def preview_recovery(
    request_data: RecoveryPreviewRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("owner")),
):
    """
    Preview table reassignments for seating recovery without modifying database.
    """
    try:
        is_valid, preview_items = preview_seating_recovery(
            db=db,
            restaurant_id=request_data.restaurant_id,
            owner_id=current_user.id,
            reassignments=request_data.reassignments,
            reason=request_data.reason,
        )

        return RecoveryPreviewResponse(
            is_valid=is_valid,
            total_reassignments=len(preview_items),
            preview_items=preview_items,
        )
    except RestaurantNotFoundError as exc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(exc),
        ) from exc


@router.post(
    "/recovery/apply",
    response_model=RecoveryApplyResponse,
)
def apply_recovery(
    request_data: RecoveryApplyRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("owner")),
):
    """
    Atomically apply seating recovery reassignments in PostgreSQL.
    Rolls back automatically on failure.
    """
    try:
        applied_items = apply_seating_recovery(
            db=db,
            restaurant_id=request_data.restaurant_id,
            owner_id=current_user.id,
            reassignments=request_data.reassignments,
            reason=request_data.reason,
        )

        return RecoveryApplyResponse(
            success=True,
            message=f"Successfully reassigned {len(applied_items)} reservations",
            reassigned_count=len(applied_items),
            reassignments=applied_items,
        )
    except (RestaurantNotFoundError, TableNotFoundError) as exc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(exc),
        ) from exc
    except InvalidTableUpdateError as exc:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=str(exc),
        ) from exc
    except TableServiceError as exc:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=str(exc),
        ) from exc