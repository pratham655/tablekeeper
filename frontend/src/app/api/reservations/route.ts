
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

type ReservationRequest = {
  bookingReference?: string;
  restaurantId?: number | string;
  customerName?: string;
  email?: string;
  phone?: string;
  reservationDate?: string;
  reservationTime?: string;
  guests?: number;
  tableId?: string;
  tableSeats?: number;
  specialRequest?: string;
};

const isValidDate = (value: string) => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;

  const date = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(date.getTime()) &&
    date.toISOString().slice(0, 10) === value;
};

const isValidTime = (value: string) =>
  /^([01]\d|2[0-3]):[0-5]\d(?::[0-5]\d)?$/.test(value);

export async function POST(request: NextRequest) {
  if (!supabaseUrl || !supabaseKey) {
    return NextResponse.json(
      { error: "Supabase environment variables are missing." },
      { status: 500 }
    );
  }

  let body: ReservationRequest;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON request body." },
      { status: 400 }
    );
  }

  const bookingReference = body.bookingReference?.trim();
  const restaurantId = Number(body.restaurantId);
  const customerName = body.customerName?.trim();
  const email = body.email?.trim().toLowerCase();
  const phone = body.phone?.trim();
  const reservationDate = body.reservationDate;
  const reservationTime = body.reservationTime;
  const guests = Number(body.guests);
  const tableId = body.tableId?.trim() || null;
  const tableSeats =
    body.tableSeats == null ? null : Number(body.tableSeats);
  const specialRequest = body.specialRequest?.trim() || null;

  if (
    !bookingReference ||
    !/^TK-\d{8}$/.test(bookingReference) ||
    !Number.isSafeInteger(restaurantId) ||
    restaurantId < 1 ||
    !customerName ||
    customerName.length > 100 ||
    !email ||
    email.length > 254 ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ||
    !phone ||
    phone.length > 25 ||
    !reservationDate ||
    !isValidDate(reservationDate) ||
    !reservationTime ||
    !isValidTime(reservationTime) ||
    !Number.isInteger(guests) ||
    guests < 1 ||
    guests > 20 ||
    (tableSeats !== null &&
      (!Number.isInteger(tableSeats) || tableSeats < 1 || tableSeats > 20)) ||
    (specialRequest !== null && specialRequest.length > 500)
  ) {
    return NextResponse.json(
      { error: "Please provide valid reservation details." },
      { status: 400 }
    );
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  const { error } = await supabase.from("reservations").insert({
    booking_reference: bookingReference,
    user_id: null,
    restaurant_id: restaurantId,
    customer_name: customerName,
    email,
    phone,
    reservation_date: reservationDate,
    reservation_time: reservationTime,
    guests,
    table_id: tableId,
    table_seats: tableSeats,
    special_request: specialRequest,
    status: "Confirmed",
  });

  if (error) {
    console.error("Reservation insert failed:", error.message);

    if (error.code === "23505") {
      return NextResponse.json(
        { error: "This booking reference already exists." },
        { status: 409 }
      );
    }

    if (error.code === "23503") {
      return NextResponse.json(
        { error: "The selected restaurant does not exist." },
        { status: 400 }
      );
    }

    if (error.code === "42501") {
      return NextResponse.json(
        { error: "Reservation insert was not permitted by database policy." },
        { status: 403 }
      );
    }

    return NextResponse.json(
      { error: "Unable to save reservation." },
      { status: 500 }
    );
  }

  return NextResponse.json(
    {
      success: true,
      bookingReference,
      message: "Reservation saved successfully.",
    },
    { status: 201 }
  );
}