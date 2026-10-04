"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { matchesNaturalSearch, parseNaturalSearch } from "../lib/naturalSearch";
import PersonalizedRanking from "../components/PersonalizedRanking";
import AIConcierge from "../components/AIConcierge";
import Navbar from "../components/Navbar";

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

// Shape returned by the API.
type ApiRestaurant = {
  id: number;
  name: string;
  description?: string;
  address?: string;
  city?: string;
  cuisine?: string;
  price_range?: string;
  image_url?: string;
  rating?: number;
  reviews?: number;
};

type RestaurantMapProps = {
  restaurants: Restaurant[];
};

const RestaurantMap = dynamic<RestaurantMapProps>(
  () => import("../components/RestaurantMap"),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-[480px] items-center justify-center rounded-[22px] bg-[#f1f2ec] text-sm text-[#777d73]">
        Loading restaurant map...
      </div>
    ),
  }
);

const restaurantTags: Record<number, string[]> = {
  1: ["Romantic", "Fine Dining"],
  2: ["Popular", "Family"],
  3: ["Sushi", "Premium"],
  4: ["Pizza", "Casual"],
  5: ["Rooftop", "Dinner"],
  6: ["Casual", "Tea"],
  7: ["Vegetarian", "Multi-cuisine"],
};

const cuisines = [
  "All",
  "Indian",
  "Italian",
  "Japanese",
  "Mediterranean",
  "Continental",
  "Multi-cuisine",
];

function SearchIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      className="h-5 w-5"
      stroke="currentColor"
      strokeWidth="1.8"
    >
      <circle cx="10.8" cy="10.8" r="6.8" />
      <path d="m16 16 4.5 4.5" strokeLinecap="round" />
    </svg>
  );
}

function PinIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      className="h-5 w-5"
      stroke="currentColor"
      strokeWidth="1.8"
    >
      <path
        d="M20 10c0 5-8 12-8 12S4 15 4 10a8 8 0 1 1 16 0Z"
        strokeLinejoin="round"
      />
      <circle cx="12" cy="10" r="2.5" />
    </svg>
  );
}

export default function Home() {
  const [selectedCuisine, setSelectedCuisine] = useState("All");
  const [search, setSearch] = useState("");
  const [location, setLocation] = useState("");
  const [viewMode, setViewMode] = useState<"list" | "map">("list");
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [restaurantsLoading, setRestaurantsLoading] = useState(true);
  const [restaurantsError, setRestaurantsError] = useState("");

  useEffect(() => {
    let isMounted = true;

    async function fetchRestaurants() {
      try {
        setRestaurantsLoading(true);
        setRestaurantsError("");

        const response = await fetch("/api/restaurants");
        if (!response.ok) {
          throw new Error("Failed to load restaurants.");
        }

        const data = (await response.json()) as ApiRestaurant[];

        const normalizedRestaurants: Restaurant[] = data.map((r) => ({
          id: r.id,
          name: r.name,
          cuisine: r.cuisine ?? "Multi-cuisine",
          location: r.address ?? r.city ?? "Bengaluru",
          price: r.price_range ?? "—",
          image: r.image_url ?? "/images/restaurant-placeholder.jpg",
          rating:
            typeof r.rating === "number" && Number.isFinite(r.rating)
              ? r.rating
              : 0,
          reviews: r.reviews ?? 0,
          tags: restaurantTags[r.id] ?? [],
        }));

        if (isMounted) {
          setRestaurants(normalizedRestaurants);
        }
      } catch (error) {
        console.error("Restaurant fetch error:", error);
        if (isMounted) {
          setRestaurantsError("Unable to load restaurants. Please try again.");
        }
      } finally {
        if (isMounted) {
          setRestaurantsLoading(false);
        }
      }
    }

    fetchRestaurants();
    return () => {
      isMounted = false;
    };
  }, []);

  const filteredRestaurants = useMemo(() => {
    const normalize = (value: string) =>
      value.toLowerCase().trim().replace(/\s+/g, " ");

    const intent = parseNaturalSearch(search);
    const locationText = normalize(location);

    return restaurants.filter((restaurant) => {
      const matchesCuisine =
        selectedCuisine === "All" ||
        restaurant.cuisine === selectedCuisine;

      const matchesSearch =
        !search.trim() || matchesNaturalSearch(restaurant, intent);

      const matchesLocation =
        !locationText ||
        normalize(restaurant.location).includes(locationText);

      return matchesCuisine && matchesSearch && matchesLocation;
    });
  }, [restaurants, selectedCuisine, search, location]);

  const searchIntent = useMemo(
    () => parseNaturalSearch(search),
    [search]
  );

  function clearFilters() {
    setSelectedCuisine("All");
    setSearch("");
    setLocation("");
  }

  function scrollToRestaurants() {
    document
      .getElementById("restaurants")
      ?.scrollIntoView({ behavior: "smooth" });
  }

  return (
    <main className="min-h-screen bg-[#f8f7f2] text-[#20251f]">
      {/* Navigation Header */}
      <Navbar />

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-[#244b38] text-white">
        <div className="pointer-events-none absolute -right-32 -top-44 h-[460px] w-[460px] rounded-full border border-white/[0.08]" />
        <div className="pointer-events-none absolute -right-12 -top-24 h-[300px] w-[300px] rounded-full border border-white/[0.08]" />
        <div className="pointer-events-none absolute -bottom-48 -left-32 h-[440px] w-[440px] rounded-full bg-[#173727]/70 blur-3xl" />

        <div className="container-shell relative grid gap-12 pb-20 pt-16 sm:pb-24 sm:pt-20 lg:grid-cols-[1.15fr_0.85fr] lg:items-center lg:gap-16 lg:pb-28 lg:pt-24">
          <div className="max-w-[680px]">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.08] px-3.5 py-1.5 shadow-xs backdrop-blur-xs">
              <span className="h-1.5 w-1.5 rounded-full bg-[#d9b66b]" />
              <span className="text-[10px] font-bold uppercase tracking-[2px] text-white/80">
                Curated Dining Experiences
              </span>
            </div>

            <h1 className="text-[46px] font-medium leading-[1.04] tracking-[-2px] sm:text-[64px] lg:text-[76px]">
              Make room for
              <br />
              <span className="font-editorial italic text-[#ded0b1]">
                something special.
              </span>
            </h1>

            <p className="mt-6 max-w-[460px] text-sm leading-relaxed text-white/70 sm:text-[15px]">
              Discover places worth gathering for. Reserve your next
              favourite table and enjoy memorable moments.
            </p>

            <button
              onClick={scrollToRestaurants}
              className="mt-8 inline-flex min-h-12 items-center gap-3 rounded-full bg-[#f4f1e8] px-6 text-xs font-bold text-[#244b38] shadow-md transition hover:-translate-y-0.5 hover:bg-white"
            >
              Explore restaurants
              <span aria-hidden="true" className="text-base font-normal">↗</span>
            </button>

            <div className="mt-12 flex flex-wrap items-center gap-x-8 gap-y-4 border-t border-white/15 pt-6">
              <div>
                <p className="text-xl font-semibold tracking-tight">Curated</p>
                <p className="mt-0.5 text-[10px] uppercase tracking-[1.5px] text-white/50">
                  Dining experiences
                </p>
              </div>
              <div className="h-8 w-px bg-white/20" />
              <div>
                <p className="text-xl font-semibold tracking-tight">Effortless</p>
                <p className="mt-0.5 text-[10px] uppercase tracking-[1.5px] text-white/50">
                  Table reservations
                </p>
              </div>
              <div className="h-8 w-px bg-white/20" />
              <div>
                <p className="text-xl font-semibold tracking-tight">Instant</p>
                <p className="mt-0.5 text-[10px] uppercase tracking-[1.5px] text-white/50">
                  Floor plan choice
                </p>
              </div>
            </div>
          </div>

          {/* Hero Visual Card */}
          <div className="mx-auto w-full max-w-[480px] lg:ml-auto">
            <div className="overflow-hidden rounded-[26px] border border-white/20 bg-[#345b45] shadow-[0_24px_65px_rgba(10,30,19,0.28)]">
              <div className="relative h-[320px] sm:h-[400px] lg:h-[450px]">
                <img
                  src="https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1400&q=85"
                  alt="An elegantly set restaurant dining table"
                  className="h-full w-full object-cover"
                  onError={(e) => {
                    e.currentTarget.style.display = "none";
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#10271c]/85 via-black/10 to-transparent" />

                <div className="absolute bottom-0 left-0 right-0 p-6 sm:p-7">
                  <p className="text-[10px] font-bold uppercase tracking-[2px] text-[#d9b66b]">
                    The art of dining
                  </p>
                  <div className="mt-2 flex items-end justify-between gap-4">
                    <p className="font-editorial text-2xl italic leading-tight text-white sm:text-[28px]">
                      A little more memorable.
                    </p>
                    <span className="mb-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/40 bg-white/15 text-lg text-white backdrop-blur-md">
                      ↗
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Sub-caption bar */}
            <div className="mt-3.5 flex items-center justify-between gap-4 rounded-2xl border border-white/15 bg-white/[0.08] px-5 py-3.5 backdrop-blur-xs">
              <div>
                <p className="text-[9px] font-bold uppercase tracking-[1.8px] text-white/60">
                  Your next gathering
                </p>
                <p className="mt-0.5 text-xs font-semibold text-white">
                  Starts with the right table.
                </p>
              </div>
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-[#d9b66b]/30 bg-[#d9b66b]/10 text-xs text-[#d9b66b]">
                ✳
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Search Panel */}
      <section className="container-shell relative z-10 -mt-2 pt-6 sm:pt-8">
        <div className="rounded-[24px] border border-[#e5e2d8] bg-white p-3.5 shadow-[0_16px_50px_rgba(31,49,34,0.08)] sm:p-4">
          <div className="grid gap-2.5 md:grid-cols-[1fr_0.75fr_auto] md:items-center">
            <label className="flex min-h-[56px] items-center gap-3 rounded-2xl bg-[#f8f8f4] px-4 transition focus-within:ring-2 focus-within:ring-[#244b38]/15">
              <span className="text-[#72786d]"><SearchIcon /></span>
              <span className="min-w-0 flex-1">
                <span className="mb-0.5 block text-[9px] font-bold uppercase tracking-[1.5px] text-[#777d73]">
                  Find your place
                </span>
                <input
                  type="search"
                  aria-label="Search restaurants by name, cuisine, neighbourhood or experience"
                  autoComplete="off"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Try “vegetarian in Jayanagar” or “date night”"
                  className="w-full bg-transparent text-xs text-[#20251f] outline-none placeholder:text-[#9ea197]"
                />
              </span>
            </label>

            <label className="flex min-h-[56px] items-center gap-3 rounded-2xl bg-[#f8f8f4] px-4 transition focus-within:ring-2 focus-within:ring-[#244b38]/15">
              <span className="text-[#72786d]"><PinIcon /></span>
              <span className="min-w-0 flex-1">
                <span className="mb-0.5 block text-[9px] font-bold uppercase tracking-[1.5px] text-[#777d73]">
                  Neighbourhood
                </span>
                <input
                  type="search"
                  aria-label="Filter restaurants by neighbourhood"
                  autoComplete="off"
                  value={location}
                  onChange={(event) => setLocation(event.target.value)}
                  placeholder="Where in Bengaluru?"
                  className="w-full bg-transparent text-xs text-[#20251f] outline-none placeholder:text-[#9ea197]"
                />
              </span>
            </label>

            <button
              onClick={scrollToRestaurants}
              className="flex min-h-[56px] items-center justify-center gap-2 rounded-2xl bg-[#244b38] px-7 text-xs font-bold text-white shadow-xs transition hover:bg-[#183727]"
            >
              <span>Find a table</span>
              <span aria-hidden="true">↗</span>
            </button>
          </div>
        </div>
      </section>

      {/* Natural Search Intent Chips */}
      {search.trim() && (
        <div className="container-shell pt-3.5">
          <p className="flex flex-wrap items-center gap-2 text-xs text-[#6e756a]" aria-live="polite">
            <span className="font-semibold text-[#20251f]">Filtered by:</span>
            {searchIntent.vegetarian && (
              <span className="rounded-full bg-[#e9eee6] px-2.5 py-0.5 text-[10px] font-bold text-[#244b38]">
                Vegetarian
              </span>
            )}
            {searchIntent.cuisine && (
              <span className="rounded-full bg-[#fbf6ea] px-2.5 py-0.5 text-[10px] font-bold text-[#8c6b32]">
                {searchIntent.cuisine}
              </span>
            )}
            {searchIntent.location && (
              <span className="rounded-full bg-[#edf1ed] px-2.5 py-0.5 text-[10px] font-bold text-[#35523e]">
                {searchIntent.location}
              </span>
            )}
            {searchIntent.budgetFriendly && (
              <span className="rounded-full bg-[#f2f4ec] px-2.5 py-0.5 text-[10px] font-bold text-[#44664d]">
                Budget-friendly
              </span>
            )}
          </p>
        </div>
      )}

      {/* Cuisine Filter Pills */}
      <section className="container-shell pt-14 sm:pt-18">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[2px] text-[#858b7e]">
              A world of flavours
            </p>
            <h2 className="mt-1 font-serif text-3xl tracking-tight text-[#20251f] sm:text-4xl">
              Explore by cuisine
            </h2>
          </div>
          <p className="max-w-[320px] text-xs leading-relaxed text-[#777d73]">
            From regional favourites to international dining, find a place
            that matches your appetite.
          </p>
        </div>

        <div className="mt-6 flex gap-2 overflow-x-auto pb-2">
          {cuisines.map((cuisine) => {
            const active = selectedCuisine === cuisine;
            return (
              <button
                key={cuisine}
                onClick={() => setSelectedCuisine(cuisine)}
                aria-pressed={active}
                className={`shrink-0 rounded-full border px-5 py-2.5 text-xs font-semibold transition ${
                  active
                    ? "border-[#244b38] bg-[#244b38] text-white shadow-xs"
                    : "border-[#e5e3da] bg-white text-[#575e53] hover:border-[#244b38] hover:text-[#244b38]"
                }`}
              >
                {cuisine}
              </button>
            );
          })}
        </div>
      </section>

      {/* Personalised Recommendations */}
      <section className="container-shell pt-8 sm:pt-10" aria-label="Personalised recommendations">
        <PersonalizedRanking restaurants={filteredRestaurants} />
      </section>

      {/* Restaurant Collection Grid */}
      <section id="restaurants" className="container-shell scroll-mt-24 pb-20 pt-10 sm:pb-24">
        <div className="flex flex-wrap items-end justify-between gap-4 border-b border-[#e5e3da] pb-5">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[2px] text-[#858b7e]">
              The Tablekeeper Edit
            </p>
            <h2 className="mt-1 font-serif text-3xl tracking-tight text-[#20251f] sm:text-4xl">
              Featured restaurants
            </h2>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <span className="text-xs font-medium text-[#777d73]">
              {filteredRestaurants.length}{" "}
              {filteredRestaurants.length === 1 ? "restaurant" : "restaurants"}
            </span>

            {/* View switcher */}
            <div
              className="inline-flex rounded-full border border-[#e5e3da] bg-white p-1 shadow-xs"
              aria-label="Restaurant view"
            >
              <button
                type="button"
                onClick={() => setViewMode("list")}
                aria-pressed={viewMode === "list"}
                className={`rounded-full px-4 py-1.5 text-xs font-semibold transition ${
                  viewMode === "list"
                    ? "bg-[#244b38] text-white shadow-xs"
                    : "text-[#686e65] hover:text-[#244b38]"
                }`}
              >
                List
              </button>
              <button
                type="button"
                onClick={() => setViewMode("map")}
                aria-pressed={viewMode === "map"}
                className={`rounded-full px-4 py-1.5 text-xs font-semibold transition ${
                  viewMode === "map"
                    ? "bg-[#244b38] text-white shadow-xs"
                    : "text-[#686e65] hover:text-[#244b38]"
                }`}
              >
                Map
              </button>
            </div>
          </div>
        </div>

        {/* Loading, error, empty state and restaurant results */}
        {restaurantsLoading ? (
          <div className="mt-8 rounded-[24px] bg-white px-5 py-16 text-center">
            <p className="text-sm text-[#777d73]">Loading restaurants...</p>
          </div>
        ) : restaurantsError ? (
          <div className="mt-8 rounded-[24px] border border-dashed border-[#d9d8cf] bg-white px-5 py-16 text-center">
            <p className="text-sm text-[#b42318]">{restaurantsError}</p>
            <button
              onClick={() => window.location.reload()}
              className="mt-5 rounded-full bg-[#244b38] px-6 py-2.5 text-xs font-semibold text-white"
            >
              Try again
            </button>
          </div>
        ) : filteredRestaurants.length === 0 ? (
          <div className="mt-8 rounded-[24px] border border-dashed border-[#d9d8cf] bg-white px-5 py-16 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#f1f2ec] text-2xl text-[#244b38]">
              <SearchIcon />
            </div>
            <h3 className="mt-4 font-serif text-2xl text-[#20251f]">
              No places found
            </h3>
            <p className="mt-1.5 text-xs text-[#85877e]">
              Try adjusting your search keywords or clearing your cuisine filters.
            </p>
            <button
              onClick={clearFilters}
              className="mt-6 rounded-full bg-[#244b38] px-6 py-2.5 text-xs font-semibold text-white shadow-xs transition hover:bg-[#183727]"
            >
              Clear all filters
            </button>
          </div>
        ) : viewMode === "map" ? (
          <div className="mt-8 overflow-hidden rounded-[24px] border border-[#e5e3da] bg-white p-2.5 shadow-[0_12px_40px_rgba(31,49,34,0.06)]">
            <RestaurantMap restaurants={filteredRestaurants} />
            <p className="px-4 pb-2 pt-3 text-[10px] leading-relaxed text-[#85877e]">
              Map pins indicate approximate neighbourhood areas in Bengaluru for exploration.
            </p>
          </div>
        ) : (
          <div className="mt-8 grid gap-x-7 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
            {filteredRestaurants.map((restaurant, index) => (
              <article
                key={restaurant.id}
                className="group interactive-card flex flex-col justify-between overflow-hidden rounded-[24px] border border-[#e6e8e0] bg-white shadow-[0_8px_25px_rgba(30,45,32,0.04)]"
              >
                <div>
                  <Link
                    href={`/restaurants/${restaurant.id}`}
                    aria-label={`View ${restaurant.name}`}
                    className="relative block aspect-[1.35/1] overflow-hidden bg-[#e8e8df]"
                  >
                    <img
                      src={restaurant.image}
                      alt={restaurant.name}
                      loading={index > 2 ? "lazy" : "eager"}
                      className="h-full w-full object-cover transition duration-700 ease-out group-hover:scale-[1.05]"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-black/10 opacity-70" />

                    {/* Tag Badges */}
                    <div className="absolute left-3.5 top-3.5 flex flex-wrap gap-1.5">
                      {restaurant.tags.slice(0, 2).map((tag) => (
                        <span
                          key={tag}
                          className="rounded-full border border-white/40 bg-white/90 px-2.5 py-1 text-[9px] font-bold tracking-wide text-[#2b332a] backdrop-blur-xs"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>

                    {/* Rating Badge */}
                    <span className="absolute right-3.5 top-3.5 flex items-center gap-1 rounded-full bg-white/95 px-2.5 py-1 text-[10px] font-bold text-[#20251f] shadow-xs backdrop-blur-xs">
                      <span className="text-[#b48a43]">★</span>{" "}
                      {restaurant.rating > 0
                        ? restaurant.rating.toFixed(1)
                        : "New"}
                    </span>

                    {/* Corner hover circle */}
                    <span className="absolute bottom-3.5 right-3.5 flex h-9 w-9 translate-y-2 items-center justify-center rounded-full bg-white text-base text-[#244b38] opacity-0 shadow-md transition duration-250 group-hover:translate-y-0 group-hover:opacity-100">
                      ↗
                    </span>
                  </Link>

                  <div className="p-5">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <Link
                          href={`/restaurants/${restaurant.id}`}
                          className="font-serif text-xl font-medium tracking-tight text-[#20251f] transition hover:text-[#244b38]"
                        >
                          {restaurant.name}
                        </Link>
                        <p className="mt-1 text-xs text-[#7d8376]">
                          {restaurant.cuisine} <span className="mx-1">·</span>{" "}
                          {restaurant.price}
                        </p>
                      </div>
                      <span className="shrink-0 pt-0.5 text-[10px] text-[#8c9186]">
                        {restaurant.reviews} reviews
                      </span>
                    </div>

                    <div className="mt-3 flex items-center gap-1.5 text-xs text-[#6e756a]">
                      <span className="text-[#8c9186]"><PinIcon /></span>
                      <span className="truncate">{restaurant.location}</span>
                    </div>
                  </div>
                </div>

                <div className="border-t border-[#eeece5] px-5 py-3.5">
                  <Link
                    href={`/restaurants/${restaurant.id}`}
                    className="flex items-center justify-between text-xs font-bold text-[#244b38] transition hover:text-[#183727]"
                  >
                    <span>View details &amp; reserve</span>
                    <span className="text-sm transition-transform group-hover:translate-x-1" aria-hidden="true">
                      →
                    </span>
                  </Link>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      {/* Brand Statement ("How it works") */}
      <section id="how-it-works" className="border-y border-[#e9e7df] bg-[#f2f1ea]">
        <div className="container-shell py-16 sm:py-20">
          <div className="mx-auto max-w-[650px] text-center">
            <p className="text-[10px] font-bold uppercase tracking-[2px] text-[#7d8478]">
              The Tablekeeper Standard
            </p>
            <h2 className="mt-3 font-serif text-3xl leading-tight tracking-tight sm:text-[42px]">
              Less planning. More{" "}
              <span className="font-editorial italic text-[#44664d]">being there.</span>
            </h2>
            <p className="mx-auto mt-4 max-w-[480px] text-xs leading-relaxed text-[#73796d] sm:text-sm">
              Discovering a table should feel as seamless as dining itself. Explore, select your seating, and look forward to memorable food.
            </p>
          </div>

          <div className="mt-12 grid gap-5 md:grid-cols-3">
            {[
              {
                number: "01",
                title: "Find your place",
                description:
                  "Explore restaurants by cuisine, neighbourhood, or the dining experience you have in mind.",
                symbol: "⌕",
              },
              {
                number: "02",
                title: "Choose your seating",
                description:
                  "Pick your date, party size, and table on our interactive seating layout.",
                symbol: "◷",
              },
              {
                number: "03",
                title: "Manage reservations",
                description:
                  "Keep your dining reservations organized and accessible in one place.",
                symbol: "✳",
              },
            ].map((item) => (
              <div
                key={item.number}
                className="rounded-[22px] border border-[#e1e0d6] bg-[#fbfaf6] p-7 transition duration-200 hover:-translate-y-1 hover:shadow-[0_12px_32px_rgba(30,45,32,0.05)] sm:p-8"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold tracking-widest text-[#8b8e83]">
                    {item.number}
                  </span>
                  <span className="text-2xl text-[#244b38]">
                    {item.symbol}
                  </span>
                </div>
                <h3 className="mt-6 font-serif text-xl font-medium text-[#20251f]">
                  {item.title}
                </h3>
                <p className="mt-2 text-xs leading-relaxed text-[#73796d]">
                  {item.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* AI Dining Concierge */}
      <AIConcierge />

      {/* Footer */}
      <footer className="bg-[#183727] text-white">
        <div className="container-shell flex flex-col gap-8 py-12 sm:flex-row sm:items-center sm:justify-between">
          <Link href="/" className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#f4f1e8] text-lg font-bold text-[#244b38]">
              t.
            </span>
            <span>
              <span className="block text-base font-semibold tracking-tight">
                tablekeeper
              </span>
              <span className="mt-0.5 block text-[9px] uppercase tracking-[1.8px] text-white/50">
                A table worth keeping
              </span>
            </span>
          </Link>

          <div className="flex flex-wrap gap-x-8 gap-y-3 text-xs text-white/70">
            <a href="#restaurants" className="transition hover:text-white">
              Discover
            </a>
            <a href="#how-it-works" className="transition hover:text-white">
              How it works
            </a>
            <Link href="/reservations" className="transition hover:text-white">
              My reservations
            </Link>
          </div>

          <p className="text-[11px] text-white/40">
            © 2026 Tablekeeper. All rights reserved.
          </p>
        </div>
      </footer>
    </main>
  );
}
