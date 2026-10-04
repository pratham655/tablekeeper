
from sqlalchemy import select

from app.core.database import SessionLocal
from app.models.user import User
from app.models.restaurant import Restaurant
from app.models.restaurant_table import RestaurantTable
from app.core.security import hash_password


RESTAURANTS = [
    {
        "name": "The Olive Table",
        "description": "A Mediterranean dining experience with thoughtfully prepared dishes.",
        "address": "Indiranagar, Bengaluru",
        "city": "Bengaluru",
        "cuisine": "Mediterranean",
        "price_range": "₹₹₹",
        "phone": None,
        "image_url": None,
        "tables": [2, 2, 4, 4, 6],
    },
    {
        "name": "Spice Route",
        "description": "Indian cuisine with regional flavours.",
        "address": "Koramangala, Bengaluru",
        "city": "Bengaluru",
        "cuisine": "Indian",
        "price_range": "₹₹",
        "phone": None,
        "image_url": None,
        "tables": [2, 4, 4, 6],
    },
    {
        "name": "Sakura House",
        "description": "Japanese-inspired dining.",
        "address": "MG Road, Bengaluru",
        "city": "Bengaluru",
        "cuisine": "Japanese",
        "price_range": "₹₹₹₹",
        "phone": None,
        "image_url": None,
        "tables": [2, 2, 4, 6],
    },
    {
        "name": "Casa Verde",
        "description": "Italian dining with a welcoming atmosphere.",
        "address": "Whitefield, Bengaluru",
        "city": "Bengaluru",
        "cuisine": "Italian",
        "price_range": "₹₹₹",
        "phone": None,
        "image_url": None,
        "tables": [2, 2, 4, 4, 6],
    },
    {
        "name": "The Terrace",
        "description": "A relaxed setting for continental cuisine.",
        "address": "HSR Layout, Bengaluru",
        "city": "Bengaluru",
        "cuisine": "Continental",
        "price_range": "₹₹₹",
        "phone": None,
        "image_url": None,
        "tables": [2, 4, 4, 6],
    },
    {
        "name": "Chai & Co.",
        "description": "Indian favourites in a casual dining setting.",
        "address": "Jayanagar, Bengaluru",
        "city": "Bengaluru",
        "cuisine": "Indian",
        "price_range": "₹₹",
        "phone": None,
        "image_url": None,
        "tables": [2, 2, 4, 4],
    },
    {
        "name": "DRUMA",
        "description": "Vegetarian multi-cuisine dining.",
        "address": "Jayanagar, Bengaluru",
        "city": "Bengaluru",
        "cuisine": "Multi-cuisine",
        "price_range": "₹₹",
        "phone": None,
        "image_url": None,
        "tables": [2, 2, 4, 4, 6],
    },
]


def get_or_create_owner(db):
    owner = db.scalar(
        select(User).where(User.email == "owner@example.com")
    )

    if owner is None:
        owner = User(
            full_name="Tablekeeper Demo Owner",
            email="owner@example.com",
            password_hash=hash_password("OwnerDemo123!"),
            role="owner",
            is_active=True,
        )
        db.add(owner)
        db.flush()

    return owner


def seed_database():
    db = SessionLocal()

    try:
        owner = get_or_create_owner(db)

        customer = db.scalar(
            select(User).where(
                User.email == "customer@example.com"
            )
        )
        if customer is None:
            customer = User(
                full_name="Tablekeeper Demo Customer",
                email="customer@example.com",
                password_hash=hash_password("CustomerDemo123!"),
                role="customer",
                is_active=True,
            )
            db.add(customer)

        for item in RESTAURANTS:
            restaurant = db.scalar(
                select(Restaurant).where(
                    Restaurant.name == item["name"],
                    Restaurant.city == item["city"],
                )
            )

            if restaurant is None:
                restaurant = Restaurant(
                    owner_id=owner.id,
                    name=item["name"],
                    city=item["city"],
                    address=item["address"],
                    cuisine=item["cuisine"],
                    is_active=True,
                )
                db.add(restaurant)
                db.flush()

            # Update the restaurant details to match the frontend.
            restaurant.owner_id = owner.id
            restaurant.description = item["description"]
            restaurant.address = item["address"]
            restaurant.city = item["city"]
            restaurant.cuisine = item["cuisine"]
            restaurant.price_range = item["price_range"]
            restaurant.phone = item["phone"]
            restaurant.image_url = item["image_url"]
            restaurant.is_active = True

            existing_numbers = set(
                db.scalars(
                    select(RestaurantTable.table_number).where(
                        RestaurantTable.restaurant_id == restaurant.id
                    )
                ).all()
            )

            for index, capacity in enumerate(
                item["tables"], start=1
            ):
                table_number = f"T{index}"

                if table_number not in existing_numbers:
                    db.add(
                        RestaurantTable(
                            restaurant_id=restaurant.id,
                            table_number=table_number,
                            capacity=capacity,
                            is_active=True,
                        )
                    )

        # Hide only the known test restaurants from discovery.
        for test_name in (
            "Green Garden Bistro",
            "Test Owner Bistro",
        ):
            test_restaurant = db.scalar(
                select(Restaurant).where(
                    Restaurant.name == test_name
                )
            )
            if test_restaurant is not None:
                test_restaurant.is_active = False

        db.commit()

        active_restaurants = db.scalars(
            select(Restaurant).where(
                Restaurant.is_active.is_(True)
            )
        ).all()

        print("Seed completed successfully.")
        print(f"Active restaurants: {len(active_restaurants)}")

        for restaurant in active_restaurants:
            table_count = len(
                db.scalars(
                    select(RestaurantTable).where(
                        RestaurantTable.restaurant_id == restaurant.id,
                        RestaurantTable.is_active.is_(True),
                    )
                ).all()
            )
            print(
                f"{restaurant.id}: {restaurant.name} "
                f"({table_count} active tables)"
            )

    except Exception:
        db.rollback()
        raise

    finally:
        db.close()


if __name__ == "__main__":
    seed_database()
