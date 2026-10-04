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


class RestaurantCreate(RestaurantBase):
    pass


class RestaurantUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=2, max_length=150)
    description: str | None = None
    address: str | None = Field(default=None, min_length=3, max_length=300)
    city: str | None = Field(default=None, min_length=2, max_length=100)
    cuisine: str | None = Field(default=None,min_length=2,max_length=100)
    price_range: str | None = Field(default=None, max_length=20)
    phone: str | None = Field(default=None, max_length=30)
    image_url: str | None = Field(default=None, max_length=500)


class RestaurantResponse(RestaurantBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    owner_id: int | None = None
    is_active: bool
