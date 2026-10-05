"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import Navbar from "../../../../components/Navbar";

type Restaurant = {
  id: number;
  name: string;
  cuisine: string;
  location: string;
  price: string;
  image: string;
  rating?: number;
  reviews?: number;
};

const restaurants: Restaurant[] = [
  {
    id: 1,
    name: "The Olive Table",
    cuisine: "Mediterranean",
    location: "Indiranagar, Bengaluru",
    price: "₹₹₹",
    rating: 4.8,
    reviews: 328,
    image:
      "https://images.unsplash.com/photo-1515003197210-e0cd71810b5f?auto=format&fit=crop&w=1600&q=80",
  },
  {
    id: 2,
    name: "Spice Route",
    cuisine: "Indian",
    location: "Koramangala, Bengaluru",
    price: "₹₹",
    rating: 4.7,
    reviews: 512,
    image:
      "https://images.unsplash.com/photo-1585937421612-70a008356fbe?auto=format&fit=crop&w=1600&q=80",
  },
  {
    id: 3,
    name: "Sakura House",
    cuisine: "Japanese",
    location: "MG Road, Bengaluru",
    price: "₹₹₹₹",
    rating: 4.9,
    reviews: 241,
    image:
      "https://images.unsplash.com/photo-1579871494447-9811cf80d66c?auto=format&fit=crop&w=1600&q=80",
  },
  {
    id: 4,
    name: "Casa Verde",
    cuisine: "Italian",
    location: "Whitefield, Bengaluru",
    price: "₹₹₹",
    rating: 4.6,
    reviews: 186,
    image:
      "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=1600&q=80",
  },
  {
    id: 5,
    name: "The Terrace",
    cuisine: "Continental",
    location: "HSR Layout, Bengaluru",
    price: "₹₹₹",
    rating: 4.7,
    reviews: 274,
    image:
      "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1600&q=80",
  },
  {
    id: 6,
    name: "Chai & Co.",
    cuisine: "Indian",
    location: "Jayanagar, Bengaluru",
    price: "₹₹",
    rating: 4.5,
    reviews: 398,
    image:
      "https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=1600&q=80",
  },
  {
    id: 7,
    name: "DRUMA",
    cuisine: "Vegetarian Multi-cuisine",
    location: "Jayanagar, Bengaluru",
    price: "₹₹",
    rating: 4.4,
    reviews: 126,
    image:
      "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1600&q=80",
  },
];

function toDatabaseTime(value: string): string {
  const trimmed = value.trim();
  const match = trimmed.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?\s*(AM|PM)?$/i);

  if (!match) return trimmed;

  let hours = Number(match[1]);
  const minutes = Number(match[2]);
  const seconds = match[3] ?? "00";
  const meridiem = match[4]?.toUpperCase();

  if (minutes > 59 || hours > 23) return trimmed;

  if (meridiem) {
    if (hours < 1 || hours > 12) return trimmed;
    if (meridiem === "AM") {
      hours = hours === 12 ? 0 : hours;
    } else {
      hours = hours === 12 ? 12 : hours + 12;
    }
  }

  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${seconds}`;
}

export default function ReservationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const searchParams = useSearchParams();

  const restaurant = restaurants.find((item) => item.id === Number(id));

  const date = searchParams.get("date") || "";
  const time = searchParams.get("time") || "";
  const guests = searchParams.get("guests") || "2";
  const tableId = searchParams.get("table") || "T1";
  const tableSeats = searchParams.get("seats") || "4";
  const tableName = searchParams.get("tableName") || `Table ${tableId}`;

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [specialRequest, setSpecialRequest] = useState("");
  const [policyAccepted, setPolicyAccepted] = useState(false);
  const [policies, setPolicies] = useState<{
    cancellation_hours: number;
    late_arrival_minutes: number;
    reservation_duration_minutes: number;
    max_party_size: number;
    policy_terms: string;
    policy_version: number;
  } | null>(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!restaurant) return;
    const dbId = restaurantDbIds[restaurant.id];
    if (dbId) {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";
      fetch(`${apiUrl}/restaurants/${dbId}/policies`)
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (data) setPolicies(data);
        })
        .catch(() => {});
    }
  }, [restaurant?.id]);

  if (!restaurant) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f8f7f2] px-6">
        <div className="max-w-md text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#e9efe8] text-2xl font-bold text-[#244b38]">
            ?
          </div>
          <h1 className="mt-6 font-serif text-3xl text-[#20251f]">
            Restaurant not found
          </h1>
          <p className="mt-2 text-xs text-[#777d73]">
            The requested restaurant could not be located in our collection.
          </p>
          <Link
            href="/"
            className="mt-6 inline-flex rounded-full bg-[#244b38] px-6 py-3 text-xs font-bold text-white transition hover:bg-[#183727]"
          >
            Back to discovery
          </Link>
        </div>
      </main>
    );
  }

  const handleConfirmReservation = async () => {
    if (isSubmitting) return;

    setErrorMessage("");

    const trimmedName = name.trim();
    const trimmedEmail = email.trim();
    const trimmedPhone = phone.trim();
    const trimmedRequest = specialRequest.trim();
    const normalizedPhone = trimmedPhone.replace(/[\s().-]/g, "");
    const guestCount = Number(guests);
    const seats = Number(tableSeats);
    const selectedTableDbId = Number(tableId);

    if (
      trimmedName.length < 2 ||
      !/^[\p{L}\p{M}][\p{L}\p{M}\s.'-]*$/u.test(trimmedName)
    ) {
      setErrorMessage("Please enter your valid full name.");
      return;
    }

    if (
      trimmedEmail.length > 254 ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)
    ) {
      setErrorMessage("Please enter a valid email address.");
      return;
    }

    const isIndianMobile = /^[6-9]\d{9}$/.test(normalizedPhone);
    const isInternationalPhone = /^\+[1-9]\d{6,14}$/.test(normalizedPhone);

    if (!isIndianMobile && !isInternationalPhone) {
      setErrorMessage(
        "Please enter a valid 10-digit mobile number or an international number starting with +."
      );
      return;
    }

    if (!date || !time) {
      setErrorMessage(
        "Reservation date and time are missing. Please return to table selection."
      );
      return;
    }

    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      setErrorMessage("The reservation date is invalid. Please select a date again.");
      return;
    }

    if (
      !Number.isInteger(guestCount) ||
      guestCount < 1 ||
      guestCount > 20
    ) {
      setErrorMessage("Guest count must be between 1 and 20.");
      return;
    }

    if (
      !Number.isInteger(seats) ||
      seats < guestCount ||
      seats > 20
    ) {
      setErrorMessage("The selected table does not have enough seats.");
      return;
    }

    if (
      !Number.isSafeInteger(selectedTableDbId) ||
      selectedTableDbId <= 0
    ) {
      setErrorMessage(
        "The selected table ID is invalid. Please return to table selection and choose a table again."
      );
      return;
    }

    if (!policyAccepted) {
      setErrorMessage(
        "Please review and accept the restaurant's booking and cancellation policies before confirming."
      );
      return;
    }

    if (trimmedRequest.length > 500) {
      setErrorMessage("Special requests must be 500 characters or fewer.");
      return;
    }

    const databaseTime = toDatabaseTime(time);

    if (!/^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/.test(databaseTime)) {
      setErrorMessage(
        "The selected time format is invalid. Please return and select a time again."
      );
      return;
    }

    setIsSubmitting(true);

    try {
      const token = localStorage.getItem("tablekeeper_access_token");

      if (!token) {
        router.push("/login");
        return;
      }

      // Frontend restaurant IDs mapped to the fresh production database IDs.
      const restaurantDbId = restaurant.id;

      if (!restaurantDbId) {
        throw new Error("Restaurant mapping was not found.");
      }

      // Interpret selected date/time in Bengaluru's UTC+05:30 timezone.
      const [hour, minute] = databaseTime.split(":").map(Number);

      const start = new Date(
        `${date}T${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}:00+05:30`
      );

      if (Number.isNaN(start.getTime())) {
        throw new Error("The selected reservation date or time is invalid.");
      }

      const durationMins = policies?.reservation_duration_minutes || 90;
      const end = new Date(start.getTime() + durationMins * 60 * 1000);

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000"}/reservations/`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            restaurant_id: restaurantDbId,
            selected_table_id: selectedTableDbId,
            guest_count: guestCount,
            start_time: start.toISOString(),
            end_time: end.toISOString(),
            customer_name: trimmedName,
            customer_email: trimmedEmail,
            customer_phone: normalizedPhone,
            special_request: trimmedRequest || undefined,
            policy_version_accepted: policies?.policy_version ?? 1,
            accepted_policy_terms: policies?.policy_terms ?? "Standard restaurant booking policies applied.",
          }),
        }
      );

      const result = await response.json().catch(() => ({}));

      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          localStorage.removeItem("tablekeeper_access_token");
          localStorage.removeItem("tablekeeper_user");
          router.push("/login");
          return;
        }

        throw new Error(
          typeof result.detail === "string"
            ? result.detail
            : "We couldn't complete your reservation. Please try again."
        );
      }

      // Save actual backend response data.
      const savedReservation = {
        id: String(result.id),
        reservationId: String(result.id),
        bookingReference: result.booking_reference,
        restaurantId: restaurant.id,
        restaurantDbId,
        restaurantName: restaurant.name,
        name: restaurant.name,
        date,
        time,
        guests: guestCount,
        partySize: guestCount,
        tableId: String(result.table_id),
        table: String(result.table_id),
        tableSeats: seats,
        customerName: trimmedName,
        email: trimmedEmail,
        phone: normalizedPhone,
        specialRequest: trimmedRequest,
        status: result.status,
        createdAt: result.created_at,
        policyVersionAccepted: policies?.policy_version,
      };

      try {
        const existingRaw = sessionStorage.getItem("pendingReservation");
        let reservationsList: typeof savedReservation[] = [];

        if (existingRaw) {
          const parsed: unknown = JSON.parse(existingRaw);

          if (Array.isArray(parsed)) {
            reservationsList = parsed;
          } else if (parsed && typeof parsed === "object") {
            reservationsList = [parsed as typeof savedReservation];
          }
        }

        reservationsList = reservationsList.filter(
          (item) => item && item.id !== savedReservation.id
        );

        reservationsList.unshift(savedReservation);

        sessionStorage.setItem(
          "pendingReservation",
          JSON.stringify(reservationsList)
        );

        sessionStorage.setItem(
          "tablekeeper_pending_reservation",
          JSON.stringify(savedReservation)
        );
      } catch (storageError) {
        console.error("Could not update session storage:", storageError);
      }

      router.push(
        `/reservation-confirmed?restaurant=${encodeURIComponent(
          restaurant.name
        )}&date=${encodeURIComponent(date)}&time=${encodeURIComponent(
          time
        )}&guests=${encodeURIComponent(
          String(guestCount)
        )}&table=${encodeURIComponent(
          String(result.table_id)
        )}&name=${encodeURIComponent(
          trimmedName
        )}&reference=${encodeURIComponent(
          result.booking_reference || String(result.id)
        )}&status=${encodeURIComponent(result.status)}`
      );
    } catch (error) {
      console.error("Reservation submission failed:", error);

      setErrorMessage(
        error instanceof Error
          ? error.message
          : "We couldn't complete your reservation. Please try again."
      );

      setIsSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#f8f7f2] text-[#20251f]">
      {/* NAVBAR */}
      <Navbar />

      <div className="container-shell pb-20 pt-8 sm:pt-10">
        {/* Breadcrumb */}
        <nav
          aria-label="Breadcrumb"
          className="mb-6 flex flex-wrap items-center gap-2 text-xs text-[#85877e]"
        >
          <Link href="/" className="transition hover:text-[#244b38]">
            Discover
          </Link>
          <span>/</span>
          <Link
            href={`/restaurants/${restaurant.id}`}
            className="transition hover:text-[#244b38]"
          >
            {restaurant.name}
          </Link>
          <span>/</span>
          <Link
            href={`/restaurants/${restaurant.id}/availability?date=${encodeURIComponent(
              date
            )}&time=${encodeURIComponent(time)}&guests=${encodeURIComponent(
              guests
            )}&table=${encodeURIComponent(tableId)}&seats=${encodeURIComponent(
              tableSeats
            )}`}
            className="transition hover:text-[#244b38]"
          >
            Availability
          </Link>
          <span>/</span>
          <span className="font-semibold text-[#20251f]">
            Reservation details
          </span>
        </nav>

        {/* Step indicator */}
        <div className="mb-6 flex items-center gap-3">
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#e9eee6] text-xs font-bold text-[#244b38]">
            ✓
          </span>
          <span className="text-xs font-medium text-[#8c9185]">
            Step 1: Table &amp; Time
          </span>
          <div className="h-px flex-1 bg-[#e5e3da]" />
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#244b38] text-xs font-bold text-white">
            2
          </span>
          <span className="text-xs font-bold uppercase tracking-wider text-[#244b38]">
            Step 2: Guest Details &amp; Policies
          </span>
        </div>

        {/* Form and Summary */}
        <div className="grid gap-8 lg:grid-cols-[1fr_380px] lg:gap-10">
          {/* Guest Form */}
          <div>
            <div className="rounded-[26px] border border-[#e5e3da] bg-white p-6 shadow-[0_12px_40px_rgba(31,49,34,0.05)] sm:p-8">
              <div className="inline-flex items-center gap-2 rounded-full border border-[#d9b66b]/40 bg-[#fbf8f0] px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-[#8c6b32]">
                <span className="h-1.5 w-1.5 rounded-full bg-[#d9b66b]" />
                Guest Information
              </div>

              <h1 className="mt-3 font-serif text-3xl tracking-tight text-[#20251f] sm:text-4xl">
                Complete your reservation
              </h1>

              <p className="mt-2 text-xs leading-relaxed text-[#777d73]">
                Please provide your contact details to complete this booking
                request at{" "}
                <span className="font-semibold text-[#244b38]">
                  {restaurant.name}
                </span>.
              </p>

              {/* Full Name */}
              <div className="mt-7">
                <label
                  htmlFor="name"
                  className="block text-xs font-semibold text-[#454c41]"
                >
                  Full name <span className="text-[#a33d31]">*</span>
                </label>
                <input
                  id="name"
                  type="text"
                  required
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    setErrorMessage("");
                  }}
                  placeholder="Enter your first and last name"
                  maxLength={100}
                  autoComplete="name"
                  className="mt-2 h-12 w-full rounded-xl border border-[#e0e3da] bg-[#fdfdfb] px-4 text-xs font-medium text-[#20251f] outline-none transition focus:border-[#244b38] focus:bg-white focus:ring-2 focus:ring-[#244b38]/10"
                />
              </div>

              {/* Email */}
              <div className="mt-5">
                <label
                  htmlFor="email"
                  className="block text-xs font-semibold text-[#454c41]"
                >
                  Email address <span className="text-[#a33d31]">*</span>
                </label>
                <input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setErrorMessage("");
                  }}
                  placeholder="you@example.com"
                  maxLength={254}
                  autoComplete="email"
                  className="mt-2 h-12 w-full rounded-xl border border-[#e0e3da] bg-[#fdfdfb] px-4 text-xs font-medium text-[#20251f] outline-none transition focus:border-[#244b38] focus:bg-white focus:ring-2 focus:ring-[#244b38]/10"
                />
                <p className="mt-1 text-[10px] text-[#8c9186]">
                  Your confirmation ticket will reference this email.
                </p>
              </div>

              {/* Phone */}
              <div className="mt-5">
                <label
                  htmlFor="phone"
                  className="block text-xs font-semibold text-[#454c41]"
                >
                  Mobile phone number{" "}
                  <span className="text-[#a33d31]">*</span>
                </label>
                <input
                  id="phone"
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => {
                    setPhone(e.target.value);
                    setErrorMessage("");
                  }}
                  placeholder="9876543210 or +91 98765 43210"
                  maxLength={25}
                  autoComplete="tel"
                  className="mt-2 h-12 w-full rounded-xl border border-[#e0e3da] bg-[#fdfdfb] px-4 text-xs font-medium text-[#20251f] outline-none transition focus:border-[#244b38] focus:bg-white focus:ring-2 focus:ring-[#244b38]/10"
                />
              </div>

              {/* Special Request */}
              <div className="mt-5">
                <div className="flex items-center justify-between">
                  <label
                    htmlFor="request"
                    className="block text-xs font-semibold text-[#454c41]"
                  >
                    Special requests
                  </label>
                  <span className="text-[10px] text-[#8c9186]">
                    Optional ({specialRequest.length}/500)
                  </span>
                </div>
                <textarea
                  id="request"
                  value={specialRequest}
                  onChange={(e) => setSpecialRequest(e.target.value)}
                  placeholder="Celebrations, dietary preferences, or seating notes..."
                  maxLength={500}
                  rows={3}
                  className="mt-2 w-full resize-y rounded-xl border border-[#e0e3da] bg-[#fdfdfb] p-3.5 text-xs font-medium text-[#20251f] outline-none transition focus:border-[#244b38] focus:bg-white focus:ring-2 focus:ring-[#244b38]/10"
                />
              </div>

              {/* RESTAURANT POLICY ACCEPTANCE CARD */}
              <div className="mt-6 rounded-2xl border border-[#e0e6db] bg-[#f8faf6] p-5">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-[#244b38]">
                    Restaurant Booking Policies {policies ? `(v${policies.policy_version})` : ""}
                  </h3>
                  <span className="rounded-full bg-[#e9eee6] px-2.5 py-0.5 text-[10px] font-semibold text-[#244b38]">
                    Mandatory
                  </span>
                </div>

                <div className="mt-3 space-y-2 text-xs text-[#555d52]">
                  <div className="flex items-center gap-2">
                    <span className="text-[#244b38] font-bold">✓</span>
                    <span><strong>Cancellation:</strong> Free cancellation up to {policies?.cancellation_hours || 2} hours before your booking time.</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[#244b38] font-bold">✓</span>
                    <span><strong>Table Holding:</strong> Tables are held for {policies?.late_arrival_minutes || 15} minutes past booking time before release.</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[#244b38] font-bold">✓</span>
                    <span><strong>Reservation Duration:</strong> Dining window is allocated for {policies?.reservation_duration_minutes || 90} minutes.</span>
                  </div>
                </div>

                {policies?.policy_terms && (
                  <p className="mt-3 border-t border-[#e2e7dc] pt-2 text-[11px] italic text-[#697066]">
                    "{policies.policy_terms}"
                  </p>
                )}

                <label className="mt-4 flex items-start gap-3 cursor-pointer rounded-xl border border-[#d2dcd0] bg-white p-3.5 transition hover:border-[#244b38]">
                  <input
                    type="checkbox"
                    checked={policyAccepted}
                    onChange={(e) => {
                      setPolicyAccepted(e.target.checked);
                      setErrorMessage("");
                    }}
                    className="mt-0.5 h-4 w-4 rounded border-[#ccd3c8] text-[#244b38] focus:ring-[#244b38]"
                  />
                  <span className="text-xs font-medium text-[#20251f]">
                    I have read, understood, and accept {restaurant.name}'s dining policies and terms.
                  </span>
                </label>
              </div>

              {/* Error */}
              {errorMessage && (
                <div
                  role="alert"
                  className="mt-6 rounded-xl border border-[#f0d0c8] bg-[#fff5f1] p-4 text-xs font-medium text-[#a33d31]"
                >
                  {errorMessage}
                </div>
              )}

              {/* Submit */}
              <button
                type="button"
                onClick={handleConfirmReservation}
                disabled={isSubmitting || !policyAccepted}
                className="mt-7 flex min-h-12 w-full items-center justify-center gap-2 rounded-full bg-[#244b38] px-6 text-xs font-bold text-white shadow-xs transition hover:bg-[#183727] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isSubmitting
                  ? "Processing booking..."
                  : "Confirm table reservation →"}
              </button>

              <p className="mt-3 text-center text-[10px] text-[#8c9186]">
                Your booking and policy acceptance will be recorded in Tablekeeper.
              </p>
            </div>
          </div>

          {/* Reservation Summary */}
          <aside className="h-fit rounded-[26px] border border-[#e5e3da] bg-white p-5 shadow-[0_12px_40px_rgba(31,49,34,0.05)] sm:p-6 lg:sticky lg:top-24">
            <div className="relative mb-4 h-44 w-full overflow-hidden rounded-2xl bg-[#eef0e8]">
              <img
                src={restaurant.image}
                alt={restaurant.name}
                className="h-full w-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
              <div className="absolute bottom-3 left-3 right-3 text-white">
                <p className="font-serif text-lg font-medium leading-tight">
                  {restaurant.name}
                </p>
                <p className="text-[10px] text-white/80">
                  {restaurant.cuisine} · {restaurant.location.split(",")[0]}
                </p>
              </div>
            </div>

            <p className="text-[10px] font-bold uppercase tracking-[1.6px] text-[#85877e]">
              Booking Summary
            </p>

            <div className="mt-4 space-y-3.5 border-t border-[#f0efe8] pt-4 text-xs">
              <div className="flex items-center justify-between gap-3">
                <span className="text-[#777d73]">Date</span>
                <span className="text-right font-semibold text-[#20251f]">
                  {date || "Not set"}
                </span>
              </div>

              <div className="flex items-center justify-between gap-3">
                <span className="text-[#777d73]">Time</span>
                <span className="text-right font-semibold text-[#20251f]">
                  {time || "Not set"}
                </span>
              </div>

              <div className="flex items-center justify-between gap-3">
                <span className="text-[#777d73]">Party size</span>
                <span className="font-semibold text-[#20251f]">
                  {guests} {guests === "1" ? "guest" : "guests"}
                </span>
              </div>

              <div className="flex items-center justify-between gap-3">
                <span className="text-[#777d73]">Selected table</span>
                <span className="rounded-md bg-[#fbf6ea] px-2 py-0.5 font-bold text-[#8c6b32]">
                  {tableName} (Seats {tableSeats})
                </span>
              </div>
            </div>

            <div className="mt-6 rounded-xl border border-[#e5e8e0] bg-[#f8faf6] p-3.5 text-center">
              <p className="text-[11px] font-semibold text-[#244b38]">
                Reservation Confirmation
              </p>
              <p className="mt-1 text-[10px] leading-relaxed text-[#777d73]">
                Your booking reference will be generated when your reservation
                is saved.
              </p>
            </div>
          </aside>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-[#e9e7df] bg-[#efeee6]">
        <div className="container-shell flex flex-col gap-4 py-7 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-[#777d73]">
            © 2026 Tablekeeper. A table worth keeping.
          </p>
          <div className="flex gap-5 text-xs text-[#777d73]">
            <Link href="/" className="hover:text-[#244b38]">
              Discover
            </Link>
            <Link href="/reservations" className="hover:text-[#244b38]">
              My reservations
            </Link>
          </div>
        </div>
      </footer>
    </main>
  );
}
