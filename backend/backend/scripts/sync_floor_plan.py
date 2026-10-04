
from sqlalchemy import select

from app.core.database import SessionLocal
from app.models.restaurant import Restaurant
from app.models.restaurant_table import RestaurantTable


RESTAURANT_NAMES = [
    "The Olive Table",
    "Spice Route",
    "Sakura House",
    "Casa Verde",
    "The Terrace",
    "Chai & Co.",
    "DRUMA",
]

CAPACITIES = [2, 4, 2, 4, 6, 4, 2, 4, 6]


def sync_floor_plan():
    db = SessionLocal()

    try:
        for name in RESTAURANT_NAMES:
            restaurant = db.scalar(
                select(Restaurant).where(
                    Restaurant.name == name,
                    Restaurant.city == "Bengaluru",
                )
            )

            if restaurant is None:
                raise ValueError(f"Restaurant not found: {name}")

            tables = list(
                db.scalars(
                    select(RestaurantTable)
                    .where(
                        RestaurantTable.restaurant_id == restaurant.id
                    )
                    .order_by(RestaurantTable.id)
                ).all()
            )

            # Temporarily rename existing tables to avoid unique-name
            # conflicts when assigning the final table numbers.
            for table in tables:
                table.table_number = f"__tmp_{table.id}"

            db.flush()

            # Reuse existing records so reservation foreign keys remain valid.
            for index, capacity in enumerate(CAPACITIES):
                table_number = f"Table {index + 1}"

                if index < len(tables):
                    table = tables[index]
                    table.table_number = table_number
                    table.capacity = capacity
                    table.is_active = True
                else:
                    db.add(
                        RestaurantTable(
                            restaurant_id=restaurant.id,
                            table_number=table_number,
                            capacity=capacity,
                            is_active=True,
                        )
                    )

            # Preserve any extra old table records, but hide them
            # from the active floor plan.
            for table in tables[len(CAPACITIES):]:
                table.table_number = f"Legacy {table.id}"
                table.is_active = False

            db.flush()
            print(f"Updated: {name} — 9 active tables")

        db.commit()
        print("Floor plan sync completed successfully.")

    except Exception:
        db.rollback()
        raise

    finally:
        db.close()


if __name__ == "__main__":
    sync_floor_plan()
