import os
import sys
import unittest
from datetime import datetime, timedelta, timezone

# Add backend directory to sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from fastapi.testclient import TestClient
from app.main import app
from app.core.database import SessionLocal
from app.models.restaurant import Restaurant
from app.models.restaurant_table import RestaurantTable
from app.models.user import User

client = TestClient(app)


class TablekeeperFullPlatformTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.db = SessionLocal()
        # Ensure test owner exists
        cls.owner_email = "test_owner_runner@tablekeeper.com"
        cls.customer_email = "test_customer_runner@tablekeeper.com"
        cls.password = "TestRunner123!"

    @classmethod
    def tearDownClass(cls):
        cls.db.close()

    def test_01_user_registration_and_authentication(self):
        """Test customer and owner registration and token generation."""
        # 1. Register Customer
        cust_res = client.post(
            "/users/register",
            json={
                "full_name": "Test Customer",
                "email": self.customer_email,
                "password": self.password,
                "role": "customer",
            },
        )
        if cust_res.status_code == 409 and "already exists" in cust_res.text:
            pass  # Already exists from previous run
        else:
            self.assertEqual(cust_res.status_code, 201)

        # Login Customer
        login_res = client.post(
            "/users/login",
            json={"email": self.customer_email, "password": self.password},
        )
        self.assertEqual(login_res.status_code, 200)
        self.assertIn("access_token", login_res.json())
        self.customer_token = login_res.json()["access_token"]

        # 2. Register Owner
        owner_res = client.post(
            "/users/register",
            json={
                "full_name": "Test Owner",
                "email": self.owner_email,
                "password": self.password,
                "role": "owner",
            },
        )
        if owner_res.status_code == 409 and "already exists" in owner_res.text:
            pass
        else:
            self.assertEqual(owner_res.status_code, 201)

        # Login Owner
        owner_login = client.post(
            "/users/login",
            json={"email": self.owner_email, "password": self.password},
        )
        self.assertEqual(owner_login.status_code, 200)
        self.assertIn("access_token", owner_login.json())
        self.owner_token = owner_login.json()["access_token"]

    def test_02_policy_retrieval_and_restaurant_discovery(self):
        """Test restaurant policies and listing."""
        # Get restaurants
        res = client.get("/restaurants/")
        self.assertEqual(res.status_code, 200)
        restaurants = res.json()
        self.assertGreater(len(restaurants), 0)

        restaurant_id = restaurants[0]["id"]

        # Get policies
        policy_res = client.get(f"/restaurants/{restaurant_id}/policies")
        self.assertEqual(policy_res.status_code, 200)
        data = policy_res.json()
        self.assertIn("cancellation_hours", data)
        self.assertIn("late_arrival_minutes", data)
        self.assertIn("policy_version", data)

    def test_03_table_availability_and_reservation_creation(self):
        """Test availability check, booking creation with policy acceptance."""
        # Login customer
        login_res = client.post(
            "/users/login",
            json={"email": self.customer_email, "password": self.password},
        )
        token = login_res.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}

        # Pick restaurant and table
        restaurants = client.get("/restaurants/").json()
        restaurant_id = restaurants[0]["id"]

        tables = client.get(f"/tables/restaurant/{restaurant_id}").json()
        self.assertGreater(len(tables), 0)
        table = tables[0]

        # Unique future slot
        import time
        unique_offset = int(time.time() * 1000) % 1000000
        start_time = datetime.now(timezone.utc) + timedelta(days=20) + timedelta(minutes=unique_offset % 50000)
        end_time = start_time + timedelta(minutes=90)

        # Check availability
        start_iso = start_time.isoformat().replace("+00:00", "Z")
        end_iso = end_time.isoformat().replace("+00:00", "Z")
        avail_res = client.get(
            f"/availability/{restaurant_id}?start_time={start_iso}&end_time={end_iso}&guest_count=2"
        )
        self.assertEqual(avail_res.status_code, 200)

        # Create Reservation
        booking_payload = {
            "restaurant_id": restaurant_id,
            "selected_table_id": table["id"],
            "guest_count": 2,
            "start_time": start_time.isoformat(),
            "end_time": end_time.isoformat(),
            "customer_name": "Test Customer",
            "customer_email": self.customer_email,
            "customer_phone": "+919876543210",
            "special_request": "Window seat preferred",
            "policy_version_accepted": 1,
            "accepted_policy_terms": "Standard cancellation policy accepted.",
        }

        book_res = client.post("/reservations/", json=booking_payload, headers=headers)
        self.assertEqual(book_res.status_code, 201)
        book_data = book_res.json()
        self.assertIn("booking_reference", book_data)
        self.assertTrue(book_data["booking_reference"].startswith("TK-"))
        self.assertEqual(book_data["customer_name"], "Test Customer")
        self.assertEqual(book_data["policy_version_accepted"], 1)

        reservation_id = book_data["id"]

        # 4. Double booking prevention (attempt to book exact same table & time)
        dup_res = client.post("/reservations/", json=booking_payload, headers=headers)
        self.assertIn(dup_res.status_code, [400, 409])

        # 5. Customer my reservations
        my_res = client.get("/reservations/me", headers=headers)
        self.assertEqual(my_res.status_code, 200)
        my_data = my_res.json()
        self.assertTrue(any(r["id"] == reservation_id for r in my_data))

        # 6. Cancel reservation & verify availability restored
        cancel_res = client.post(f"/reservations/{reservation_id}/cancel", headers=headers)
        self.assertEqual(cancel_res.status_code, 200)
        self.assertEqual(cancel_res.json()["status"], "cancelled")

        # Now table should be available again
        avail_after_cancel = client.get(
            f"/availability/{restaurant_id}?start_time={start_iso}&end_time={end_iso}&guest_count=2"
        ).json()
        self.assertTrue(any(t["id"] == table["id"] for t in avail_after_cancel))

    def test_04_owner_seating_recovery_and_audit_history(self):
        """Test owner seating recovery workflow and atomic table reassignment."""
        # Login demo owner
        owner_login = client.post(
            "/users/login",
            json={"email": "owner@example.com", "password": "OwnerDemo123!"},
        )
        self.assertEqual(owner_login.status_code, 200)
        owner_token = owner_login.json()["access_token"]
        owner_headers = {"Authorization": f"Bearer {owner_token}"}

        # Get owned restaurants
        owned_res = client.get("/restaurants/owned", headers=owner_headers)
        self.assertEqual(owned_res.status_code, 200)
        owned_list = owned_res.json()
        self.assertGreater(len(owned_list), 0)
        rest = owned_list[0]
        restaurant_id = rest["id"]

        # Get all tables
        tables = client.get(f"/tables/restaurant/{restaurant_id}/all", headers=owner_headers).json()
        self.assertGreaterEqual(len(tables), 2)
        source_table = tables[0]
        target_table = tables[1]

        # Login customer to create booking on source_table
        cust_login = client.post(
            "/users/login",
            json={"email": self.customer_email, "password": self.password},
        )
        cust_token = cust_login.json()["access_token"]
        cust_headers = {"Authorization": f"Bearer {cust_token}"}

        # Dynamic future slot to avoid collision
        import time
        unique_offset = int(time.time() * 1000) % 1000000
        slot_start = datetime.now(timezone.utc) + timedelta(days=10) + timedelta(minutes=unique_offset % 50000)
        slot_end = slot_start + timedelta(minutes=90)

        book_res = client.post(
            "/reservations/",
            json={
                "restaurant_id": restaurant_id,
                "selected_table_id": source_table["id"],
                "guest_count": 2,
                "start_time": slot_start.isoformat(),
                "end_time": slot_end.isoformat(),
                "customer_name": "Recovery Test Guest",
                "customer_email": "recovery@example.com",
                "customer_phone": "+919876543210",
                "policy_version_accepted": 1,
                "accepted_policy_terms": "Standard policy terms",
            },
            headers=cust_headers,
        )
        self.assertEqual(book_res.status_code, 201)
        res_data = book_res.json()
        res_id = res_data["id"]

        # 1. Set source table to maintenance and discover affected reservations
        maint_res = client.post(
            f"/tables/{source_table['id']}/maintenance",
            json={
                "is_active": False,
                "status": "maintenance",
                "reason": "Air conditioner maintenance above table",
            },
            headers=owner_headers,
        )
        self.assertEqual(maint_res.status_code, 200)
        maint_data = maint_res.json()
        self.assertEqual(maint_data["status"], "maintenance")
        self.assertGreaterEqual(len(maint_data["affected_reservations"]), 1)

        # 2. Preview Seating Recovery
        preview_res = client.post(
            "/tables/recovery/preview",
            json={
                "restaurant_id": restaurant_id,
                "reassignments": [{"reservation_id": res_id, "new_table_id": target_table["id"]}],
                "reason": "Air conditioner maintenance above table",
            },
            headers=owner_headers,
        )
        self.assertEqual(preview_res.status_code, 200)
        preview_data = preview_res.json()
        self.assertTrue(preview_data["is_valid"])
        self.assertEqual(preview_data["total_reassignments"], 1)

        # 3. Apply Seating Recovery
        apply_res = client.post(
            "/tables/recovery/apply",
            json={
                "restaurant_id": restaurant_id,
                "reassignments": [{"reservation_id": res_id, "new_table_id": target_table["id"]}],
                "reason": "Emergency maintenance seating recovery",
            },
            headers=owner_headers,
        )
        self.assertEqual(apply_res.status_code, 200)
        apply_data = apply_res.json()
        self.assertTrue(apply_data["success"])
        self.assertEqual(apply_data["reassigned_count"], 1)

        # Verify source table is now in maintenance
        updated_tables = client.get(f"/tables/restaurant/{restaurant_id}/all", headers=owner_headers).json()
        updated_source = next(t for t in updated_tables if t["id"] == source_table["id"])
        self.assertEqual(updated_source["status"], "maintenance")

        # Verify reservation audit history
        history_res = client.get(f"/reservations/{res_id}/history", headers=owner_headers)
        self.assertEqual(history_res.status_code, 200)
        history = history_res.json()
        self.assertGreaterEqual(len(history), 1)
        self.assertEqual(history[0]["new_table_id"], target_table["id"])

        # Restore table to service
        restore_res = client.post(
            f"/tables/{source_table['id']}/maintenance",
            json={"is_active": True, "status": "available", "reason": "Maintenance complete"},
            headers=owner_headers,
        )
        self.assertEqual(restore_res.status_code, 200)

    def test_05_policy_update_and_versioning(self):
        """Test owner policy updates and auto-incrementing policy version."""
        owner_login = client.post(
            "/users/login",
            json={"email": "owner@example.com", "password": "OwnerDemo123!"},
        )
        owner_token = owner_login.json()["access_token"]
        owner_headers = {"Authorization": f"Bearer {owner_token}"}

        owned_list = client.get("/restaurants/owned", headers=owner_headers).json()
        restaurant_id = owned_list[0]["id"]
        current_version = owned_list[0]["policy_version"]

        # Update policy
        update_res = client.put(
            f"/restaurants/{restaurant_id}/policies",
            json={
                "cancellation_hours": 4,
                "late_arrival_minutes": 20,
                "reservation_duration_minutes": 105,
                "max_party_size": 10,
                "policy_terms": "Smart casual dress code. Tables held for 20 minutes.",
            },
            headers=owner_headers,
        )
        self.assertEqual(update_res.status_code, 200)
        updated_policy = update_res.json()
        self.assertEqual(updated_policy["cancellation_hours"], 4)
        self.assertEqual(updated_policy["policy_version"], current_version + 1)


if __name__ == "__main__":
    unittest.main()
