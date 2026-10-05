
"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

type ApiTable = {
  id: number;
  restaurant_id: number;
  table_number: string;
  capacity: number;
  is_active: boolean;
};

export type RestaurantTable = {
  id: string;
  name: string;
  capacity: number;
  section: string;
  unavailable?: boolean;
};

type Props = {
  restaurantId: string | number;
  guests: number;
  selectedTableId: string;
  onSelect: (table: RestaurantTable) => void;
  unavailableTableIds?: string[];
};

// Frontend restaurant IDs mapped to actual PostgreSQL IDs.
const RESTAURANT_DB_IDS: Record<string, number> = {
  "1": 1, // The Olive Table
  "2": 2, // Spice Route
  "3": 3, // Sakura House
  "4": 4, // Casa Verde
  "5": 5, // The Terrace
  "6": 6, // Chai & Co.
  "7": 7, // DRUMA
};

const VALID_DB_IDS = new Set([1, 2, 3, 4, 5, 6, 7]);

const API_URL = (
  process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000"
).replace(/\/+$/, "");

const SECTIONS = ["A", "B", "C", "Other"];

const EMPTY_TABLE: RestaurantTable = {
  id: "",
  name: "",
  capacity: 0,
  section: "",
};

function getBackendRestaurantId(id: string | number): number {
  const key = String(id);

  if (RESTAURANT_DB_IDS[key] !== undefined) {
    return RESTAURANT_DB_IDS[key];
  }

  const numericId = Number(id);

  if (VALID_DB_IDS.has(numericId)) {
    return numericId;
  }

  throw new Error(
    `Restaurant ID "${id}" is not mapped to a database restaurant.`
  );
}

function getSection(tableNumber: string): string {
  const number = Number(tableNumber.match(/\d+/)?.[0] ?? 0);

  if (number >= 1 && number <= 3) return "A";
  if (number >= 4 && number <= 6) return "B";
  if (number >= 7 && number <= 9) return "C";

  return "Other";
}

function getTableNumber(tableNumber: string): number {
  return Number(tableNumber.match(/\d+/)?.[0] ?? 0);
}

export default function RestaurantFloorPlan({
  restaurantId,
  guests,
  selectedTableId,
  onSelect,
  unavailableTableIds = [],
}: Props) {
  const [tables, setTables] = useState<RestaurantTable[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [retryCount, setRetryCount] = useState(0);

  const backendRestaurantId = useMemo(
    () => getBackendRestaurantId(restaurantId),
    [restaurantId]
  );

  const loadTables = useCallback(
    async (signal: AbortSignal) => {
      setLoading(true);
      setError("");

      try {
        const response = await fetch(
          `${API_URL}/tables/restaurant/${backendRestaurantId}`,
          {
            method: "GET",
            cache: "no-store",
            signal,
            headers: {
              Accept: "application/json",
            },
          }
        );

        if (!response.ok) {
          throw new Error(
            `Unable to load tables (HTTP ${response.status}).`
          );
        }

        const data: unknown = await response.json();

        if (!Array.isArray(data)) {
          throw new Error(
            "The backend returned an unexpected table format."
          );
        }

        const mapped: RestaurantTable[] = (data as ApiTable[])
          .filter(
            (table) =>
              table &&
              table.is_active === true &&
              typeof table.id === "number" &&
              typeof table.table_number === "string" &&
              typeof table.capacity === "number"
          )
          .map((table) => ({
            id: String(table.id),
            name: table.table_number,
            capacity: table.capacity,
            section: getSection(table.table_number),
          }))
          .sort((a, b) => {
            const sectionOrder =
              SECTIONS.indexOf(a.section) - SECTIONS.indexOf(b.section);

            if (sectionOrder !== 0) return sectionOrder;

            return (
              getTableNumber(a.name) - getTableNumber(b.name) ||
              a.name.localeCompare(b.name)
            );
          });

        if (!signal.aborted) {
          setTables(mapped);
        }
      } catch (err) {
        if (signal.aborted) return;

        setError(
          err instanceof Error
            ? err.message
            : "Something went wrong while loading tables."
        );
        setTables([]);
      } finally {
        if (!signal.aborted) {
          setLoading(false);
        }
      }
    },
    [backendRestaurantId]
  );

  useEffect(() => {
    const controller = new AbortController();

    void loadTables(controller.signal);

    return () => controller.abort();
  }, [loadTables, retryCount]);

  const unavailableSet = useMemo(
    () => new Set(unavailableTableIds.map(String)),
    [unavailableTableIds]
  );

  const selectedTable = useMemo(
    () => tables.find((table) => table.id === selectedTableId),
    [tables, selectedTableId]
  );

  // Clear a selected table if it is missing, too small or unavailable.
  useEffect(() => {
    if (loading || !selectedTableId) return;

    const selected = tables.find(
      (table) => table.id === selectedTableId
    );

    if (
      !selected ||
      selected.capacity < guests ||
      unavailableSet.has(selectedTableId)
    ) {
      onSelect(EMPTY_TABLE);
    }
  }, [
    loading,
    tables,
    selectedTableId,
    guests,
    unavailableSet,
    onSelect,
  ]);

  const retry = () => {
    setRetryCount((count) => count + 1);
  };

  return (
    <section className="mt-6 rounded-[26px] border border-[#e5e3da] bg-[#fbfaf6] p-5 sm:p-7">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[1.8px] text-[#85877e]">
            Interactive Seating Plan
          </p>

          <h2 className="mt-1 font-serif text-2xl text-[#20251f] sm:text-3xl">
            Select your preferred table
          </h2>

          <p className="mt-1.5 text-xs text-[#777d73]">
            Tables suitable for your party of {guests}{" "}
            {guests === 1 ? "guest" : "guests"}.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 rounded-xl border border-[#e5e3da] bg-white px-3.5 py-2 text-[11px] text-[#555d52]">
          <span className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-[#244b38]" />
            Available
          </span>

          <span className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-[#b48a43]" />
            Selected
          </span>

          <span className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-[#b5b5b0]" />
            Unavailable
          </span>
        </div>
      </div>

      <div className="mt-6 flex items-center justify-center gap-2 rounded-xl border border-dashed border-[#d5d7ce] bg-white/80 py-2.5">
        <span aria-hidden="true">🪟</span>
        <span className="text-[10px] font-bold uppercase tracking-[2px] text-[#787f73]">
          Window view dining area
        </span>
      </div>

      {loading && (
        <div
          className="mt-6 rounded-xl bg-white p-8 text-center text-sm text-[#777d73]"
          role="status"
          aria-live="polite"
        >
          <span className="inline-flex items-center gap-2">
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-[#dfe6dc] border-t-[#244b38]" />
            Loading tables...
          </span>
        </div>
      )}

      {!loading && error && (
        <div
          className="mt-6 rounded-xl border border-red-200 bg-red-50 p-5 text-center"
          role="alert"
        >
          <p className="text-sm font-semibold text-red-700">
            Could not load the seating plan
          </p>

          <p className="mt-1 text-xs text-red-600">
            {error}
          </p>

          <p className="mt-1 text-xs text-red-600">
            Make sure the FastAPI backend is running and the API URL is correct.
          </p>

          <button
            type="button"
            onClick={retry}
            className="mt-4 rounded-lg bg-[#244b38] px-4 py-2 text-xs font-semibold text-white transition hover:bg-[#183727]"
          >
            Try again
          </button>
        </div>
      )}

      {!loading && !error && tables.length === 0 && (
        <div className="mt-6 rounded-xl bg-white p-8 text-center">
          <p className="text-sm font-semibold text-[#555d52]">
            No active tables found
          </p>

          <p className="mt-1 text-xs text-[#777d73]">
            This restaurant currently has no active tables in the database.
          </p>

          <button
            type="button"
            onClick={retry}
            className="mt-4 text-xs font-semibold text-[#244b38] underline underline-offset-4"
          >
            Refresh tables
          </button>
        </div>
      )}

      {!loading && !error && tables.length > 0 && (
        <div className="mt-6 space-y-6">
          {SECTIONS.map((section) => {
            const sectionTables = tables.filter(
              (table) => table.section === section
            );

            if (sectionTables.length === 0) return null;

            return (
              <div key={section}>
                <div className="mb-3.5 flex items-center gap-2.5">
                  <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-[#e9eee7] text-[10px] font-bold text-[#244b38]">
                    {section === "Other" ? "•" : section}
                  </span>

                  <span className="text-[11px] font-bold uppercase tracking-[1.4px] text-[#6b7367]">
                    {section === "Other"
                      ? "Other Tables"
                      : `Section ${section}`}
                  </span>

                  <div className="h-px flex-1 bg-[#e8e6dd]" />
                </div>

                <div className="grid grid-cols-2 gap-3.5 sm:grid-cols-3">
                  {sectionTables.map((table) => {
                    const unavailable = unavailableSet.has(table.id);
                    const tooSmall = table.capacity < guests;
                    const disabled = unavailable || tooSmall;
                    const selected = selectedTableId === table.id;

                    return (
                      <button
                        key={table.id}
                        type="button"
                        disabled={disabled}
                        onClick={() => onSelect(table)}
                        aria-pressed={selected}
                        aria-label={`${table.name}, capacity ${table.capacity} guests, ${
                          selected
                            ? "selected"
                            : unavailable
                              ? "unavailable"
                              : tooSmall
                                ? "too small"
                                : "available"
                        }`}
                        className={`flex min-h-[148px] flex-col items-center justify-center rounded-[20px] border-2 p-3.5 text-center transition ${
                          selected
                            ? "border-[#b48a43] bg-[#fbf6ea] shadow-md"
                            : disabled
                              ? "cursor-not-allowed border-[#e5e5df] bg-[#f2f2ee] opacity-65"
                              : "border-[#dfe6dc] bg-white hover:-translate-y-0.5 hover:border-[#244b38] hover:shadow-md"
                        }`}
                      >
                        <span
                          className={`flex h-11 w-11 items-center justify-center rounded-xl ${
                            selected
                              ? "bg-[#ecdcb4] text-[#825e1a]"
                              : disabled
                                ? "bg-[#e1e1dc] text-[#999b94]"
                                : "bg-[#eaf2e9] text-[#244b38]"
                          }`}
                        >
                          <svg
                            viewBox="0 0 48 48"
                            className="h-7 w-7"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            aria-hidden="true"
                          >
                            <rect
                              x="11"
                              y="11"
                              width="26"
                              height="26"
                              rx="6"
                            />
                            <path d="M17 6v5M31 6v5M17 37v5M31 37v5M6 17h5M6 31h5M37 17h5M37 31h5" />
                          </svg>
                        </span>

                        <span className="mt-2 text-sm font-semibold text-[#20251f]">
                          {table.name}
                        </span>

                        <span className="mt-0.5 text-xs text-[#777d73]">
                          Up to {table.capacity}{" "}
                          {table.capacity === 1 ? "guest" : "guests"}
                        </span>

                        <span
                          className={`mt-2 rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase ${
                            selected
                              ? "bg-[#ecdcb4] text-[#735314]"
                              : unavailable || tooSmall
                                ? "bg-[#e1e1dc] text-[#777870]"
                                : "bg-[#e5eee4] text-[#244b38]"
                          }`}
                        >
                          {selected
                            ? "Selected"
                            : unavailable
                              ? "Unavailable"
                              : tooSmall
                                ? "Too small"
                                : "Available"}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div className="mt-6 rounded-2xl border border-[#e5e3da] bg-white p-4">
        {selectedTable ? (
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[1.4px] text-[#85877e]">
                Seating Selected
              </p>

              <p className="mt-0.5 text-sm font-bold text-[#244b38]">
                {selectedTable.name} (Capacity: {selectedTable.capacity}{" "}
                {selectedTable.capacity === 1 ? "guest" : "guests"})
              </p>
            </div>

            <button
              type="button"
              onClick={() => onSelect(EMPTY_TABLE)}
              className="text-xs font-semibold text-[#777d73] underline underline-offset-4 hover:text-[#244b38]"
            >
              Clear table selection
            </button>
          </div>
        ) : (
          <p className="text-center text-xs text-[#777d73]">
            Select an available table to continue.
          </p>
        )}
      </div>

      <p className="mt-4 text-center text-[10px] text-[#999b92]">
        Table availability is checked again by the backend when booking.
      </p>
    </section>
  );
}
