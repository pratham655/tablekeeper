
"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

type BackendReservation = {
  id: number;
  booking_reference: string;
  user_id: number;
  restaurant_id: number;
  table_id: number;
  guest_count: number;
  start_time: string;
  end_time: string;
  status: "pending" | "confirmed" | "cancelled" | string;
  created_at: string;
  updated_at: string;
};

type Reservation = {
  id: number;
  bookingReference: string;
  restaurantId: number;
  restaurantName: string;
  tableId: number;
  guests: number;
  startTime: string;
  endTime: string;
  status: string;
};

const RESTAURANTS: Record<number, string> = {
  12: "The Olive Table",
  13: "Spice Route",
  14: "Sakura House",
  17: "Casa Verde",
  18: "The Terrace",
  19: "Chai & Co.",
  20: "DRUMA",
};

function formatDate(dateString: string) {
  const date = new Date(dateString);

  if (Number.isNaN(date.getTime())) {
    return "Date not available";
  }

  return new Intl.DateTimeFormat("en-IN", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "Asia/Kolkata",
  }).format(date);
}

function formatTime(dateString: string) {
  const date = new Date(dateString);

  if (Number.isNaN(date.getTime())) {
    return "Time not available";
  }

  return new Intl.DateTimeFormat("en-IN", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    timeZone: "Asia/Kolkata",
  }).format(date);
}

function formatStatus(status: string) {
  return status.charAt(0).toUpperCase() + status.slice(1);
}

export default function ReservationsPage() {
  const router = useRouter();

  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState("");
  const [cancellingId, setCancellingId] = useState<number | null>(null);

  const loadReservations = useCallback(async () => {
    const token = localStorage.getItem("tablekeeper_access_token");

    if (!token) {
      router.replace("/login");
      return;
    }

    setIsLoaded(false);
    setError("");

    try {
      const response = await fetch(`${API_URL}/reservations/me`, {
        method: "GET",
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
        },
        cache: "no-store",
      });

      if (response.status === 401 || response.status === 403) {
        localStorage.removeItem("tablekeeper_access_token");
        localStorage.removeItem("tablekeeper_user");
        router.replace("/login");
        return;
      }

      if (!response.ok) {
        throw new Error("Unable to load your reservations. Please try again.");
      }

      const data: BackendReservation[] = await response.json();

      const mapped: Reservation[] = data.map((item) => ({
        id: item.id,
        bookingReference: item.booking_reference,
        restaurantId: item.restaurant_id,
        restaurantName:
          RESTAURANTS[item.restaurant_id] || "Tablekeeper Restaurant",
        tableId: item.table_id,
        guests: item.guest_count,
        startTime: item.start_time,
        endTime: item.end_time,
        status: item.status,
      }));

      setReservations(mapped);
    } catch (err) {
      console.error("Failed to load reservations:", err);
      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong while loading reservations."
      );
    } finally {
      setIsLoaded(true);
    }
  }, [router]);

  useEffect(() => {
    void loadReservations();
  }, [loadReservations]);

  const cancelReservation = async (reservationId: number) => {
    const token = localStorage.getItem("tablekeeper_access_token");

    if (!token) {
      router.push("/login");
      return;
    }

    const confirmed = window.confirm(
      "Are you sure you want to cancel this reservation?"
    );

    if (!confirmed) return;

    setCancellingId(reservationId);
    setError("");

    try {
      const response = await fetch(
        `${API_URL}/reservations/${reservationId}/cancel`,
        {
          method: "POST",
          headers: {
            Accept: "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json().catch(() => ({}));

      if (response.status === 401 || response.status === 403) {
        localStorage.removeItem("tablekeeper_access_token");
        localStorage.removeItem("tablekeeper_user");
        router.replace("/login");
        return;
      }

      if (!response.ok) {
        throw new Error(
          typeof data.detail === "string"
            ? data.detail
            : "Unable to cancel this reservation."
        );
      }

      // Reload from the backend so the displayed status is authoritative.
      await loadReservations();
    } catch (err) {
      console.error("Failed to cancel reservation:", err);
      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong while cancelling."
      );
    } finally {
      setCancellingId(null);
    }
  };

  return (
    <main className="min-h-screen bg-[#f8f7f2] text-[#20251f]">
      <header className="sticky top-0 z-40 border-b border-[#e9e7df] bg-[#f8f7f2]/95 backdrop-blur-xl">
        <div className="container-shell flex h-[76px] items-center justify-between">
          <Link
            href="/"
            className="flex items-center gap-3"
            aria-label="Tablekeeper home"
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#244b38] text-xl font-semibold text-white shadow-xs">
              t.
            </span>

            <span>
              <span className="block text-[19px] font-semibold leading-5 tracking-[-0.7px]">
                tablekeeper
              </span>
              <span className="mt-1 hidden text-[9px] font-semibold uppercase tracking-[2px] text-[#85877d] sm:block">
                A table worth keeping
              </span>
            </span>
          </Link>

          <nav className="flex items-center gap-4 sm:gap-7">
            <Link
              href="/"
              className="text-xs font-semibold text-[#5a6258] transition hover:text-[#244b38]"
            >
              Discover
            </Link>
            <Link
              href="/"
              className="rounded-full border border-[#d9ddd4] bg-white px-5 py-2.5 text-xs font-semibold text-[#20251f] transition hover:border-[#244b38] hover:bg-[#244b38] hover:text-white"
            >
              Explore restaurants ↗
            </Link>
          </nav>
        </div>
      </header>

      <section className="container-shell pb-20 pt-10 sm:pb-24 sm:pt-14">
        <div className="mx-auto max-w-4xl">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-[#d9b66b]/40 bg-[#fbf8f0] px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-[#8c6b32]">
                <span className="h-1.5 w-1.5 rounded-full bg-[#d9b66b]" />
                Your Dining Schedule
              </div>

              <h1 className="mt-3 font-serif text-3xl tracking-tight text-[#20251f] sm:text-4xl">
                My reservations
              </h1>

              <p className="mt-1.5 text-xs text-[#777d73]">
                Keep track of your upcoming dining bookings and reserved tables.
              </p>
            </div>

            <span className="rounded-full bg-[#e9eee6] px-4 py-1.5 text-xs font-bold text-[#244b38]">
              {reservations.length}{" "}
              {reservations.length === 1 ? "reservation" : "reservations"}
            </span>
          </div>

          {error && (
            <div
              role="alert"
              className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700"
            >
              <span>{error}</span>
              <button
                type="button"
                onClick={() => void loadReservations()}
                className="font-bold underline"
              >
                Try again
              </button>
            </div>
          )}

          {!isLoaded ? (
            <div className="mt-10 rounded-[26px] border border-[#e8e5db] bg-white p-12 text-center text-xs font-medium text-[#777d73]">
              Loading your dining reservations...
            </div>
          ) : reservations.length === 0 ? (
            <div className="mt-10 rounded-[28px] border border-[#e8e5db] bg-white px-6 py-16 text-center shadow-[0_12px_40px_rgba(31,49,34,0.04)] sm:px-12">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#e9eee6] text-2xl text-[#244b38]">
                🍽️
              </div>

              <h2 className="mt-5 font-serif text-2xl text-[#20251f] sm:text-3xl">
                No reservations yet
              </h2>

              <p className="mx-auto mt-2 max-w-sm text-xs leading-relaxed text-[#777d73]">
                Your reservations will appear here once you book a table at a
                Tablekeeper restaurant.
              </p>

              <Link
                href="/"
                className="mt-7 inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-[#244b38] px-7 text-xs font-bold text-white shadow-xs transition hover:bg-[#183727]"
              >
                <span>Discover restaurants</span>
                <span aria-hidden="true">↗</span>
              </Link>
            </div>
          ) : (
            <div className="mt-8 space-y-5">
              {reservations.map((reservation) => {
                const isCancelled = reservation.status.toLowerCase() === "cancelled";
                const isPending = reservation.status.toLowerCase() === "pending";
                const isCancelling = cancellingId === reservation.id;

                return (
                  <article
                    key={reservation.id}
                    className="overflow-hidden rounded-[26px] border border-[#e5e8e0] bg-white shadow-[0_12px_40px_rgba(31,49,34,0.04)] transition duration-200 hover:shadow-[0_16px_45px_rgba(31,49,34,0.07)]"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#eeece5] bg-[#fafaf7] px-6 py-3.5 sm:px-8">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-[#85877e]">
                          Booking Ref:
                        </span>
                        <span className="text-xs font-bold tracking-wider text-[#244b38]">
                          {reservation.bookingReference || reservation.id}
                        </span>
                      </div>

                      <span
                        className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-wider ${
                          isCancelled
                            ? "bg-red-50 text-red-700"
                            : isPending
                              ? "bg-[#e9eee6] text-[#244b38]"
                              : "bg-[#e9eee6] text-[#244b38]"
                        }`}
                      >
                        <span
                          className={`h-1.5 w-1.5 rounded-full ${
                            isCancelled ? "bg-red-600" : "bg-[#244b38]"
                          }`}
                        />
                        {formatStatus(reservation.status)}
                      </span>
                    </div>

                    <div className="p-6 sm:p-8">
                      <h2 className="font-serif text-2xl font-medium tracking-tight text-[#20251f] sm:text-3xl">
                        {reservation.restaurantName}
                      </h2>

                      <div className="mt-4 grid grid-cols-2 gap-4 text-xs sm:grid-cols-4 sm:gap-6">
                        <div>
                          <p className="text-[10px] font-bold uppercase tracking-wider text-[#8c9186]">
                            Date
                          </p>
                          <p className="mt-1 font-semibold text-[#20251f]">
                            {formatDate(reservation.startTime)}
                          </p>
                        </div>

                        <div>
                          <p className="text-[10px] font-bold uppercase tracking-wider text-[#8c9186]">
                            Time
                          </p>
                          <p className="mt-1 font-semibold text-[#20251f]">
                            {formatTime(reservation.startTime)}
                          </p>
                        </div>

                        <div>
                          <p className="text-[10px] font-bold uppercase tracking-wider text-[#8c9186]">
                            Party Size
                          </p>
                          <p className="mt-1 font-semibold text-[#20251f]">
                            {reservation.guests}{" "}
                            {reservation.guests === 1 ? "guest" : "guests"}
                          </p>
                        </div>

                        <div>
                          <p className="text-[10px] font-bold uppercase tracking-wider text-[#8c9186]">
                            Seating Table ID
                          </p>
                          <p className="mt-1 font-bold text-[#8c6b32]">
                            #{reservation.tableId}
                          </p>
                        </div>
                      </div>

                      <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-[#eeece5] pt-5">
                        <Link
                          href={`/restaurants/${reservation.restaurantId}`}
                          className="inline-flex items-center gap-1 text-xs font-bold text-[#244b38] hover:text-[#183727] hover:underline"
                        >
                          <span>View restaurant menu &amp; details</span>
                          <span aria-hidden="true">↗</span>
                        </Link>

                        {!isCancelled && (
                          <button
                            type="button"
                            disabled={isCancelling}
                            onClick={() => void cancelReservation(reservation.id)}
                            className="rounded-full border border-[#f0d0c8] bg-white px-4 py-2 text-xs font-semibold text-[#a33d31] transition hover:bg-[#fff5f1] disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            {isCancelling
                              ? "Cancelling..."
                              : "Cancel reservation"}
                          </button>
                        )}
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}

          <p className="mt-8 text-center text-[10px] leading-relaxed text-[#999b92]">
            Your reservations are retrieved from your Tablekeeper account.
          </p>
        </div>
      </section>

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
