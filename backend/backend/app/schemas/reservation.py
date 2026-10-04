
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


class ReservationResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    booking_reference: str
    user_id: int
    restaurant_id: int
    table_id: int
    guest_count: int
    start_time: datetime
    end_time: datetime
    status: Literal["pending", "confirmed", "cancelled"]
    created_at: datetime
    updated_at: datetime


class ReservationStatusUpdate(BaseModel):
    status: Literal["pending", "confirmed", "cancelled"]
