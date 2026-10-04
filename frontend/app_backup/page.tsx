"use client";

import { useMemo, useState } from "react";

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

const restaurants: Restaurant[] = [
  {
    id: 1,
    name: "The Olive Table",
    cuisine: "Mediterranean",
    location: "Indiranagar, Bengaluru",
    rating: 4.8,
    reviews: 328,
    price: "₹₹₹",
    image:
      "https://images.unsplash.com/photo-1515003197210-e0cd71810b5f?auto=format&fit=crop&w=1200&q=80",
    tags: ["Romantic", "Fine Dining"],
  },
  {
    id: 2,
    name: "Spice Route",
    cuisine: "Indian",
    location: "Koramangala, Bengaluru",
    rating: 4.7,
    reviews: 512,
    price: "₹₹",
    image:
      "https://images.unsplash.com/photo-1585937421612-70a008356fbe?auto=format&fit=crop&w=1200&q=80",
    tags: ["Popular", "Family"],
  },
  {
    id: 3,
    name: "Sakura House",
    cuisine: "Japanese",
    location: "MG Road, Bengaluru",
    rating: 4.9,
    reviews: 241,
    price: "₹₹₹₹",
    image:
      "https://images.unsplash.com/photo-1579871494447-9811cf80d66c?auto=format&fit=crop&w=1200&q=80",
    tags: ["Sushi", "Premium"],
  },
  {
    id: 4,
    name: "Casa Verde",
    cuisine: "Italian",
    location: "Whitefield, Bengaluru",
    rating: 4.6,
    reviews: 186,
    price: "₹₹₹",
    image:
      "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=1200&q=80",
    tags: ["Pizza", "Casual"],
  },
  {
    id: 5,
    name: "The Terrace",
    cuisine: "Continental",
    location: "HSR Layout, Bengaluru",
    rating: 4.7,
    reviews: 274,
    price: "₹₹₹",
    image:
      "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1200&q=80",
    tags: ["Rooftop", "Dinner"],
  },
  {
    id: 6,
    name: "Chai & Co.",
    cuisine: "Indian",
    location: "Jayanagar, Bengaluru",
    rating: 4.5,
    reviews: 398,
    price: "₹₹",
    image:
      "https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=1200&q=80",
    tags: ["Casual", "Tea"],
  },
];

const cuisines = [
  "All",
  "Indian",
  "Italian",
  "Japanese",
  "Mediterranean",
  "Continental",
];

export default function Home() {
  const [selectedCuisine, setSelectedCuisine] = useState("All");
  const [search, setSearch] = useState("");
  const [location, setLocation] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  const filteredRestaurants = useMemo(() => {
    return restaurants.filter((restaurant) => {
      const matchesCuisine =
        selectedCuisine === "All" ||
        restaurant.cuisine === selectedCuisine;

      const searchText = search.toLowerCase().trim();

      const matchesSearch =
        searchText === "" ||
        restaurant.name.toLowerCase().includes(searchText) ||
        restaurant.cuisine.toLowerCase().includes(searchText) ||
        restaurant.location.toLowerCase().includes(searchText);

      const matchesLocation =
        location.trim() === "" ||
        restaurant.location
          .toLowerCase()
          .includes(location.toLowerCase().trim());

      return matchesCuisine && matchesSearch && matchesLocation;
    });
  }, [selectedCuisine, search, location]);

  return (
    <main className="min-h-screen bg-[#faf9f7] text-[#1d1d1b]">
      {/* NAVBAR */}
      <header className="sticky top-0 z-50 border-b border-black/5 bg-white/90 backdrop-blur-xl">
        <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-5 sm:px-8 lg:px-10">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#1f3d2b] text-xl text-white">
              T
            </div>

            <div>
              <h1 className="text-xl font-bold tracking-tight">
                Tablekeeper
              </h1>

              <p className="hidden text-[10px] font-medium uppercase tracking-[0.22em] text-black/45 sm:block">
                Restaurant Reservations
              </p>
            </div>
          </div>

          <nav className="hidden items-center gap-8 md:flex">
            <a
              href="#restaurants"
              className="text-sm font-medium text-black/65 transition hover:text-[#1f3d2b]"
            >
              Discover
            </a>

            <a
              href="#how-it-works"
              className="text-sm font-medium text-black/65 transition hover:text-[#1f3d2b]"
            >
              How it works
            </a>

            <a
              href="/reservations"
              className="rounded-full border border-black/10 bg-white px-5 py-2.5 text-sm font-semibold transition hover:border-[#1f3d2b] hover:text-[#1f3d2b]"
            >
              My reservations
            </a>
          </nav>

          <a
            href="/reservations"
            className="rounded-full bg-[#1f3d2b] px-4 py-2.5 text-sm font-semibold text-white md:hidden"
          >
            Reservations
          </a>
        </div>
      </header>

      {/* HERO */}
      <section className="relative overflow-hidden bg-[#1f3d2b]">
        <div className="absolute -right-32 -top-32 h-80 w-80 rounded-full bg-white/5 blur-3xl" />
        <div className="absolute -bottom-40 -left-20 h-96 w-96 rounded-full bg-black/10 blur-3xl" />

        <div className="relative mx-auto max-w-7xl px-5 py-20 sm:px-8 lg:px-10 lg:py-28">
          <div className="max-w-3xl">
            <p className="mb-5 text-sm font-semibold uppercase tracking-[0.25em] text-white/60">
              Reserve with confidence
            </p>

            <h2 className="text-4xl font-bold leading-[1.05] tracking-tight text-white sm:text-5xl lg:text-7xl">
              Your table,
              <br />
              <span className="text-white/65">your time.</span>
            </h2>

            <p className="mt-6 max-w-xl text-base leading-7 text-white/65 sm:text-lg">
              Discover restaurants, check real availability, and reserve your
              table in just a few moments.
            </p>
          </div>

          {/* SEARCH BOX */}
          <div className="mt-12 rounded-3xl bg-white p-3 shadow-2xl shadow-black/20">
            <div className="grid gap-2 lg:grid-cols-[1.5fr_1fr_auto]">
              <div className="flex items-center gap-3 rounded-2xl bg-[#f5f4f1] px-5 py-4">
                <svg
                  className="h-5 w-5 shrink-0 text-black/40"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="m21 21-4.35-4.35m2.35-5.65a8 8 0 1 1-16 0 8 8 0 0 1 16 0Z"
                  />
                </svg>

                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Restaurant, cuisine or keyword"
                  className="w-full bg-transparent text-sm outline-none placeholder:text-black/35"
                />
              </div>

              <div className="flex items-center gap-3 rounded-2xl bg-[#f5f4f1] px-5 py-4">
                <svg
                  className="h-5 w-5 shrink-0 text-black/40"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M12 21s7-4.35 7-10a7 7 0 1 0-14 0c0 5.65 7 10 7 10Z"
                  />
                  <circle cx="12" cy="11" r="2.5" />
                </svg>

                <input
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="Location"
                  className="w-full bg-transparent text-sm outline-none placeholder:text-black/35"
                />
              </div>

              <button
                onClick={() => {
                  document
                    .getElementById("restaurants")
                    ?.scrollIntoView({ behavior: "smooth" });
                }}
                className="rounded-2xl bg-[#1f3d2b] px-8 py-4 text-sm font-bold text-white transition hover:bg-[#173020]"
              >
                Find a table
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* CUISINE FILTER */}
      <section className="mx-auto max-w-7xl px-5 pt-12 sm:px-8 lg:px-10">
        <div className="flex items-center justify-between gap-5">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-black/40">
              Explore
            </p>

            <h3 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">
              Browse by cuisine
            </h3>
          </div>

          <button
            onClick={() => setShowFilters(!showFilters)}
            className="rounded-full border border-black/10 bg-white px-4 py-2 text-sm font-semibold md:hidden"
          >
            {showFilters ? "Hide" : "Filters"}
          </button>
        </div>

        <div
          className={`mt-7 flex flex-wrap gap-2 ${
            showFilters ? "flex" : "hidden md:flex"
          }`}
        >
          {cuisines.map((cuisine) => (
            <button
              key={cuisine}
              onClick={() => setSelectedCuisine(cuisine)}
              className={`rounded-full px-5 py-2.5 text-sm font-semibold transition ${
                selectedCuisine === cuisine
                  ? "bg-[#1f3d2b] text-white"
                  : "border border-black/10 bg-white text-black/60 hover:border-[#1f3d2b] hover:text-[#1f3d2b]"
              }`}
            >
              {cuisine}
            </button>
          ))}
        </div>
      </section>

      {/* RESTAURANTS */}
      <section
        id="restaurants"
        className="mx-auto max-w-7xl px-5 py-14 sm:px-8 lg:px-10"
      >
        <div className="flex items-end justify-between gap-5">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-black/40">
              Handpicked for you
            </p>

            <h3 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">
              Restaurants worth reserving
            </h3>
          </div>

          <p className="hidden text-sm text-black/45 sm:block">
            {filteredRestaurants.length} restaurants
          </p>
        </div>

        {filteredRestaurants.length === 0 ? (
          <div className="mt-10 rounded-3xl border border-dashed border-black/15 bg-white px-6 py-20 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#f1f0ec] text-2xl">
              🔎
            </div>

            <h4 className="mt-5 text-lg font-bold">
              No restaurants found
            </h4>

            <p className="mt-2 text-sm text-black/45">
              Try another restaurant, cuisine or location.
            </p>

            <button
              onClick={() => {
                setSearch("");
                setLocation("");
                setSelectedCuisine("All");
              }}
              className="mt-6 rounded-full bg-[#1f3d2b] px-5 py-2.5 text-sm font-semibold text-white"
            >
              Clear filters
            </button>
          </div>
        ) : (
          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filteredRestaurants.map((restaurant) => (
              <article
                key={restaurant.id}
                className="group overflow-hidden rounded-3xl border border-black/5 bg-white shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-xl"
              >
                <div className="relative h-56 overflow-hidden">
                  <img
                    src={restaurant.image}
                    alt={restaurant.name}
                    className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                  />

                  <div className="absolute left-4 top-4 flex flex-wrap gap-2">
                    {restaurant.tags.map((tag) => (
                      <span
                        key={tag}
                        className="rounded-full bg-white/90 px-3 py-1 text-[11px] font-bold text-black/70 backdrop-blur-sm"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>

                  <div className="absolute bottom-4 right-4 rounded-full bg-white px-3 py-1.5 text-xs font-bold shadow-lg">
                    ★ {restaurant.rating}
                  </div>
                </div>

                <div className="p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h4 className="text-lg font-bold">
                        {restaurant.name}
                      </h4>

                      <p className="mt-1 text-sm text-black/50">
                        {restaurant.cuisine} · {restaurant.price}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 flex items-center gap-2 text-sm text-black/50">
                    <svg
                      className="h-4 w-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M12 21s7-4.35 7-10a7 7 0 1 0-14 0c0 5.65 7 10 7 10Z"
                      />
                      <circle cx="12" cy="11" r="2.5" />
                    </svg>

                    {restaurant.location}
                  </div>

                  <div className="mt-2 text-xs text-black/35">
                    {restaurant.reviews} reviews
                  </div>

                  {/* CORRECTED: NAVIGATES TO RESTAURANT DETAILS */}
                  <a
                    href={`/restaurants/${restaurant.id}`}
                    className="mt-5 block w-full rounded-2xl border border-[#1f3d2b]/20 bg-[#1f3d2b]/5 py-3 text-center text-sm font-bold text-[#1f3d2b] transition hover:bg-[#1f3d2b] hover:text-white"
                  >
                    View restaurant
                  </a>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      {/* HOW IT WORKS */}
      <section
        id="how-it-works"
        className="border-y border-black/5 bg-white"
      >
        <div className="mx-auto max-w-7xl px-5 py-20 sm:px-8 lg:px-10">
          <div className="max-w-2xl">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-black/40">
              Simple by design
            </p>

            <h3 className="mt-2 text-3xl font-bold tracking-tight">
              From discovery to dinner.
            </h3>
          </div>

          <div className="mt-12 grid gap-5 md:grid-cols-3">
            {[
              {
                number: "01",
                title: "Discover",
                text: "Find restaurants based on cuisine, location and your preferences.",
              },
              {
                number: "02",
                title: "Check availability",
                text: "Choose your date, time and party size to see available options.",
              },
              {
                number: "03",
                title: "Reserve",
                text: "Confirm your table and keep track of your reservations in one place.",
              },
            ].map((item) => (
              <div
                key={item.number}
                className="rounded-3xl border border-black/5 bg-[#faf9f7] p-7"
              >
                <span className="text-sm font-bold text-[#1f3d2b]">
                  {item.number}
                </span>

                <h4 className="mt-8 text-xl font-bold">{item.title}</h4>

                <p className="mt-3 text-sm leading-6 text-black/50">
                  {item.text}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-[#1f3d2b] text-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-6 px-5 py-10 sm:px-8 lg:flex-row lg:items-center lg:justify-between lg:px-10">
          <div>
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white text-sm font-bold text-[#1f3d2b]">
                T
              </div>

              <span className="font-bold">Tablekeeper</span>
            </div>

            <p className="mt-3 text-xs text-white/45">
              Restaurant reservations, made simple.
            </p>
          </div>

          <p className="text-xs text-white/35">
            © 2026 Tablekeeper. All rights reserved.
          </p>
        </div>
      </footer>
    </main>
  );
}