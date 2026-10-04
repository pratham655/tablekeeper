"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import Navbar from "../../components/Navbar";

function ReservationConfirmedContent() {
  const searchParams = useSearchParams();

  const restaurant =
    searchParams.get("restaurant") || "Restaurant";

  const date = searchParams.get("date") || "";
  const time = searchParams.get("time") || "";
  const guests = searchParams.get("guests") || "2";
  const table = searchParams.get("table") || "T1";
  const name = searchParams.get("name") || "Guest";
  const reference = searchParams.get("reference") || "";
  const status = searchParams.get("status") || "confirmed";

  const [bookingRef, setBookingRef] = useState(reference);

  useEffect(() => {
    if (reference) {
      setBookingRef(reference);
    } else {
      // Check session storage fallback
      try {
        const raw = sessionStorage.getItem("tablekeeper_pending_reservation");
        if (raw) {
          const parsed = JSON.parse(raw);
          if (parsed.bookingReference) {
            setBookingRef(parsed.bookingReference);
          }
        }
      } catch {}
    }
  }, [reference]);

  function formatDate(rawDate?: string) {
    if (!rawDate) return "Date not specified";
    const parsed = new Date(`${rawDate}T00:00:00`);
    if (Number.isNaN(parsed.getTime())) return rawDate;
    return parsed.toLocaleDateString("en-IN", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  }

  return (
    <main className="min-h-screen bg-[#f8f7f2] text-[#20251f]">
      {/* NAVBAR */}
      <Navbar />

      {/* CONFIRMATION TICKET SECTION */}
      <section className="container-shell py-12 sm:py-16">
        <div className="mx-auto max-w-2xl overflow-hidden rounded-[28px] border border-[#e5e3da] bg-white p-7 text-center shadow-[0_16px_50px_rgba(31,49,34,0.06)] sm:p-12">
          {/* SUCCESS BADGE */}
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#e9eee6] text-2xl font-bold text-[#244b38] shadow-xs">
            ✓
          </div>

          <div className="mt-6 inline-flex items-center gap-2 rounded-full border border-[#d9b66b]/40 bg-[#fbf8f0] px-3.5 py-1 text-[10px] font-bold uppercase tracking-wider text-[#8c6b32]">
            <span className="h-1.5 w-1.5 rounded-full bg-[#d9b66b]" />
            Reservation Confirmed
          </div>

          <h1 className="mt-3 font-serif text-3xl tracking-tight text-[#20251f] sm:text-4xl">
            You're all set, {name.split(" ")[0]}!
          </h1>

          <p className="mx-auto mt-2 max-w-lg text-xs leading-relaxed text-[#777d73] sm:text-sm">
            We have confirmed your table reservation at{" "}
            <span className="font-semibold text-[#244b38]">{restaurant}</span>. Your official booking reference is ready below.
          </p>

          {/* REFERENCE BADGE */}
          <div className="mx-auto mt-6 inline-flex items-center gap-2 rounded-full border border-[#e5e7dc] bg-[#f8faf6] px-5 py-2.5 shadow-xs">
            <span className="text-[10px] font-bold uppercase tracking-widest text-[#777d73]">
              Booking Ref:
            </span>
            <span className="text-xs font-bold tracking-wider text-[#244b38]">
              {bookingRef || "CONFIRMED"}
            </span>
          </div>

          {/* BOOKING DETAILS TICKET */}
          <div className="mt-8 rounded-2xl border border-[#e8ebe3] bg-[#fdfdfb] p-5 text-left sm:p-7">
            <h2 className="text-xs font-bold uppercase tracking-wider text-[#85877e]">
              Dining Details
            </h2>

            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-[#8c9186]">
                  Restaurant
                </p>
                <p className="mt-0.5 font-serif text-base font-semibold text-[#20251f]">
                  {restaurant}
                </p>
              </div>

              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-[#8c9186]">
                  Reserved Table
                </p>
                <p className="mt-0.5 text-xs font-bold text-[#8c6b32]">
                  Table #{table}
                </p>
              </div>

              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-[#8c9186]">
                  Date
                </p>
                <p className="mt-0.5 text-xs font-medium text-[#20251f]">
                  {formatDate(date)}
                </p>
              </div>

              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-[#8c9186]">
                  Time
                </p>
                <p className="mt-0.5 text-xs font-medium text-[#20251f]">
                  {time || "Not specified"}
                </p>
              </div>

              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-[#8c9186]">
                  Party Size
                </p>
                <p className="mt-0.5 text-xs font-medium text-[#20251f]">
                  {guests} {guests === "1" ? "guest" : "guests"}
                </p>
              </div>

              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-[#8c9186]">
                  Status
                </p>
                <p className="mt-0.5 inline-flex items-center gap-1.5 text-xs font-bold text-[#244b38]">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#244b38]" />
                  {status.charAt(0).toUpperCase() + status.slice(1)}
                </p>
              </div>
            </div>
          </div>

          {/* ACTION BUTTONS */}
          <div className="mt-8 grid gap-3 sm:grid-cols-2">
            <Link
              href="/reservations"
              className="inline-flex min-h-12 items-center justify-center rounded-full bg-[#244b38] px-6 text-xs font-bold text-white shadow-xs transition hover:bg-[#183727]"
            >
              View in My Reservations
            </Link>

            <Link
              href="/"
              className="inline-flex min-h-12 items-center justify-center rounded-full border border-[#d9ddd4] bg-white px-6 text-xs font-bold text-[#20251f] transition hover:border-[#244b38] hover:text-[#244b38]"
            >
              Discover more restaurants ↗
            </Link>
          </div>

          {/* NOTICE */}
          <p className="mx-auto mt-6 max-w-md text-center text-[10px] leading-relaxed text-[#92958c]">
            This booking is registered in the Tablekeeper database. A confirmation email has been dispatched.
          </p>
        </div>
      </section>

      {/* FOOTER */}
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

export default function ReservationConfirmedPage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-screen items-center justify-center bg-[#f8f7f2]">
          <p className="text-xs text-[#777d73]">
            Loading confirmation details...
          </p>
        </main>
      }
    >
      <ReservationConfirmedContent />
    </Suspense>
  );
}