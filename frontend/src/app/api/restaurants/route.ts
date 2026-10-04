import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const API_URL = (
  process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000"
).replace(/\/+$/, "");

const fallbackImages: Record<string, string> = {
  "The Olive Table":
    "https://images.unsplash.com/photo-1515003197210-e0cd71810b5f?auto=format&fit=crop&w=1400&q=85",
  "Spice Route":
    "https://images.unsplash.com/photo-1585937421612-70a008356fbe?auto=format&fit=crop&w=1400&q=85",
  "Sakura House":
    "https://images.unsplash.com/photo-1579871494447-9811cf80d66c?auto=format&fit=crop&w=1400&q=85",
  "Casa Verde":
    "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=1400&q=85",
  "The Terrace":
    "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1400&q=85",
  "Chai & Co.":
    "https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=1400&q=85",
  "DRUMA":
    "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1400&q=85",
};

const ratingsMap: Record<string, { rating: number; reviews: number }> = {
  "The Olive Table": { rating: 4.8, reviews: 328 },
  "Spice Route": { rating: 4.7, reviews: 512 },
  "Sakura House": { rating: 4.9, reviews: 241 },
  "Casa Verde": { rating: 4.6, reviews: 186 },
  "The Terrace": { rating: 4.7, reviews: 274 },
  "Chai & Co.": { rating: 4.5, reviews: 398 },
  "DRUMA": { rating: 4.4, reviews: 126 },
};

export async function GET() {
  try {
    const res = await fetch(`${API_URL}/restaurants/`, {
      cache: "no-store",
      headers: {
        Accept: "application/json",
      },
    });

    if (!res.ok) {
      throw new Error(`FastAPI responded with status ${res.status}`);
    }

    const data = await res.json();

    const formatted = data.map((item: any) => {
      const stats = ratingsMap[item.name] || { rating: 4.5, reviews: 150 };
      const image =
        item.image_url ||
        fallbackImages[item.name] ||
        "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1400&q=85";

      return {
        id: item.id,
        name: item.name,
        cuisine: item.cuisine,
        location: item.address || `${item.city}`,
        city: item.city,
        rating: stats.rating,
        reviews: stats.reviews,
        price: item.price_range || "₹₹",
        image: image,
        description: item.description,
        address: item.address,
        phone: item.phone,
        cancellation_hours: item.cancellation_hours ?? 2,
        late_arrival_minutes: item.late_arrival_minutes ?? 15,
        reservation_duration_minutes: item.reservation_duration_minutes ?? 90,
        max_party_size: item.max_party_size ?? 10,
        policy_terms: item.policy_terms,
        policy_version: item.policy_version ?? 1,
      };
    });

    return NextResponse.json(formatted);
  } catch (error) {
    console.error("FastAPI restaurants fetch failed:", error);
    return NextResponse.json(
      { error: "Unable to load restaurants from Tablekeeper API." },
      { status: 502 }
    );
  }
}