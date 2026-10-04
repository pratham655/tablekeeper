"use client";

import { useSearchParams, useRouter } from "next/navigation";

export default function ReservationConfirmedPage() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const restaurant =
    searchParams.get("restaurant") || "Restaurant";

  const date = searchParams.get("date") || "";
  const time = searchParams.get("time") || "";
  const guests = searchParams.get("guests") || "2";
  const table = searchParams.get("table") || "T01";
  const name = searchParams.get("name") || "Guest";

  const confirmationNumber =
    `TK-${Date.now().toString().slice(-8)}`;

  return (
    <main className="min-h-screen bg-[#faf9f7] text-[#1d1d1b]">
      {/* NAVBAR */}
      <header className="border-b border-black/5 bg-white">
        <div className="mx-auto flex h-20 max-w-7xl items-center px-5 sm:px-8 lg:px-10">
          <button
            onClick={() => router.push("/")}
            className="flex items-center gap-3"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#1f3d2b] text-xl text-white">
              T
            </div>

            <div className="text-left">
              <h1 className="text-xl font-bold tracking-tight">
                Tablekeeper
              </h1>

              <p className="hidden text-[10px] font-medium uppercase tracking-[0.22em] text-black/45 sm:block">
                Restaurant Reservations
              </p>
            </div>
          </button>
        </div>
      </header>

      {/* CONFIRMATION */}
      <section className="mx-auto flex min-h-[calc(100vh-80px)] max-w-3xl items-center px-5 py-16 sm:px-8">
        <div className="w-full rounded-[32px] border border-black/5 bg-white p-7 text-center shadow-sm sm:p-12">
          {/* SUCCESS ICON */}
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-[#1f3d2b] text-3xl text-white">
            ✓
          </div>

          <p className="mt-7 text-xs font-bold uppercase tracking-[0.2em] text-[#1f3d2b]/60">
            Reservation confirmed
          </p>

          <h1 className="mt-3 text-4xl font-bold tracking-tight sm:text-5xl">
            You're all set, {name.split(" ")[0]}!
          </h1>

          <p className="mx-auto mt-4 max-w-xl text-sm leading-6 text-black/50">
            Your reservation request has been successfully created
            in the Tablekeeper frontend.
          </p>

          {/* CONFIRMATION NUMBER */}
          <div className="mx-auto mt-7 inline-flex rounded-full bg-[#f1f5f1] px-5 py-3">
            <span className="text-xs font-bold tracking-wider text-[#1f3d2b]">
              CONFIRMATION {confirmationNumber}
            </span>
          </div>

          {/* DETAILS */}
          <div className="mt-10 rounded-3xl bg-[#faf9f7] p-6 text-left sm:p-7">
            <h2 className="text-lg font-bold">
              Reservation details
            </h2>

            <div className="mt-6 grid gap-5 sm:grid-cols-2">
              <div>
                <p className="text-xs text-black/35">
                  Restaurant
                </p>

                <p className="mt-1 text-sm font-bold">
                  {restaurant}
                </p>
              </div>

              <div>
                <p className="text-xs text-black/35">
                  Table
                </p>

                <p className="mt-1 text-sm font-bold">
                  {table}
                </p>
              </div>

              <div>
                <p className="text-xs text-black/35">
                  Date
                </p>

                <p className="mt-1 text-sm font-bold">
                  {date}
                </p>
              </div>

              <div>
                <p className="text-xs text-black/35">
                  Time
                </p>

                <p className="mt-1 text-sm font-bold">
                  {time}
                </p>
              </div>

              <div>
                <p className="text-xs text-black/35">
                  Guests
                </p>

                <p className="mt-1 text-sm font-bold">
                  {guests} guests
                </p>
              </div>

              <div>
                <p className="text-xs text-black/35">
                  Status
                </p>

                <p className="mt-1 text-sm font-bold text-[#1f3d2b]">
                  Confirmed
                </p>
              </div>
            </div>
          </div>

          {/* ACTIONS */}
          <div className="mt-8 grid gap-3 sm:grid-cols-2">
            <button
              onClick={() => router.push("/reservations")}
              className="rounded-2xl bg-[#1f3d2b] py-4 text-sm font-bold text-white transition hover:bg-[#173020]"
            >
              My reservations
            </button>

            <button
              onClick={() => router.push("/")}
              className="rounded-2xl border border-black/10 bg-white py-4 text-sm font-bold text-black/60 transition hover:border-[#1f3d2b] hover:text-[#1f3d2b]"
            >
              Discover restaurants
            </button>
          </div>

          <p className="mt-6 text-[11px] leading-5 text-black/30">
            Frontend stage: reservation data is currently stored
            temporarily. Persistent reservation storage, concurrency
            protection and real database confirmation will be added
            during the backend stage.
          </p>
        </div>
      </section>
    </main>
  );
}