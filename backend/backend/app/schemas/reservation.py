from datetime import datetime
from typing import Literal

from pydantic import (
    BaseModel,
    ConfigDict,
    Field,
    field_validator,
    model_validator,
)


class ReservationCreate(BaseModel):
    restaurant_id: int = Field(gt=0)
    guest_count: int = Field(gt=0, le=50)
    start_time: datetime
    end_time: datetime
    selected_table_id: int | None = Field(default=None, gt=0)
    customer_name: str | None = Field(default=None, max_length=150)
    customer_email: str | None = Field(default=None, max_length=254)
    customer_phone: str | None = Field(default=None, max_length=50)
    special_request: str | None = Field(default=None, max_length=500)
    policy_version_accepted: int | None = None
    accepted_policy_terms: str | None = None
    idempotency_key: str | None = Field(default=None, max_length=100)

    @field_validator("start_time", "end_time")
    @classmethod
    def require_timezone(cls, value: datetime) -> datetime:
        if value.tzinfo is None or value.utcoffset() is None:
            raise ValueError("Datetime must include a timezone offset")
        return value

    @model_validator(mode="after")
    def validate_time_range(self):
        if self.end_time <= self.start_time:
            raise ValueError("end_time must be after start_time")
        return self


class ReservationCancel(BaseModel):
    reason: str | None = Field(default=None, max_length=500)


class TableAssignmentHistoryResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    reservation_id: int
    original_table_id: int | None = None
    original_table_number: str | None = None
    new_table_id: int | None = None
    new_table_number: str | None = None
    changed_by_user_id: int | None = None
    reason: str | None = None
    created_at: datetime


class ReservationResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    booking_reference: str
    user_id: int
    restaurant_id: int
    restaurant_name: str | None = None
    table_id: int
    table_number: str | None = None
    guest_count: int
    start_time: datetime
    end_time: datetime
    status: Literal["pending", "confirmed", "cancelled", "seated", "completed"]
    customer_name: str | None = None
    customer_email: str | None = None
    customer_phone: str | None = None
    special_request: str | None = None
    policy_version_accepted: int | None = None
    accepted_policy_terms: str | None = None
    created_at: datetime
    updated_at: datetime


class ReservationStatusUpdate(BaseModel):
    status: Literal["pending", "confirmed", "cancelled", "seated", "completed"]
    reason: str | None = Field(default=None, max_length=255)


class ReservationReassignRequest(BaseModel):
    new_table_id: int = Field(gt=0)
    reason: str | None = Field(default="Owner table reassignment", max_length=255)
