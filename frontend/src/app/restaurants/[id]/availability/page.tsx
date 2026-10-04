"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import RestaurantFloorPlan, { RestaurantTable } from "../../../../components/RestaurantFloorPlan";
import Navbar from "../../../../components/Navbar";

const restaurantNames: Record<string, string> = {
  "1": "The Olive Table",
  "2": "Spice Route",
  "3": "Sakura House",
  "4": "Casa Verde",
  "5": "The Terrace",
  "6": "Chai & Co.",
  "7": "DRUMA",
};

const restaurantDbIds: Record<string, number> = {
  "1": 12,
  "2": 13,
  "3": 14,
  "4": 17,
  "5": 18,
  "6": 19,
  "7": 20,
};

const reservationTimes = [
  { value: "12:00", label: "12:00 PM" },
  { value: "12:30", label: "12:30 PM" },
  { value: "13:00", label: "1:00 PM" },
  { value: "13:30", label: "1:30 PM" },
  { value: "14:00", label: "2:00 PM" },
  { value: "18:00", label: "6:00 PM" },
  { value: "18:30", label: "6:30 PM" },
  { value: "19:00", label: "7:00 PM" },
  { value: "19:30", label: "7:30 PM" },
  { value: "20:00", label: "8:00 PM" },
  { value: "20:30", label: "8:30 PM" },
  { value: "21:00", label: "9:00 PM" },
];

function getTodayLocal(): string {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function getSafeGuests(value: string | null): number {
  const guests = Number(value ?? "2");

  if (!Number.isFinite(guests) || guests < 1) {
    return 2;
  }

  return Math.min(guests, 6);
}

function AvailabilityContent() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const searchParams = useSearchParams();

  const restaurantId = params.id;
  const restaurantName = restaurantNames[restaurantId] ?? "Restaurant";

  const today = getTodayLocal();

  const [date, setDate] = useState(
    searchParams.get("date") || today
  );

  const [time, setTime] = useState(
    searchParams.get("time") || "19:00"
  );

  const [guests, setGuests] = useState(
    getSafeGuests(searchParams.get("guests"))
  );

  const [selectedTable, setSelectedTable] = useState<RestaurantTable | null>(null);
  const [selectedTableId, setSelectedTableId] = useState(
    searchParams.get("table") || ""
  );

  const [error, setError] = useState("");

  const [unavailableTableIds, setUnavailableTableIds] = useState<string[]>([]);
  const [isCheckingAvailability, setIsCheckingAvailability] = useState(false);
  const [availabilityError, setAvailabilityError] = useState("");

  useEffect(() => {
    const backendRestaurantId = restaurantDbIds[restaurantId];

    if (!backendRestaurantId || !date || !time || guests < 1) {
      setUnavailableTableIds([]);
      setAvailabilityError("Invalid restaurant or reservation details.");
      return;
    }

    if (date < getTodayLocal()) {
      setUnavailableTableIds([]);
      setAvailabilityError("Please select today or a future date.");
      return;
    }

    const start = new Date(`${date}T${time}:00+05:30`);

    if (Number.isNaN(start.getTime())) {
      setUnavailableTableIds([]);
      setAvailabilityError("Invalid reservation date or time.");
      return;
    }

    const end = new Date(start.getTime() + 90 * 60 * 1000);
    const controller = new AbortController();

    const checkAvailability = async () => {
      setIsCheckingAvailability(true);
      setAvailabilityError("");
      setUnavailableTableIds([]);

      try {
        const baseUrl =
          process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

        const query = new URLSearchParams({
          start_time: start.toISOString(),
          end_time: end.toISOString(),
          guest_count: String(guests),
        });

        const [tablesResponse, availabilityResponse] = await Promise.all([
          fetch(
            `${baseUrl}/tables/restaurant/${backendRestaurantId}`,
            { signal: controller.signal, cache: "no-store" }
          ),
          fetch(
            `${baseUrl}/availability/${backendRestaurantId}?${query.toString()}`,
            { signal: controller.signal, cache: "no-store" }
          ),
        ]);

        if (!tablesResponse.ok) {
          throw new Error("Unable to load restaurant tables.");
        }

        if (!availabilityResponse.ok) {
          if (availabilityResponse.status === 404) {
            throw new Error("Restaurant not found or unavailable.");
          }
          throw new Error("Unable to check table availability.");
        }

        const allTables = await tablesResponse.json();
        const availableTables = await availabilityResponse.json();

        const availableIds = new Set(
          availableTables.map((table: { id: number | string }) =>
            String(table.id)
          )
        );

        const unavailableIds = allTables
          .filter(
            (table: { id: number | string; is_active?: boolean }) =>
              table.is_active !== false && !availableIds.has(String(table.id))
          )
          .map((table: { id: number | string }) => String(table.id));

        if (!controller.signal.aborted) {
          setUnavailableTableIds(unavailableIds);
        }
      } catch (err) {
        if (controller.signal.aborted) return;

        console.error("Availability check failed:", err);
        setAvailabilityError(
          err instanceof Error
            ? err.message
            : "Unable to check availability. Please try again."
        );
      } finally {
        if (!controller.signal.aborted) {
          setIsCheckingAvailability(false);
        }
      }
    };

    void checkAvailability();

    return () => controller.abort();
  }, [restaurantId, date, time, guests]);

  const handleDateChange = (value: string) => {
    setDate(value);
    setSelectedTableId("");
    setSelectedTable(null);
    setError("");
  };

  const handleTimeChange = (value: string) => {
    setTime(value);
    setSelectedTableId("");
    setSelectedTable(null);
    setError("");
  };

  const handleGuestsChange = (value: string) => {
    setGuests(Number(value));
    setSelectedTableId("");
    setSelectedTable(null);
    setError("");
  };

  const handleTableSelect = (table: RestaurantTable) => {
    setSelectedTable(table);
    setSelectedTableId(table.id);
    setError("");
  };

  const handleContinue = () => {
    setError("");

    if (!date) {
      setError("Please select a reservation date.");
      return;
    }

    if (date < today) {
      setError("Please select today or a future date.");
      return;
    }

    if (!time) {
      setError("Please select a reservation time.");
      return;
    }

    if (!selectedTableId) {
      setError("Please select an available table to continue.");
      return;
    }

    const query = new URLSearchParams({
      date,
      time,
      guests: String(guests),
      table: selectedTableId,
      seats: String(selectedTable?.capacity || 4),
      tableName: selectedTable?.name || `Table ${selectedTableId}`,
    });

    router.push(
      `/restaurants/${restaurantId}/reservation?${query.toString()}`
    );
  };

  return (
    <main className="min-h-screen bg-[#f8f7f2] text-[#20251f]">
      {/* NAVBAR */}
      <Navbar />

      <div className="container-shell pb-20 pt-8 sm:pt-10">
        {/* Breadcrumb navigation */}
        <nav
          aria-label="Breadcrumb"
          className="mb-6 flex flex-wrap items-center gap-2 text-xs text-[#85877e]"
        >
          <Link href="/" className="transition hover:text-[#244b38]">
            Discover
          </Link>
          <span>/</span>
          <Link
            href={`/restaurants/${restaurantId}`}
            className="transition hover:text-[#244b38]"
          >
            {restaurantName}
          </Link>
          <span>/</span>
          <span className="font-semibold text-[#20251f]">Table availability</span>
        </nav>

        {/* Step indicator */}
        <div className="mb-6 flex items-center gap-3">
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#244b38] text-xs font-bold text-white">
            1
          </span>
          <span className="text-xs font-bold uppercase tracking-wider text-[#244b38]">
            Step 1 of 2: Choose Table &amp; Time
          </span>
          <div className="h-px flex-1 bg-[#e5e3da]" />
          <span className="text-xs font-medium text-[#8c9185]">
            Step 2: Guest Details
          </span>
        </div>

        {/* Reservation details control panel */}
        <section className="relative overflow-hidden rounded-[26px] border border-[#e5e3da] bg-white p-6 shadow-[0_12px_40px_rgba(31,49,34,0.05)] sm:p-8">
          <div
            aria-hidden="true"
            className="float-decoration pointer-events-none absolute right-6 top-10"
          >
            <div className="citrus-decoration h-16 w-16 opacity-40" />
          </div>

          <div className="relative z-10">
            <div className="inline-flex items-center gap-2 rounded-full border border-[#d9b66b]/40 bg-[#fbf8f0] px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-[#8c6b32]">
              <span className="h-1.5 w-1.5 rounded-full bg-[#d9b66b]" />
              Table Availability
            </div>

            <h1 className="mt-3 font-serif text-3xl tracking-tight text-[#20251f] sm:text-4xl">
              Book a table at {restaurantName}
            </h1>

            <p className="mt-2 text-xs text-[#777d73]">
              Select your dining date, preferred seating time, and party size to see available floor tables.
            </p>
          </div>

          {/* Reservation inputs */}
          <div className="mt-7 grid gap-4 sm:grid-cols-3">
            {/* Date */}
            <label className="block">
              <span className="mb-2 block text-xs font-semibold text-[#4d554b]">
                Reservation date
              </span>

              <input
                type="date"
                value={date}
                min={today}
                onChange={(event) =>
                  handleDateChange(event.target.value)
                }
                className="h-12 w-full rounded-xl border border-[#e0e3da] bg-[#fdfdfb] px-3.5 text-xs font-medium text-[#20251f] outline-none transition focus:border-[#244b38] focus:bg-white focus:ring-2 focus:ring-[#244b38]/10"
              />
            </label>

            {/* Time */}
            <label className="block">
              <span className="mb-2 block text-xs font-semibold text-[#4d554b]">
                Reservation time
              </span>

              <select
                value={time}
                onChange={(event) =>
                  handleTimeChange(event.target.value)
                }
                className="h-12 w-full rounded-xl border border-[#e0e3da] bg-[#fdfdfb] px-3.5 text-xs font-medium text-[#20251f] outline-none transition focus:border-[#244b38] focus:bg-white focus:ring-2 focus:ring-[#244b38]/10"
              >
                {reservationTimes.map((slot) => (
                  <option key={slot.value} value={slot.value}>
                    {slot.label}
                  </option>
                ))}
              </select>
            </label>

            {/* Guests */}
            <label className="block">
              <span className="mb-2 block text-xs font-semibold text-[#4d554b]">
                Number of guests
              </span>

              <select
                value={guests}
                onChange={(event) =>
                  handleGuestsChange(event.target.value)
                }
                className="h-12 w-full rounded-xl border border-[#e0e3da] bg-[#fdfdfb] px-3.5 text-xs font-medium text-[#20251f] outline-none transition focus:border-[#244b38] focus:bg-white focus:ring-2 focus:ring-[#244b38]/10"
              >
                {[1, 2, 3, 4, 5, 6].map((count) => (
                  <option key={count} value={count}>
                    {count} {count === 1 ? "guest" : "guests"}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </section>

        {/* Restaurant floor plan */}
        <RestaurantFloorPlan
          restaurantId={restaurantId}
          guests={guests}
          selectedTableId={selectedTableId}
          onSelect={handleTableSelect}
          unavailableTableIds={unavailableTableIds}
        />

        {isCheckingAvailability && (
          <p className="mt-3 text-center text-xs text-[#777d73]" role="status">
            Checking real-time table availability...
          </p>
        )}

        {availabilityError && (
          <p
            className="mt-3 rounded-xl border border-[#f0d0c8] bg-[#fff5f1] px-4 py-3 text-xs text-[#a33d31]"
            role="alert"
          >
            {availabilityError}
          </p>
        )}

        {/* Reservation summary & CTA */}
        <section className="mt-6 rounded-[24px] border border-[#e5e3da] bg-white p-5 sm:p-7 shadow-[0_12px_40px_rgba(31,49,34,0.04)]">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[1.5px] text-[#85877e]">
                Reservation Summary
              </p>

              <p className="mt-1 font-serif text-xl font-medium text-[#20251f]">
                {restaurantName}
              </p>

              <p className="mt-1 text-xs text-[#777d73]">
                📅 {date || "Select date"} <span className="mx-1.5">·</span> 🕐 {reservationTimes.find(t => t.value === time)?.label || time} <span className="mx-1.5">·</span> 👥 {guests} {guests === 1 ? "guest" : "guests"}
              </p>

              <p className="mt-1 text-xs font-semibold text-[#244b38]">
                {selectedTableId
                  ? `Seating Table: ${selectedTableId}`
                  : "Please choose a table above to proceed"}
              </p>
            </div>

            <button
              type="button"
              onClick={handleContinue}
              disabled={
                !selectedTableId ||
                !date ||
                date < today ||
                !time ||
                isCheckingAvailability ||
                !!availabilityError
              }
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-[#244b38] px-8 py-3 text-xs font-bold text-white shadow-xs transition hover:bg-[#183727] disabled:cursor-not-allowed disabled:bg-[#a8b2a9]"
            >
              <span>Continue to details</span>
              <span aria-hidden="true">→</span>
            </button>
          </div>

          {/* Validation error */}
          {error && (
            <p
              role="alert"
              className="mt-4 rounded-xl border border-[#f0d0c8] bg-[#fff5f1] px-4 py-3 text-xs font-semibold text-[#a33d31]"
            >
              {error}
            </p>
          )}
        </section>

        {/* Availability notice */}
        <p className="mt-6 text-center text-[10px] leading-relaxed text-[#999b92]">
          Table availability is checked against the Tablekeeper reservation
          database. Availability may change before your booking is submitted.
        </p>
      </div>
    </main>
  );
}

export default function AvailabilityPage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-screen items-center justify-center bg-[#f8f7f2]">
          <p className="text-xs text-[#697066]">
            Loading table availability...
          </p>
        </main>
      }
    >
      <AvailabilityContent />
    </Suspense>
  );
}
