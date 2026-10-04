"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Navbar from "../../components/Navbar";
import { useAuth } from "../../context/AuthContext";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

type OwnedRestaurant = {
  id: number;
  name: string;
  cuisine: string;
  location: string;
  address?: string;
  rating?: number;
  reviews?: number;
  cancellation_hours: number;
  late_arrival_minutes: number;
  reservation_duration_minutes: number;
  max_party_size: number;
  policy_terms: string;
  policy_version: number;
};

type Table = {
  id: number;
  restaurant_id: number;
  table_number: string;
  capacity: number;
  is_active: boolean;
  status: string; // 'available' | 'maintenance' | 'occupied'
};

type OwnerReservation = {
  id: number;
  booking_reference: string;
  user_id: number;
  restaurant_id: number;
  table_id: number;
  table_number?: string;
  guest_count: number;
  start_time: string;
  end_time: string;
  status: "pending" | "confirmed" | "seated" | "completed" | "cancelled" | string;
  customer_name?: string;
  customer_email?: string;
  customer_phone?: string;
  special_request?: string;
  policy_version_accepted?: number;
  accepted_policy_terms?: string;
  created_at: string;
  updated_at: string;
};

type AssignmentHistory = {
  id: number;
  reservation_id: number;
  previous_table_id?: number;
  new_table_id: number;
  changed_by_user_id: number;
  reason?: string;
  created_at: string;
};

type ProposedReassignment = {
  reservation_id: number;
  booking_reference: string;
  customer_name: string;
  guest_count: number;
  start_time: string;
  current_table_id: number;
  suggested_table_id?: number;
  suggested_table_number?: string;
  is_suitable: boolean;
  notes?: string;
};

function getTodayLocal(): string {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatDate(dateString: string) {
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return dateString;
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
  if (Number.isNaN(date.getTime())) return dateString;
  return new Intl.DateTimeFormat("en-IN", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    timeZone: "Asia/Kolkata",
  }).format(date);
}

export default function OwnerDashboardPage() {
  const router = useRouter();
  const { user, isOwner, isLoading: authLoading, token } = useAuth();

  const [restaurants, setRestaurants] = useState<OwnedRestaurant[]>([]);
  const [selectedRestaurant, setSelectedRestaurant] = useState<OwnedRestaurant | null>(null);
  const [activeTab, setActiveTab] = useState<"overview" | "reservations" | "tables" | "policies">("overview");

  // Dashboard Data
  const [reservations, setReservations] = useState<OwnerReservation[]>([]);
  const [tables, setTables] = useState<Table[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Reservation Filters
  const [filterDate, setFilterDate] = useState<string>("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Reassignment Modal
  const [reassignModalOpen, setReassignModalOpen] = useState(false);
  const [targetReservation, setTargetReservation] = useState<OwnerReservation | null>(null);
  const [newTableId, setNewTableId] = useState<number | null>(null);
  const [reassignReason, setReassignReason] = useState("");
  const [isReassigning, setIsReassigning] = useState(false);

  // Seating Recovery Modal
  const [recoveryModalOpen, setRecoveryModalOpen] = useState(false);
  const [recoverySourceTable, setRecoverySourceTable] = useState<Table | null>(null);
  const [recoveryReason, setRecoveryReason] = useState("Scheduled maintenance and deep cleaning");
  const [proposedMoves, setProposedMoves] = useState<ProposedReassignment[]>([]);
  const [manualMoveMap, setManualMoveMap] = useState<Record<number, number>>({});
  const [isCheckingRecovery, setIsCheckingRecovery] = useState(false);
  const [isApplyingRecovery, setIsApplyingRecovery] = useState(false);

  // Assignment History Modal
  const [historyModalOpen, setHistoryModalOpen] = useState(false);
  const [reservationHistory, setReservationHistory] = useState<AssignmentHistory[]>([]);
  const [historyReservationRef, setHistoryReservationRef] = useState<string>("");

  // Policy Edit Form
  const [policyForm, setPolicyForm] = useState({
    cancellation_hours: 2,
    late_arrival_minutes: 15,
    reservation_duration_minutes: 90,
    max_party_size: 8,
    policy_terms: "",
  });
  const [isSavingPolicies, setIsSavingPolicies] = useState(false);

  // 1. Fetch Owned Restaurants
  const loadOwnedRestaurants = useCallback(async () => {
    if (!token) return;
    try {
      const response = await fetch(`${API_URL}/restaurants/owned`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        const list: OwnedRestaurant[] = await response.json();
        setRestaurants(list);
        if (list.length > 0 && !selectedRestaurant) {
          setSelectedRestaurant(list[0]);
          setPolicyForm({
            cancellation_hours: list[0].cancellation_hours,
            late_arrival_minutes: list[0].late_arrival_minutes,
            reservation_duration_minutes: list[0].reservation_duration_minutes,
            max_party_size: list[0].max_party_size,
            policy_terms: list[0].policy_terms || "",
          });
        }
      }
    } catch (err) {
      console.error("Failed to load owned restaurants", err);
    }
  }, [token, selectedRestaurant]);

  // 2. Fetch Restaurant Data (Reservations + Tables)
  const loadRestaurantData = useCallback(async (restaurantId: number) => {
    if (!token) return;
    setIsLoadingData(true);
    setStatusMessage(null);

    try {
      const [resResponse, tablesResponse] = await Promise.all([
        fetch(`${API_URL}/reservations/owner/${restaurantId}`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`${API_URL}/tables/restaurant/${restaurantId}/all`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      if (resResponse.ok) {
        const resList: OwnerReservation[] = await resResponse.json();
        setReservations(resList);
      }

      if (tablesResponse.ok) {
        const tableList: Table[] = await tablesResponse.json();
        setTables(tableList);
      }
    } catch (err) {
      console.error("Failed to load restaurant data", err);
      setStatusMessage({ type: "error", text: "Failed to load dashboard data." });
    } finally {
      setIsLoadingData(false);
    }
  }, [token]);

  useEffect(() => {
    if (!authLoading && !isOwner) {
      router.replace("/login");
    }
  }, [authLoading, isOwner, router]);

  useEffect(() => {
    if (token && isOwner) {
      void loadOwnedRestaurants();
    }
  }, [token, isOwner, loadOwnedRestaurants]);

  useEffect(() => {
    if (selectedRestaurant) {
      void loadRestaurantData(selectedRestaurant.id);
      setPolicyForm({
        cancellation_hours: selectedRestaurant.cancellation_hours,
        late_arrival_minutes: selectedRestaurant.late_arrival_minutes,
        reservation_duration_minutes: selectedRestaurant.reservation_duration_minutes,
        max_party_size: selectedRestaurant.max_party_size,
        policy_terms: selectedRestaurant.policy_terms || "",
      });
    }
  }, [selectedRestaurant, loadRestaurantData]);

  // Actions
  const handleUpdateStatus = async (reservationId: number, newStatus: string) => {
    if (!token || !selectedRestaurant) return;
    try {
      const response = await fetch(`${API_URL}/reservations/${reservationId}/status`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.detail || "Failed to update reservation status.");
      }

      setStatusMessage({ type: "success", text: `Reservation updated to ${newStatus}.` });
      void loadRestaurantData(selectedRestaurant.id);
    } catch (err) {
      setStatusMessage({
        type: "error",
        text: err instanceof Error ? err.message : "Failed to update status.",
      });
    }
  };

  const handleOpenReassignModal = (res: OwnerReservation) => {
    setTargetReservation(res);
    setNewTableId(null);
    setReassignReason("");
    setReassignModalOpen(true);
  };

  const handleExecuteReassignment = async () => {
    if (!token || !targetReservation || !newTableId || !selectedRestaurant) return;
    setIsReassigning(true);
    setStatusMessage(null);

    try {
      const response = await fetch(`${API_URL}/reservations/${targetReservation.id}/reassign`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          new_table_id: newTableId,
          reason: reassignReason.trim() || "Owner table reallocation",
        }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.detail || "Reassignment conflict or failure.");
      }

      setReassignModalOpen(false);
      setStatusMessage({ type: "success", text: `Reservation reassigned to Table #${newTableId} successfully.` });
      void loadRestaurantData(selectedRestaurant.id);
    } catch (err) {
      setStatusMessage({
        type: "error",
        text: err instanceof Error ? err.message : "Could not reassign table.",
      });
    } finally {
      setIsReassigning(false);
    }
  };

  const handleViewHistory = async (reservation: OwnerReservation) => {
    if (!token) return;
    try {
      setHistoryReservationRef(reservation.booking_reference || `RES-${reservation.id}`);
      const response = await fetch(`${API_URL}/reservations/${reservation.id}/history`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        const hist = await response.json();
        setReservationHistory(hist);
        setHistoryModalOpen(true);
      }
    } catch (err) {
      console.error("Failed to load history", err);
    }
  };

  // Seating Recovery & Maintenance
  const handleToggleMaintenance = async (table: Table) => {
    if (!token || !selectedRestaurant) return;
    const isEnteringMaintenance = table.status !== "maintenance";

    if (isEnteringMaintenance) {
      // Open Recovery preview and call maintenance endpoint
      setRecoverySourceTable(table);
      setRecoveryReason("Scheduled maintenance & inspection");
      setRecoveryModalOpen(true);
      setIsCheckingRecovery(true);
      setProposedMoves([]);
      setManualMoveMap({});

      try {
        const maintRes = await fetch(`${API_URL}/tables/${table.id}/maintenance`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            is_active: false,
            status: "maintenance",
            reason: "Maintenance inspection",
          }),
        });

        if (maintRes.ok) {
          const maintData = await maintRes.json();
          const affected: any[] = maintData.affected_reservations || [];
          
          const mappedMoves: ProposedReassignment[] = affected.map((item) => {
            const bestAlt = item.available_alternative_tables?.[0];
            return {
              reservation_id: item.reservation_id,
              booking_reference: item.booking_reference,
              customer_name: item.customer_name || "Guest",
              guest_count: item.guest_count,
              start_time: item.start_time,
              current_table_id: item.current_table_id,
              suggested_table_id: bestAlt?.id,
              suggested_table_number: bestAlt?.table_number,
              is_suitable: !!bestAlt,
            };
          });

          setProposedMoves(mappedMoves);
          const initialMap: Record<number, number> = {};
          mappedMoves.forEach((p) => {
            if (p.suggested_table_id) {
              initialMap[p.reservation_id] = p.suggested_table_id;
            }
          });
          setManualMoveMap(initialMap);
        }
      } catch (err) {
        console.error("Maintenance check failed", err);
      } finally {
        setIsCheckingRecovery(false);
      }
    } else {
      // Toggle back to available
      try {
        const response = await fetch(`${API_URL}/tables/${table.id}/maintenance`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            is_active: true,
            status: "available",
            reason: "Table returned to service",
          }),
        });

        if (response.ok) {
          setStatusMessage({ type: "success", text: `Table ${table.table_number} returned to operational service.` });
          void loadRestaurantData(selectedRestaurant.id);
        }
      } catch (err) {
        setStatusMessage({ type: "error", text: "Failed to update table status." });
      }
    }
  };

  const handleApplySeatingRecovery = async () => {
    if (!token || !selectedRestaurant || !recoverySourceTable) return;
    setIsApplyingRecovery(true);
    setStatusMessage(null);

    try {
      const reassignmentsList = Object.entries(manualMoveMap).map(([resId, tblId]) => ({
        reservation_id: Number(resId),
        new_table_id: Number(tblId),
      }));

      const applyRes = await fetch(`${API_URL}/tables/recovery/apply`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          restaurant_id: selectedRestaurant.id,
          source_table_id: recoverySourceTable.id,
          reassignments: reassignmentsList,
          reason: recoveryReason.trim() || "Maintenance seating recovery",
        }),
      });

      if (!applyRes.ok) {
        const data = await applyRes.json().catch(() => ({}));
        throw new Error(data.detail || "Failed to apply seating recovery.");
      }

      setRecoveryModalOpen(false);
      setStatusMessage({
        type: "success",
        text: `Seating recovery complete! Table ${recoverySourceTable.table_number} set to maintenance and ${reassignmentsList.length} reservations safely reassigned.`,
      });
      void loadRestaurantData(selectedRestaurant.id);
    } catch (err) {
      setStatusMessage({
        type: "error",
        text: err instanceof Error ? err.message : "Seating recovery execution failed.",
      });
    } finally {
      setIsApplyingRecovery(false);
    }
  };

  const handleSavePolicies = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !selectedRestaurant) return;
    setIsSavingPolicies(true);
    setStatusMessage(null);

    try {
      const response = await fetch(`${API_URL}/restaurants/${selectedRestaurant.id}/policies`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(policyForm),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.detail || "Failed to save policies.");
      }

      const updatedPolicy = await response.json();
      setSelectedRestaurant((prev) =>
        prev
          ? {
              ...prev,
              ...updatedPolicy,
            }
          : null
      );
      setStatusMessage({
        type: "success",
        text: `Policies updated successfully! Active version bumped to v${updatedPolicy.policy_version}.`,
      });
    } catch (err) {
      setStatusMessage({
        type: "error",
        text: err instanceof Error ? err.message : "Failed to update policies.",
      });
    } finally {
      setIsSavingPolicies(false);
    }
  };

  if (authLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f8f7f2]">
        <p className="text-xs text-[#777d73]">Verifying owner credentials...</p>
      </main>
    );
  }

  // Filtered reservations
  const today = getTodayLocal();
  const filteredReservations = reservations.filter((r) => {
    if (filterDate && !r.start_time.startsWith(filterDate)) return false;
    if (filterStatus !== "all" && r.status.toLowerCase() !== filterStatus.toLowerCase()) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const refMatch = (r.booking_reference || "").toLowerCase().includes(q);
      const nameMatch = (r.customer_name || "").toLowerCase().includes(q);
      const phoneMatch = (r.customer_phone || "").toLowerCase().includes(q);
      return refMatch || nameMatch || phoneMatch;
    }
    return true;
  });

  // Metrics
  const todayReservations = reservations.filter((r) => r.start_time.startsWith(today));
  const activeTablesCount = tables.filter((t) => t.is_active && t.status !== "maintenance").length;
  const maintenanceTablesCount = tables.filter((t) => t.status === "maintenance").length;
  const seatedGuestsCount = todayReservations
    .filter((r) => r.status.toLowerCase() === "seated")
    .reduce((acc, r) => acc + r.guest_count, 0);

  return (
    <main className="min-h-screen bg-[#f8f7f2] text-[#20251f]">
      {/* NAVBAR */}
      <Navbar />

      <div className="container-shell pb-24 pt-8">
        {/* HEADER BAR */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#e5e3da] pb-6">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-[#244b38]/20 bg-[#e9eee6] px-3.5 py-1 text-[10px] font-bold uppercase tracking-wider text-[#244b38]">
              <span className="h-1.5 w-1.5 rounded-full bg-[#244b38]" />
              Restaurant Owner Portal
            </div>
            <h1 className="mt-2 font-serif text-3xl font-medium tracking-tight text-[#20251f] sm:text-4xl">
              {selectedRestaurant?.name || "Owner Dashboard"}
            </h1>
            <p className="mt-1 text-xs text-[#777d73]">
              Manage live dining schedules, table inventory, seating recovery, and guest policies.
            </p>
          </div>

          {/* RESTAURANT SELECTOR */}
          {restaurants.length > 1 && (
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-[#5a6258]">Restaurant:</span>
              <select
                value={selectedRestaurant?.id || ""}
                onChange={(e) => {
                  const found = restaurants.find((r) => r.id === Number(e.target.value));
                  if (found) setSelectedRestaurant(found);
                }}
                className="rounded-xl border border-[#d9ddd4] bg-white px-3.5 py-2 text-xs font-semibold text-[#20251f] outline-none shadow-xs"
              >
                {restaurants.map((rest) => (
                  <option key={rest.id} value={rest.id}>
                    {rest.name} ({rest.location})
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* STATUS NOTIFICATION */}
        {statusMessage && (
          <div
            role="alert"
            className={`mt-4 flex items-center justify-between rounded-xl border p-4 text-xs font-semibold ${
              statusMessage.type === "success"
                ? "border-[#c4dec4] bg-[#f1f9f1] text-[#244b38]"
                : "border-[#f0d0c8] bg-[#fff5f1] text-[#a33d31]"
            }`}
          >
            <span>{statusMessage.text}</span>
            <button
              type="button"
              onClick={() => setStatusMessage(null)}
              className="ml-4 font-bold opacity-70 hover:opacity-100"
            >
              ✕
            </button>
          </div>
        )}

        {/* DASHBOARD TABS */}
        <div className="mt-6 flex flex-wrap gap-2 border-b border-[#e5e3da] pb-3">
          <button
            type="button"
            onClick={() => setActiveTab("overview")}
            className={`rounded-full px-5 py-2 text-xs font-bold transition ${
              activeTab === "overview"
                ? "bg-[#244b38] text-white shadow-xs"
                : "bg-white text-[#5a6258] hover:bg-[#eae8df]"
            }`}
          >
            📊 Overview &amp; Live Occupancy
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("reservations")}
            className={`rounded-full px-5 py-2 text-xs font-bold transition ${
              activeTab === "reservations"
                ? "bg-[#244b38] text-white shadow-xs"
                : "bg-white text-[#5a6258] hover:bg-[#eae8df]"
            }`}
          >
            📋 Reservations ({reservations.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("tables")}
            className={`rounded-full px-5 py-2 text-xs font-bold transition ${
              activeTab === "tables"
                ? "bg-[#244b38] text-white shadow-xs"
                : "bg-white text-[#5a6258] hover:bg-[#eae8df]"
            }`}
          >
            🪑 Tables &amp; Seating Recovery ({tables.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("policies")}
            className={`rounded-full px-5 py-2 text-xs font-bold transition ${
              activeTab === "policies"
                ? "bg-[#244b38] text-white shadow-xs"
                : "bg-white text-[#5a6258] hover:bg-[#eae8df]"
            }`}
          >
            ⚙️ Booking Policies (v{selectedRestaurant?.policy_version || 1})
          </button>
        </div>

        {/* TAB 1: OVERVIEW */}
        {activeTab === "overview" && (
          <div className="mt-8 space-y-8">
            {/* METRICS ROW */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-2xl border border-[#e5e3da] bg-white p-5 shadow-xs">
                <p className="text-[10px] font-bold uppercase tracking-wider text-[#85877e]">Today's Bookings</p>
                <p className="mt-2 text-3xl font-serif font-bold text-[#20251f]">{todayReservations.length}</p>
                <p className="mt-1 text-[11px] text-[#777d73]">
                  {todayReservations.filter((r) => r.status === "confirmed").length} confirmed
                </p>
              </div>

              <div className="rounded-2xl border border-[#e5e3da] bg-white p-5 shadow-xs">
                <p className="text-[10px] font-bold uppercase tracking-wider text-[#85877e]">Currently Seated</p>
                <p className="mt-2 text-3xl font-serif font-bold text-[#244b38]">
                  {todayReservations.filter((r) => r.status === "seated").length} tables
                </p>
                <p className="mt-1 text-[11px] text-[#777d73]">{seatedGuestsCount} guests dining right now</p>
              </div>

              <div className="rounded-2xl border border-[#e5e3da] bg-white p-5 shadow-xs">
                <p className="text-[10px] font-bold uppercase tracking-wider text-[#85877e]">Active Tables</p>
                <p className="mt-2 text-3xl font-serif font-bold text-[#20251f]">
                  {activeTablesCount} <span className="text-sm font-normal text-[#85877e]">/ {tables.length}</span>
                </p>
                <p className="mt-1 text-[11px] text-[#777d73]">Ready for guest seating</p>
              </div>

              <div className="rounded-2xl border border-[#e5e3da] bg-white p-5 shadow-xs">
                <p className="text-[10px] font-bold uppercase tracking-wider text-[#85877e]">Under Maintenance</p>
                <p className="mt-2 text-3xl font-serif font-bold text-[#b48a43]">{maintenanceTablesCount}</p>
                <p className="mt-1 text-[11px] text-[#777d73]">
                  {maintenanceTablesCount > 0 ? "Seating recovery active" : "All tables operational"}
                </p>
              </div>
            </div>

            {/* LIVE FLOOR STATUS */}
            <div className="rounded-[26px] border border-[#e5e3da] bg-white p-6 shadow-xs sm:p-8">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="font-serif text-2xl font-medium tracking-tight text-[#20251f]">
                    Floor Layout &amp; Occupancy
                  </h2>
                  <p className="text-xs text-[#777d73]">
                    Visual status of all tables for {selectedRestaurant?.name}.
                  </p>
                </div>
                <div className="flex items-center gap-3 text-xs">
                  <span className="flex items-center gap-1.5">
                    <span className="h-3 w-3 rounded-full bg-[#244b38]" /> Operational
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="h-3 w-3 rounded-full bg-[#b48a43]" /> Maintenance
                  </span>
                </div>
              </div>

              <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                {tables.map((table) => {
                  const isMaint = table.status === "maintenance";
                  const tableReservations = todayReservations.filter((r) => r.table_id === table.id && r.status !== "cancelled");

                  return (
                    <div
                      key={table.id}
                      className={`relative flex flex-col justify-between rounded-2xl border-2 p-4 transition ${
                        isMaint
                          ? "border-[#e0cb9d] bg-[#fbf8f0]"
                          : "border-[#e5e8e0] bg-[#fafbf9] hover:border-[#244b38]"
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <span className="text-base font-bold text-[#20251f]">
                          {table.table_number}
                        </span>
                        <span
                          className={`rounded-full px-2 py-0.5 text-[9px] font-bold uppercase ${
                            isMaint
                              ? "bg-[#ecdcb4] text-[#825e1a]"
                              : "bg-[#e9eee6] text-[#244b38]"
                          }`}
                        >
                          {isMaint ? "Maint" : "Active"}
                        </span>
                      </div>

                      <div className="mt-4">
                        <p className="text-xs text-[#777d73]">Capacity: {table.capacity} guests</p>
                        <p className="mt-1 text-[11px] font-semibold text-[#20251f]">
                          {tableReservations.length} {tableReservations.length === 1 ? "booking" : "bookings"} today
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleToggleMaintenance(table)}
                        className={`mt-4 w-full rounded-xl py-1.5 text-[11px] font-bold transition ${
                          isMaint
                            ? "bg-[#244b38] text-white hover:bg-[#183727]"
                            : "border border-[#e0cb9d] bg-white text-[#8c6b32] hover:bg-[#fbf6ea]"
                        }`}
                      >
                        {isMaint ? "Restore Table" : "Set Maintenance"}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* TODAY'S TIMELINE PREVIEW */}
            <div className="rounded-[26px] border border-[#e5e3da] bg-white p-6 shadow-xs sm:p-8">
              <h2 className="font-serif text-2xl font-medium tracking-tight text-[#20251f]">
                Today's Schedule ({today})
              </h2>
              <p className="text-xs text-[#777d73]">Upcoming dining sessions for today.</p>

              {todayReservations.length === 0 ? (
                <p className="mt-6 text-center text-xs text-[#777d73] py-8 border border-dashed rounded-xl">
                  No reservations scheduled for today.
                </p>
              ) : (
                <div className="mt-6 divide-y divide-[#eeeae2]">
                  {todayReservations.map((r) => (
                    <div key={r.id} className="flex flex-wrap items-center justify-between gap-4 py-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-serif text-base font-bold text-[#20251f]">
                            {r.customer_name || "Guest"}
                          </span>
                          <span className="text-xs text-[#777d73]">
                            ({r.guest_count} guests · Table #{r.table_id})
                          </span>
                        </div>
                        <p className="text-xs text-[#777d73]">
                          ⏰ {formatTime(r.start_time)} – {formatTime(r.end_time)} · Ref: <strong>{r.booking_reference}</strong>
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        {r.status === "confirmed" && (
                          <button
                            type="button"
                            onClick={() => handleUpdateStatus(r.id, "seated")}
                            className="rounded-full bg-[#244b38] px-4 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-[#183727]"
                          >
                            Seat Guests
                          </button>
                        )}
                        {r.status === "seated" && (
                          <button
                            type="button"
                            onClick={() => handleUpdateStatus(r.id, "completed")}
                            className="rounded-full bg-blue-700 px-4 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-blue-800"
                          >
                            Mark Completed
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => handleOpenReassignModal(r)}
                          className="rounded-full border border-[#d9ddd4] bg-white px-3.5 py-1.5 text-xs font-semibold text-[#20251f] hover:border-[#244b38]"
                        >
                          Reassign
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 2: RESERVATIONS */}
        {activeTab === "reservations" && (
          <div className="mt-8 space-y-6">
            {/* FILTER BAR */}
            <div className="flex flex-wrap items-center gap-4 rounded-2xl border border-[#e5e3da] bg-white p-4 shadow-xs">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-[#85877e]">Date</label>
                <input
                  type="date"
                  value={filterDate}
                  onChange={(e) => setFilterDate(e.target.value)}
                  className="mt-1 rounded-lg border border-[#e0e3da] px-3 py-1.5 text-xs text-[#20251f] outline-none"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-[#85877e]">Status</label>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="mt-1 rounded-lg border border-[#e0e3da] px-3 py-1.5 text-xs text-[#20251f] outline-none"
                >
                  <option value="all">All Statuses</option>
                  <option value="pending">Pending</option>
                  <option value="confirmed">Confirmed</option>
                  <option value="seated">Seated</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>

              <div className="flex-1 min-w-[200px]">
                <label className="block text-[10px] font-bold uppercase tracking-wider text-[#85877e]">Search</label>
                <input
                  type="text"
                  placeholder="Search guest name, ref, or phone..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-[#e0e3da] px-3 py-1.5 text-xs text-[#20251f] outline-none"
                />
              </div>

              {(filterDate || filterStatus !== "all" || searchQuery) && (
                <button
                  type="button"
                  onClick={() => {
                    setFilterDate("");
                    setFilterStatus("all");
                    setSearchQuery("");
                  }}
                  className="mt-4 text-xs font-semibold text-[#a33d31] hover:underline"
                >
                  Reset filters
                </button>
              )}
            </div>

            {/* RESERVATIONS TABLE */}
            <div className="overflow-hidden rounded-[26px] border border-[#e5e3da] bg-white shadow-xs">
              {filteredReservations.length === 0 ? (
                <div className="p-12 text-center text-xs text-[#777d73]">
                  No reservations matched your criteria.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="border-b border-[#eeeae2] bg-[#fafaf7] text-[10px] font-bold uppercase tracking-wider text-[#85877e]">
                      <tr>
                        <th className="px-6 py-3.5">Ref / Guest</th>
                        <th className="px-6 py-3.5">Schedule</th>
                        <th className="px-6 py-3.5">Table &amp; Party</th>
                        <th className="px-6 py-3.5">Status</th>
                        <th className="px-6 py-3.5">Policy Version</th>
                        <th className="px-6 py-3.5 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#eeeae2]">
                      {filteredReservations.map((r) => {
                        const isCancelled = r.status.toLowerCase() === "cancelled";
                        const isSeated = r.status.toLowerCase() === "seated";
                        const isCompleted = r.status.toLowerCase() === "completed";

                        return (
                          <tr key={r.id} className="hover:bg-[#fcfbf9] transition">
                            <td className="px-6 py-4">
                              <p className="font-serif text-sm font-bold text-[#20251f]">
                                {r.customer_name || "Guest"}
                              </p>
                              <p className="text-[11px] font-mono text-[#244b38]">
                                {r.booking_reference}
                              </p>
                              <p className="text-[10px] text-[#8c9186]">
                                {r.customer_phone || r.customer_email || "No direct phone"}
                              </p>
                              {r.special_request && (
                                <p className="mt-1 text-[10px] italic text-[#697066]">
                                  Note: "{r.special_request}"
                                </p>
                              )}
                            </td>

                            <td className="px-6 py-4">
                              <p className="font-semibold text-[#20251f]">{formatDate(r.start_time)}</p>
                              <p className="text-[#777d73]">
                                {formatTime(r.start_time)} – {formatTime(r.end_time)}
                              </p>
                            </td>

                            <td className="px-6 py-4">
                              <p className="font-bold text-[#8c6b32]">Table #{r.table_id}</p>
                              <p className="text-[#777d73]">{r.guest_count} guests</p>
                            </td>

                            <td className="px-6 py-4">
                              <span
                                className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase ${
                                  isCancelled
                                    ? "bg-red-50 text-red-700"
                                    : isSeated
                                    ? "bg-blue-50 text-blue-700"
                                    : isCompleted
                                    ? "bg-gray-100 text-gray-700"
                                    : "bg-[#e9eee6] text-[#244b38]"
                                }`}
                              >
                                {r.status}
                              </span>
                            </td>

                            <td className="px-6 py-4 text-[#777d73]">
                              v{r.policy_version_accepted || 1}
                            </td>

                            <td className="px-6 py-4 text-right">
                              <div className="flex items-center justify-end gap-2">
                                {r.status === "confirmed" && (
                                  <button
                                    type="button"
                                    onClick={() => handleUpdateStatus(r.id, "seated")}
                                    className="rounded-full bg-[#244b38] px-3 py-1 text-[11px] font-bold text-white hover:bg-[#183727]"
                                  >
                                    Seat
                                  </button>
                                )}
                                {r.status === "seated" && (
                                  <button
                                    type="button"
                                    onClick={() => handleUpdateStatus(r.id, "completed")}
                                    className="rounded-full bg-blue-700 px-3 py-1 text-[11px] font-bold text-white hover:bg-blue-800"
                                  >
                                    Complete
                                  </button>
                                )}
                                {!isCancelled && !isCompleted && (
                                  <button
                                    type="button"
                                    onClick={() => handleOpenReassignModal(r)}
                                    className="rounded-full border border-[#d9ddd4] bg-white px-2.5 py-1 text-[11px] font-semibold hover:border-[#244b38]"
                                  >
                                    Reassign
                                  </button>
                                )}
                                <button
                                  type="button"
                                  onClick={() => handleViewHistory(r)}
                                  className="text-[11px] text-[#777d73] hover:underline"
                                >
                                  History
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 3: TABLES & SEATING RECOVERY */}
        {activeTab === "tables" && (
          <div className="mt-8 space-y-8">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h2 className="font-serif text-2xl font-medium tracking-tight text-[#20251f]">
                  Restaurant Seating &amp; Recovery Workflow
                </h2>
                <p className="text-xs text-[#777d73]">
                  Mark tables unavailable for operational maintenance and atomically reassign affected guests with zero double-booking risk.
                </p>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {tables.map((table) => {
                const isMaint = table.status === "maintenance";
                const affectedCount = reservations.filter(
                  (r) => r.table_id === table.id && r.status !== "cancelled" && r.status !== "completed"
                ).length;

                return (
                  <div
                    key={table.id}
                    className={`rounded-2xl border p-5 shadow-xs transition ${
                      isMaint
                        ? "border-[#d9b66b] bg-[#fdfaf3]"
                        : "border-[#e5e8e0] bg-white hover:border-[#244b38]"
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="font-serif text-xl font-bold text-[#20251f]">
                          {table.table_number}
                        </span>
                        <p className="text-xs text-[#777d73]">Seats {table.capacity} guests</p>
                      </div>
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase ${
                          isMaint
                            ? "bg-[#ecdcb4] text-[#825e1a]"
                            : "bg-[#e9eee6] text-[#244b38]"
                        }`}
                      >
                        {isMaint ? "In Maintenance" : "Operational"}
                      </span>
                    </div>

                    <div className="mt-4 rounded-xl bg-[#faf9f5] p-3 border border-[#eeece4] text-xs">
                      <p className="text-[#555d52]">
                        Active Bookings: <strong>{affectedCount}</strong>
                      </p>
                      <p className="mt-0.5 text-[10px] text-[#85877e]">
                        {isMaint
                          ? "Table offline. Bookings were reassigned."
                          : affectedCount > 0
                          ? "Turning off table will trigger Seating Recovery preview."
                          : "No active bookings currently assigned."}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleToggleMaintenance(table)}
                      className={`mt-4 w-full rounded-xl py-2 text-xs font-bold transition shadow-xs ${
                        isMaint
                          ? "bg-[#244b38] text-white hover:bg-[#183727]"
                          : "border border-[#d9b66b] bg-[#fbf6ea] text-[#8c6b32] hover:bg-[#f5ecdb]"
                      }`}
                    >
                      {isMaint ? "Restore Table to Active Service" : "Set Maintenance & Recover Seating"}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 4: POLICIES */}
        {activeTab === "policies" && (
          <div className="mt-8 max-w-2xl rounded-[26px] border border-[#e5e3da] bg-white p-6 shadow-xs sm:p-8">
            <div className="flex items-center justify-between border-b border-[#eeeae2] pb-4">
              <div>
                <h2 className="font-serif text-2xl font-medium tracking-tight text-[#20251f]">
                  Restaurant Booking Policies
                </h2>
                <p className="text-xs text-[#777d73]">
                  Configuring policies protects your tables and automatically bumps policy versioning.
                </p>
              </div>
              <span className="rounded-full bg-[#e9eee6] px-3 py-1 text-xs font-bold text-[#244b38]">
                Current: v{selectedRestaurant?.policy_version || 1}
              </span>
            </div>

            <form onSubmit={handleSavePolicies} className="mt-6 space-y-5">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-semibold text-[#454c41]">
                    Cancellation Notice (Hours)
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={72}
                    value={policyForm.cancellation_hours}
                    onChange={(e) =>
                      setPolicyForm({ ...policyForm, cancellation_hours: Number(e.target.value) })
                    }
                    required
                    className="mt-1.5 h-11 w-full rounded-xl border border-[#e0e3da] px-3.5 text-xs font-medium outline-none focus:border-[#244b38]"
                  />
                  <p className="mt-1 text-[10px] text-[#8c9186]">Minimum hours before booking for free cancellation.</p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#454c41]">
                    Table Hold Grace Period (Minutes)
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={60}
                    value={policyForm.late_arrival_minutes}
                    onChange={(e) =>
                      setPolicyForm({ ...policyForm, late_arrival_minutes: Number(e.target.value) })
                    }
                    required
                    className="mt-1.5 h-11 w-full rounded-xl border border-[#e0e3da] px-3.5 text-xs font-medium outline-none focus:border-[#244b38]"
                  />
                  <p className="mt-1 text-[10px] text-[#8c9186]">Minutes table is held before release.</p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#454c41]">
                    Dining Duration (Minutes)
                  </label>
                  <input
                    type="number"
                    min={30}
                    max={240}
                    value={policyForm.reservation_duration_minutes}
                    onChange={(e) =>
                      setPolicyForm({
                        ...policyForm,
                        reservation_duration_minutes: Number(e.target.value),
                      })
                    }
                    required
                    className="mt-1.5 h-11 w-full rounded-xl border border-[#e0e3da] px-3.5 text-xs font-medium outline-none focus:border-[#244b38]"
                  />
                  <p className="mt-1 text-[10px] text-[#8c9186]">Standard allocated slot per booking.</p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#454c41]">
                    Maximum Online Party Size
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={30}
                    value={policyForm.max_party_size}
                    onChange={(e) =>
                      setPolicyForm({ ...policyForm, max_party_size: Number(e.target.value) })
                    }
                    required
                    className="mt-1.5 h-11 w-full rounded-xl border border-[#e0e3da] px-3.5 text-xs font-medium outline-none focus:border-[#244b38]"
                  />
                  <p className="mt-1 text-[10px] text-[#8c9186]">Max guests permitted in online booking flow.</p>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#454c41]">
                  Custom Policy Terms &amp; Dining Guidelines
                </label>
                <textarea
                  rows={4}
                  value={policyForm.policy_terms}
                  onChange={(e) => setPolicyForm({ ...policyForm, policy_terms: e.target.value })}
                  placeholder="Dress code, dietary guidelines, or special booking instructions..."
                  className="mt-1.5 w-full rounded-xl border border-[#e0e3da] p-3.5 text-xs font-medium outline-none focus:border-[#244b38]"
                />
              </div>

              <button
                type="submit"
                disabled={isSavingPolicies}
                className="inline-flex min-h-11 items-center justify-center rounded-full bg-[#244b38] px-8 text-xs font-bold text-white shadow-xs hover:bg-[#183727] disabled:opacity-50"
              >
                {isSavingPolicies ? "Saving Policies..." : "Save Policies & Bump Version"}
              </button>
            </form>
          </div>
        )}
      </div>

      {/* MODAL: SINGLE RESERVATION REASSIGNMENT */}
      {reassignModalOpen && targetReservation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-[26px] border border-[#e5e3da] bg-white p-6 shadow-2xl">
            <h3 className="font-serif text-2xl font-bold text-[#20251f]">Reassign Table</h3>
            <p className="mt-1 text-xs text-[#777d73]">
              Move <strong>{targetReservation.customer_name}</strong> (Party of {targetReservation.guest_count}) to a new table.
            </p>

            <div className="mt-4 space-y-3">
              <div>
                <label className="block text-xs font-semibold text-[#454c41]">Select Available Table</label>
                <select
                  value={newTableId || ""}
                  onChange={(e) => setNewTableId(Number(e.target.value))}
                  className="mt-1 h-11 w-full rounded-xl border border-[#e0e3da] px-3.5 text-xs font-semibold"
                >
                  <option value="">-- Choose Alternative Table --</option>
                  {tables
                    .filter(
                      (t) =>
                        t.id !== targetReservation.table_id &&
                        t.is_active &&
                        t.status !== "maintenance" &&
                        t.capacity >= targetReservation.guest_count
                    )
                    .map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.table_number} (Capacity: {t.capacity} guests)
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#454c41]">Reassignment Reason</label>
                <input
                  type="text"
                  placeholder="e.g. Guest requested window view, maintenance relocation"
                  value={reassignReason}
                  onChange={(e) => setReassignReason(e.target.value)}
                  className="mt-1 h-11 w-full rounded-xl border border-[#e0e3da] px-3.5 text-xs"
                />
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setReassignModalOpen(false)}
                className="rounded-full border border-[#d9ddd4] px-4 py-2 text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={!newTableId || isReassigning}
                onClick={handleExecuteReassignment}
                className="rounded-full bg-[#244b38] px-6 py-2 text-xs font-bold text-white hover:bg-[#183727] disabled:opacity-50"
              >
                {isReassigning ? "Reassigning..." : "Confirm Reassignment"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: SEATING RECOVERY WORKFLOW */}
      {recoveryModalOpen && recoverySourceTable && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="w-full max-w-2xl rounded-[28px] border border-[#e5e3da] bg-white p-7 shadow-2xl">
            <div className="flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#ecdcb4] text-xs font-bold text-[#825e1a]">
                ⚙️
              </span>
              <h3 className="font-serif text-2xl font-bold text-[#20251f]">
                Seating Recovery: {recoverySourceTable.table_number}
              </h3>
            </div>
            <p className="mt-1.5 text-xs text-[#777d73]">
              Previewing atomic table reallocations for all reservations booked on {recoverySourceTable.table_number}.
            </p>

            {isCheckingRecovery ? (
              <div className="py-12 text-center text-xs text-[#777d73]">
                Calculating optimal conflict-free tables...
              </div>
            ) : proposedMoves.length === 0 ? (
              <div className="mt-6 rounded-2xl border border-[#c4dec4] bg-[#f1f9f1] p-6 text-center">
                <p className="text-sm font-bold text-[#244b38]">Zero Bookings Affected</p>
                <p className="mt-1 text-xs text-[#555d52]">
                  Table {recoverySourceTable.table_number} currently has no pending or confirmed bookings. It can be safely placed into maintenance immediately.
                </p>
              </div>
            ) : (
              <div className="mt-5 space-y-3 max-h-[350px] overflow-y-auto">
                {proposedMoves.map((move) => (
                  <div
                    key={move.reservation_id}
                    className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#e8ebe3] bg-[#fafaf7] p-3.5 text-xs"
                  >
                    <div>
                      <p className="font-serif font-bold text-[#20251f]">
                        {move.customer_name} ({move.guest_count} guests)
                      </p>
                      <p className="text-[11px] text-[#777d73]">
                        {formatDate(move.start_time)} · {formatTime(move.start_time)} · Ref: {move.booking_reference}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-bold text-[#85877e]">Reassign to:</span>
                      <select
                        value={manualMoveMap[move.reservation_id] || ""}
                        onChange={(e) =>
                          setManualMoveMap({
                            ...manualMoveMap,
                            [move.reservation_id]: Number(e.target.value),
                          })
                        }
                        className="rounded-lg border border-[#d9ddd4] bg-white px-3 py-1 text-xs font-bold text-[#244b38]"
                      >
                        {tables
                          .filter(
                            (t) =>
                              t.id !== recoverySourceTable.id &&
                              t.is_active &&
                              t.status !== "maintenance" &&
                              t.capacity >= move.guest_count
                          )
                          .map((t) => (
                            <option key={t.id} value={t.id}>
                              {t.table_number} (Cap {t.capacity})
                            </option>
                          ))}
                      </select>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-[#eeeae2] pt-4">
              <span className="text-[11px] text-[#85877e]">
                {proposedMoves.length} reservations will be updated atomically.
              </span>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setRecoveryModalOpen(false)}
                  className="rounded-full border border-[#d9ddd4] px-4 py-2 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={isApplyingRecovery}
                  onClick={handleApplySeatingRecovery}
                  className="rounded-full bg-[#244b38] px-6 py-2 text-xs font-bold text-white hover:bg-[#183727] disabled:opacity-50"
                >
                  {isApplyingRecovery ? "Applying Recovery..." : "Confirm & Place in Maintenance"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: ASSIGNMENT HISTORY AUDIT */}
      {historyModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-[26px] border border-[#e5e3da] bg-white p-6 shadow-2xl">
            <h3 className="font-serif text-2xl font-bold text-[#20251f]">
              Assignment Audit Trail
            </h3>
            <p className="mt-1 text-xs text-[#777d73]">
              Audit history for Reservation <strong>{historyReservationRef}</strong>.
            </p>

            <div className="mt-4 max-h-[300px] overflow-y-auto space-y-3">
              {reservationHistory.length === 0 ? (
                <p className="py-6 text-center text-xs text-[#777d73]">No reassignments recorded.</p>
              ) : (
                reservationHistory.map((hist) => (
                  <div key={hist.id} className="rounded-xl border border-[#eeeae2] bg-[#fbfbf9] p-3 text-xs">
                    <p className="font-bold text-[#20251f]">
                      Table #{hist.previous_table_id || "Initial"} → Table #{hist.new_table_id}
                    </p>
                    <p className="mt-0.5 text-[11px] text-[#777d73]">Reason: {hist.reason || "None specified"}</p>
                    <p className="mt-1 text-[10px] text-[#8c9186]">{formatDate(hist.created_at)} at {formatTime(hist.created_at)}</p>
                  </div>
                ))
              )}
            </div>

            <div className="mt-5 flex justify-end">
              <button
                type="button"
                onClick={() => setHistoryModalOpen(false)}
                className="rounded-full bg-[#244b38] px-5 py-2 text-xs font-bold text-white hover:bg-[#183727]"
              >
                Close Audit
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
