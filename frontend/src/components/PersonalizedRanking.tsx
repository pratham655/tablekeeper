"use client";

import { useMemo, useState } from "react";
import Link from "next/link";

type Restaurant = {
  id: number;
  name: string;
  cuisine: string;
  location: string;
  rating: number;
  reviews: number;
  price: string;
  image: string;
  tags: string[];
};

type Preference =
  | "balanced"
  | "vegetarian"
  | "date-night"
  | "budget"
  | "top-rated";

const preferences: { id: Preference; label: string; description: string }[] = [
  {
    id: "balanced",
    label: "For me",
    description: "A balanced mix of guest ratings, unique experiences, and cuisine variety.",
  },
  {
    id: "vegetarian",
    label: "Vegetarian",
    description: "Places featuring vegetarian options or dedicated multi-cuisine vegetarian menus.",
  },
  {
    id: "date-night",
    label: "Date night",
    description: "Restaurants curated for intimate dining, romantic ambience, or rooftop views.",
  },
  {
    id: "budget",
    label: "Budget-friendly",
    description: "Casual and inviting neighbourhood spots with accessible price points.",
  },
  {
    id: "top-rated",
    label: "Top rated",
    description: "Highest rated dining experiences across our curated Bengaluru collection.",
  },
];

function scoreRestaurant(r: Restaurant, preference: Preference) {
  const tags = r.tags.join(" ").toLowerCase();
  const cuisine = r.cuisine.toLowerCase();
  const priceLevel = (r.price.match(/₹/g) || []).length;
  let score = r.rating > 0 ? r.rating * 10 : 0;
  let reason =
    r.rating > 0
      ? `Rated ${r.rating.toFixed(1)} ★ from ${r.reviews} guest reviews`
      : "Curated dining experience";

  if (preference === "vegetarian") {
    const match =
      tags.includes("vegetarian") ||
      cuisine.includes("vegetarian") ||
      r.name.toLowerCase() === "druma";
    score = (match ? 100 : 0) + score * 0.1;
    reason = match
      ? "Tagged for vegetarian dining or multi-cuisine menu"
      : "Standard menu selection in current demo";
  } else if (preference === "date-night") {
    const match = /romantic|fine dining|premium|rooftop/.test(tags);
    score = (match ? 80 : 0) + score;
    reason = match
      ? "Matches romantic, rooftop, or fine-dining tags"
      : reason;
  } else if (preference === "budget") {
    score = priceLevel ? (5 - priceLevel) * 20 + (r.rating || 0) : 15;
    reason = priceLevel
      ? `Accessible price tier (${r.price})`
      : "Casual dining option";
  } else if (preference === "top-rated") {
    score = r.rating > 0 ? r.rating * 20 : -1;
    reason =
      r.rating > 0
        ? `Top guest rating (${r.rating.toFixed(1)} ★)`
        : "Listed without formal rating";
  }
  return { score, reason };
}

export default function PersonalizedRanking({
  restaurants,
}: {
  restaurants: Restaurant[];
}) {
  const [preference, setPreference] = useState<Preference>("balanced");
  const active = preferences.find((p) => p.id === preference)!;

  const ranked = useMemo(
    () =>
      restaurants
        .map((restaurant) => ({
          restaurant,
          ...scoreRestaurant(restaurant, preference),
        }))
        .sort(
          (a, b) =>
            b.score - a.score ||
            a.restaurant.name.localeCompare(b.restaurant.name)
        ),
    [restaurants, preference]
  );

  return (
    <div
      className="overflow-hidden rounded-[26px] border border-[#e2e6dc] bg-white p-5 shadow-[0_12px_40px_rgba(31,49,34,0.05)] sm:p-8"
      aria-labelledby="personalized-ranking-title"
    >
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-[#d9b66b]/40 bg-[#fbf8f0] px-3 py-1 text-[10px] font-bold uppercase tracking-[1.6px] text-[#8c6b32]">
            <span className="h-1.5 w-1.5 rounded-full bg-[#d9b66b]" />
            Personalised Dining Edit
          </div>
          <h2
            id="personalized-ranking-title"
            className="mt-3 font-serif text-2xl tracking-tight text-[#20251f] sm:text-3xl"
          >
            Recommended for your occasion
          </h2>
          <p className="mt-1.5 max-w-xl text-xs leading-relaxed text-[#777d73]">
            Select your dining preference to instantly reorder restaurants based on curated attributes.
          </p>
        </div>

        <span className="w-fit rounded-full bg-[#e9eee6] px-3.5 py-1.5 text-[10px] font-bold uppercase tracking-wider text-[#244b38]">
          Demo Engine
        </span>
      </div>

      {/* Preference buttons */}
      <div
        className="mt-6 flex gap-2 overflow-x-auto pb-2"
        role="group"
        aria-label="Recommendation preference"
      >
        {preferences.map((p) => (
          <button
            key={p.id}
            type="button"
            onClick={() => setPreference(p.id)}
            aria-pressed={preference === p.id}
            className={`shrink-0 rounded-full border px-4 py-2.5 text-xs font-semibold transition ${
              preference === p.id
                ? "border-[#244b38] bg-[#244b38] text-white shadow-xs"
                : "border-[#e5e3da] bg-[#fafaf7] text-[#555d52] hover:border-[#244b38] hover:bg-white hover:text-[#244b38]"
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>

      <p className="mt-2 text-xs text-[#777d73]" aria-live="polite">
        {active.description}
      </p>

      {ranked.length === 0 ? (
        <div className="mt-6 rounded-2xl border border-dashed border-[#dcded4] bg-[#f8f7f2] p-8 text-center text-sm text-[#777d73]">
          No restaurants match your current filters. Clear filters above to see recommendations.
        </div>
      ) : (
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          {ranked.slice(0, 4).map(({ restaurant: r, reason }, index) => (
            <article
              key={r.id}
              className="group flex min-w-0 gap-4 rounded-2xl border border-[#e8ebe3] bg-[#fdfdfb] p-3.5 transition duration-200 hover:-translate-y-0.5 hover:border-[#cbd5c9] hover:bg-white hover:shadow-[0_10px_28px_rgba(30,45,32,0.06)]"
            >
              <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-xl bg-[#eef0e8] sm:h-28 sm:w-28">
                <img
                  src={r.image}
                  alt={r.name}
                  loading="lazy"
                  className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                />
                <span className="absolute left-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-white/95 text-[10px] font-bold text-[#244b38] shadow-xs backdrop-blur-xs">
                  #{index + 1}
                </span>
              </div>

              <div className="flex min-w-0 flex-1 flex-col justify-between py-0.5">
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="truncate font-serif text-lg font-medium text-[#20251f]">
                      {r.name}
                    </h3>
                    {r.rating > 0 && (
                      <span className="shrink-0 rounded-md bg-[#fdf8ee] px-2 py-0.5 text-[10px] font-bold text-[#8c6b32]">
                        ★ {r.rating.toFixed(1)}
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-[11px] text-[#85877e]">
                    {r.cuisine} <span className="mx-1">·</span> {r.location.split(",")[0]}
                    {r.price !== "—" ? ` · ${r.price}` : ""}
                  </p>
                  <p className="mt-1.5 line-clamp-2 text-[11px] leading-relaxed text-[#666d62]">
                    {reason}
                  </p>
                </div>

                <Link
                  href={`/restaurants/${r.id}`}
                  className="mt-2 inline-flex items-center gap-1 text-[11px] font-bold text-[#244b38] transition hover:text-[#183727] hover:underline"
                >
                  View restaurant
                  <span aria-hidden="true" className="transition-transform group-hover:translate-x-0.5">
                    →
                  </span>
                </Link>
              </div>
            </article>
          ))}
        </div>
      )}

      <p className="mt-4 text-[10px] leading-relaxed text-[#92958c]">
        Curated ranking uses static tags, price indicators, and guest reviews to assist discovery.
      </p>
    </div>
  );
}
