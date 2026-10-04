from datetime import datetime
from pydantic import BaseModel, ConfigDict, Field
from app.schemas.restaurant_table import RestaurantTableResponse


class AffectedReservation(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    reservation_id: int
    booking_reference: str
    customer_name: str | None = None
    customer_email: str | None = None
    customer_phone: str | None = None
    guest_count: int
    start_time: datetime
    end_time: datetime
    current_table_id: int
    current_table_number: str
    available_alternative_tables: list[RestaurantTableResponse] = []


class TableMaintenanceRequest(BaseModel):
    is_active: bool
    status: str = Field(default="maintenance", max_length=30)
    reason: str | None = Field(default="Table maintenance", max_length=255)


class TableMaintenanceResponse(BaseModel):
    table_id: int
    table_number: str
    is_active: bool
    status: str
    affected_reservations: list[AffectedReservation] = []


class RecoveryReassignmentItem(BaseModel):
    reservation_id: int = Field(gt=0)
    new_table_id: int = Field(gt=0)


class RecoveryPreviewRequest(BaseModel):
    restaurant_id: int = Field(gt=0)
    reassignments: list[RecoveryReassignmentItem]
    reason: str | None = Field(default="Seating recovery", max_length=255)


class RecoveryPreviewItemResult(BaseModel):
    reservation_id: int
    booking_reference: str
    guest_count: int
    start_time: datetime
    end_time: datetime
    current_table_id: int
    current_table_number: str
    new_table_id: int
    new_table_number: str
    valid: bool
    error_message: str | None = None


class RecoveryPreviewResponse(BaseModel):
    is_valid: bool
    total_reassignments: int
    preview_items: list[RecoveryPreviewItemResult]


class RecoveryApplyRequest(BaseModel):
    restaurant_id: int = Field(gt=0)
    reassignments: list[RecoveryReassignmentItem]
    reason: str | None = Field(default="Seating recovery", max_length=255)


class RecoveryApplyResponse(BaseModel):
    success: bool
    message: str
    reassigned_count: int
    reassignments: list[RecoveryPreviewItemResult]
