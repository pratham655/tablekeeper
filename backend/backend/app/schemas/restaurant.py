from pydantic import BaseModel, ConfigDict, Field


class RestaurantBase(BaseModel):
    name: str = Field(min_length=2, max_length=150)
    description: str | None = None
    address: str = Field(min_length=3, max_length=300)
    city: str = Field(min_length=2, max_length=100)
    cuisine: str = Field(min_length=2, max_length=100)
    price_range: str | None = Field(default=None, max_length=20)
    phone: str | None = Field(default=None, max_length=30)
    image_url: str | None = Field(default=None, max_length=500)
    cancellation_hours: int = Field(default=2, ge=0, le=72)
    late_arrival_minutes: int = Field(default=15, ge=0, le=120)
    reservation_duration_minutes: int = Field(default=90, ge=15, le=360)
    max_party_size: int = Field(default=10, ge=1, le=50)
    policy_terms: str | None = None


class RestaurantCreate(RestaurantBase):
    pass


class RestaurantUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=2, max_length=150)
    description: str | None = None
    address: str | None = Field(default=None, min_length=3, max_length=300)
    city: str | None = Field(default=None, min_length=2, max_length=100)
    cuisine: str | None = Field(default=None, min_length=2, max_length=100)
    price_range: str | None = Field(default=None, max_length=20)
    phone: str | None = Field(default=None, max_length=30)
    image_url: str | None = Field(default=None, max_length=500)
    cancellation_hours: int | None = Field(default=None, ge=0, le=72)
    late_arrival_minutes: int | None = Field(default=None, ge=0, le=120)
    reservation_duration_minutes: int | None = Field(default=None, ge=15, le=360)
    max_party_size: int | None = Field(default=None, ge=1, le=50)
    policy_terms: str | None = None


class RestaurantPolicyUpdate(BaseModel):
    cancellation_hours: int = Field(default=2, ge=0, le=72)
    late_arrival_minutes: int = Field(default=15, ge=0, le=120)
    reservation_duration_minutes: int = Field(default=90, ge=15, le=360)
    max_party_size: int = Field(default=10, ge=1, le=50)
    policy_terms: str | None = None


class RestaurantPolicyResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    restaurant_id: int
    restaurant_name: str
    cancellation_hours: int
    late_arrival_minutes: int
    reservation_duration_minutes: int
    max_party_size: int
    policy_terms: str | None
    policy_version: int


class RestaurantResponse(RestaurantBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    owner_id: int | None = None
    policy_version: int = 1
    is_active: bool
