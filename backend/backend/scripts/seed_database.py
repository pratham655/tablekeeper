import os
import sys
from pathlib import Path
from sqlalchemy import select

# Ensure project root is in sys.path
backend_root = Path(__file__).resolve().parent.parent
if str(backend_root) not in sys.path:
    sys.path.insert(0, str(backend_root))

from app.core.database import SessionLocal
from app.models.user import User
from app.models.restaurant import Restaurant
from app.models.restaurant_table import RestaurantTable
from app.core.security import hash_password


RESTAURANTS = [
    {
        "name": "The Olive Table",
        "description": "A relaxed, contemporary dining experience inspired by Mediterranean flavours. Thoughtful ingredients, beautifully prepared plates, and a welcoming setting make it a lovely place to gather.",
        "address": "Indiranagar, Bengaluru, Karnataka",
        "city": "Bengaluru",
        "cuisine": "Mediterranean",
        "price_range": "₹₹₹",
        "phone": "+91 80000 00001",
        "image_url": "https://images.unsplash.com/photo-1515003197210-e0cd71810b5f?auto=format&fit=crop&w=1400&q=85",
        "cancellation_hours": 2,
        "late_arrival_minutes": 15,
        "reservation_duration_minutes": 90,
        "max_party_size": 12,
        "policy_terms": "Reservations are held for 15 minutes past booking time. Cancellations are free up to 2 hours in advance.",
        "tables": [2, 4, 2, 4, 6, 4, 2, 4, 6],
    },
    {
        "name": "Spice Route",
        "description": "A vibrant Indian dining destination serving familiar favourites and regional inspirations in a comfortable setting for family meals, friendly catch-ups, and casual celebrations.",
        "address": "Koramangala, Bengaluru, Karnataka",
        "city": "Bengaluru",
        "cuisine": "Indian",
        "price_range": "₹₹",
        "phone": "+91 80000 00002",
        "image_url": "https://images.unsplash.com/photo-1585937421612-70a008356fbe?auto=format&fit=crop&w=1400&q=85",
        "cancellation_hours": 1,
        "late_arrival_minutes": 15,
        "reservation_duration_minutes": 90,
        "max_party_size": 16,
        "policy_terms": "Table holding window is 15 minutes. Group reservations above 8 guests require confirmation 2 hours in advance.",
        "tables": [2, 4, 2, 4, 6, 4, 2, 4, 6],
    },
    {
        "name": "Sakura House",
        "description": "An elegant Japanese-inspired restaurant with a focus on carefully presented dishes and a calm, modern atmosphere. A considered setting for a memorable evening.",
        "address": "MG Road, Bengaluru, Karnataka",
        "city": "Bengaluru",
        "cuisine": "Japanese",
        "price_range": "₹₹₹₹",
        "phone": "+91 80000 00003",
        "image_url": "https://images.unsplash.com/photo-1579871494447-9811cf80d66c?auto=format&fit=crop&w=1400&q=85",
        "cancellation_hours": 4,
        "late_arrival_minutes": 10,
        "reservation_duration_minutes": 120,
        "max_party_size": 8,
        "policy_terms": "Omakase and sushi reservations are held for 10 minutes. Cancellations within 4 hours may forfeit booking priority.",
        "tables": [2, 4, 2, 4, 6, 4, 2, 4, 6],
    },
    {
        "name": "Casa Verde",
        "description": "A warm Italian-inspired space for slow lunches and relaxed dinners, bringing together comforting classics and an inviting atmosphere.",
        "address": "Whitefield, Bengaluru, Karnataka",
        "city": "Bengaluru",
        "cuisine": "Italian",
        "price_range": "₹₹₹",
        "phone": "+91 80000 00004",
        "image_url": "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=1400&q=85",
        "cancellation_hours": 2,
        "late_arrival_minutes": 15,
        "reservation_duration_minutes": 90,
        "max_party_size": 12,
        "policy_terms": "Tables are held for up to 15 minutes. Please notify the restaurant if running late.",
        "tables": [2, 4, 2, 4, 6, 4, 2, 4, 6],
    },
    {
        "name": "The Terrace",
        "description": "A contemporary dining space with a rooftop-inspired feel, ideal for dinner plans, special occasions, and evenings spent catching up.",
        "address": "HSR Layout, Bengaluru, Karnataka",
        "city": "Bengaluru",
        "cuisine": "Continental",
        "price_range": "₹₹₹",
        "phone": "+91 80000 00005",
        "image_url": "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1400&q=85",
        "cancellation_hours": 2,
        "late_arrival_minutes": 15,
        "reservation_duration_minutes": 90,
        "max_party_size": 14,
        "policy_terms": "Rooftop dining tables are allocated based on weather conditions. Late arrival grace period is 15 minutes.",
        "tables": [2, 4, 2, 4, 6, 4, 2, 4, 6],
    },
    {
        "name": "Chai & Co.",
        "description": "A laid-back neighbourhood spot for tea, snacks, and easy conversations. Drop by for a casual catch-up or a simple meal with friends.",
        "address": "Jayanagar, Bengaluru, Karnataka",
        "city": "Bengaluru",
        "cuisine": "Indian",
        "price_range": "₹₹",
        "phone": "+91 80000 00006",
        "image_url": "https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=1400&q=85",
        "cancellation_hours": 1,
        "late_arrival_minutes": 20,
        "reservation_duration_minutes": 60,
        "max_party_size": 10,
        "policy_terms": "Casual reservations are held for 20 minutes. Free cancellations anytime.",
        "tables": [2, 4, 2, 4, 6, 4, 2, 4, 6],
    },
    {
        "name": "DRUMA",
        "description": "A vegetarian multi-cuisine dining destination in Jayanagar, Bengaluru, with a menu spanning soups, salads, chaats, starters, sliders, quesadillas, pasta, Indian mains, Pan Asian dishes, breads, rice, and desserts.",
        "address": "616, 11th Cross, 7th Block West, Jayanagar, Bengaluru, Karnataka 560070",
        "city": "Bengaluru",
        "cuisine": "Multi-cuisine",
        "price_range": "₹₹",
        "phone": "+91 9980888862",
        "image_url": "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1400&q=85",
        "cancellation_hours": 2,
        "late_arrival_minutes": 15,
        "reservation_duration_minutes": 90,
        "max_party_size": 15,
        "policy_terms": "Pure vegetarian establishment. Tables held for 15 minutes past reservation time.",
        "tables": [2, 4, 2, 4, 6, 4, 2, 4, 6],
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
            db.flush()

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

            restaurant.owner_id = owner.id
            restaurant.description = item["description"]
            restaurant.address = item["address"]
            restaurant.city = item["city"]
            restaurant.cuisine = item["cuisine"]
            restaurant.price_range = item["price_range"]
            restaurant.phone = item["phone"]
            restaurant.image_url = item["image_url"]
            restaurant.cancellation_hours = item["cancellation_hours"]
            restaurant.late_arrival_minutes = item["late_arrival_minutes"]
            restaurant.reservation_duration_minutes = item["reservation_duration_minutes"]
            restaurant.max_party_size = item["max_party_size"]
            restaurant.policy_terms = item["policy_terms"]
            restaurant.is_active = True

            existing_tables = list(
                db.scalars(
                    select(RestaurantTable)
                    .where(RestaurantTable.restaurant_id == restaurant.id)
                    .order_by(RestaurantTable.id)
                ).all()
            )

            for index, capacity in enumerate(item["tables"], start=1):
                table_num = f"Table {index}"
                if index - 1 < len(existing_tables):
                    t = existing_tables[index - 1]
                    t.table_number = table_num
                    t.capacity = capacity
                    t.is_active = True
                    t.status = "available"
                else:
                    db.add(
                        RestaurantTable(
                            restaurant_id=restaurant.id,
                            table_number=table_num,
                            capacity=capacity,
                            is_active=True,
                            status="available",
                        )
                    )

        db.commit()

        active_restaurants = db.scalars(
            select(Restaurant).where(Restaurant.is_active.is_(True))
        ).all()

        print("Seed completed successfully.")
        print(f"Active restaurants: {len(active_restaurants)}")
        for r in active_restaurants:
            t_count = len(r.tables)
            print(f"  [{r.id}] {r.name} - {t_count} tables (Owner: {r.owner_id})")

    except Exception:
        db.rollback()
        raise
    finally:
        db.close()


if __name__ == "__main__":
    seed_database()
