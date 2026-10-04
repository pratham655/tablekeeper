from pydantic import BaseModel, ConfigDict, Field


class RestaurantTableCreate(BaseModel):
    restaurant_id: int = Field(gt=0)
    table_number: str = Field(min_length=1, max_length=30)
    capacity: int = Field(gt=0, le=50)


class RestaurantTableUpdate(BaseModel):
    table_number: str | None = Field(default=None, min_length=1, max_length=30)
    capacity: int | None = Field(default=None, gt=0, le=50)
    is_active: bool | None = None


class RestaurantTableResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    restaurant_id: int
    table_number: str
    capacity: int
    is_active: bool
