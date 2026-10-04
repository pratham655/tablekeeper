
"use client";

import { useMemo, useState } from "react";
import {
  restaurantMenus,
  type MenuCategory,
  type MenuItem,
} from "../data/menu-data";

type Props = {
  restaurantId: string;
};

const categories: Array<"All" | MenuCategory> = [
  "All",
  "Starters",
  "Mains",
  "Sides",
  "Desserts",
  "Beverages",
];

const categoryIcons: Record<MenuCategory, string> = {
  Starters: "🥗",
  Mains: "🍽️",
  Sides: "🥖",
  Desserts: "🍰",
  Beverages: "🥤",
};

export default function RestaurantMenu({ restaurantId }: Props) {
  const [activeCategory, setActiveCategory] =
    useState<"All" | MenuCategory>("All");
  const [search, setSearch] = useState("");
  const [diet, setDiet] = useState<"all" | "veg" | "nonveg">("all");

  const menu: MenuItem[] = restaurantMenus[restaurantId] ?? [];

  const filteredItems = useMemo(() => {
    const query = search.trim().toLowerCase();

    return menu.filter((item) => {
      const matchesCategory =
        activeCategory === "All" ||
        item.category === activeCategory;

      const matchesSearch =
        query.length === 0 ||
        item.name.toLowerCase().includes(query) ||
        item.category.toLowerCase().includes(query) ||
        (item.description ?? "").toLowerCase().includes(query);

      const matchesDiet =
        diet === "all" ||
        (diet === "veg" && item.vegetarian) ||
        (diet === "nonveg" && !item.vegetarian);

      return matchesCategory && matchesSearch && matchesDiet;
    });
  }, [menu, activeCategory, search, diet]);

  const clearFilters = () => {
    setSearch("");
    setActiveCategory("All");
    setDiet("all");
  };

  return (
    <section
      id="menu"
      className="mt-12 border-t border-[#e5e3da] pt-10"
    >
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[1.8px] text-[#85877e]">
            Culinary Selection
          </p>
          <h2 className="mt-1.5 font-serif text-3xl tracking-tight text-[#20251f] sm:text-4xl">
            Explore the menu
          </h2>
          <p className="mt-1.5 text-xs text-[#777d73]">
            Curated dishes and beverage pairings prepared by the culinary team.
          </p>
        </div>

        <span className="rounded-full border border-[#e5e3da] bg-white px-4 py-2 text-xs font-semibold text-[#44664d]">
          {filteredItems.length} of {menu.length} dishes
        </span>
      </div>

      {/* Filter and search controls */}
      <div className="mt-6 flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-sm text-[#85877e]">
            🔍
          </span>

          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search dishes, ingredients, or flavours..."
            aria-label="Search menu"
            className="h-12 w-full rounded-full border border-[#e5e3da] bg-white pl-11 pr-5 text-xs text-[#20251f] outline-none transition placeholder:text-[#a2a49b] focus:border-[#244b38] focus:ring-2 focus:ring-[#244b38]/10"
          />
        </div>

        <select
          value={diet}
          onChange={(event) =>
            setDiet(event.target.value as "all" | "veg" | "nonveg")
          }
          aria-label="Filter by dietary preference"
          className="h-12 rounded-full border border-[#e5e3da] bg-white px-5 text-xs font-medium text-[#30382f] outline-none focus:border-[#244b38]"
        >
          <option value="all">All dietary options</option>
          <option value="veg">Vegetarian only</option>
          <option value="nonveg">Non-vegetarian only</option>
        </select>
      </div>

      {/* Category Pills */}
      <div className="mt-5 flex gap-2 overflow-x-auto pb-2">
        {categories.map((category) => {
          const selected = activeCategory === category;

          return (
            <button
              key={category}
              type="button"
              onClick={() => setActiveCategory(category)}
              aria-pressed={selected}
              className={`shrink-0 rounded-full px-5 py-2.5 text-xs font-semibold transition ${
                selected
                  ? "bg-[#244b38] text-white shadow-xs"
                  : "border border-[#e5e3da] bg-white text-[#60665e] hover:border-[#244b38] hover:text-[#244b38]"
              }`}
            >
              {category === "All"
                ? "All courses"
                : `${categoryIcons[category]} ${category}`}
            </button>
          );
        })}
      </div>

      {/* Menu items grid */}
      {filteredItems.length > 0 ? (
        <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filteredItems.map((item) => (
            <article
              key={item.id}
              className="group flex min-h-[190px] flex-col justify-between rounded-[20px] border border-[#e8e6dd] bg-white p-5 transition duration-200 hover:-translate-y-1 hover:border-[#cbd5c9] hover:shadow-[0_12px_32px_rgba(30,45,32,0.06)]"
            >
              <div>
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <span className="text-[9px] font-bold uppercase tracking-[1.4px] text-[#8c9185]">
                      {categoryIcons[item.category]} {item.category}
                    </span>

                    <h3 className="mt-1.5 font-serif text-lg font-medium leading-snug text-[#20251f]">
                      {item.name}
                    </h3>
                  </div>

                  {/* FSSAI standard veg/non-veg badge */}
                  <span
                    title={
                      item.vegetarian
                        ? "Vegetarian"
                        : "Non-vegetarian"
                    }
                    aria-label={
                      item.vegetarian
                        ? "Vegetarian dish"
                        : "Non-vegetarian dish"
                    }
                    className={`mt-1 flex h-4.5 w-4.5 shrink-0 items-center justify-center rounded-[3px] border ${
                      item.vegetarian
                        ? "border-[#3d834c]"
                        : "border-[#b84b42]"
                    }`}
                  >
                    <span
                      className={`h-2 w-2 rounded-full ${
                        item.vegetarian
                          ? "bg-[#3d834c]"
                          : "bg-[#b84b42]"
                      }`}
                    />
                  </span>
                </div>

                <p className="mt-2.5 text-xs leading-relaxed text-[#6b7367]">
                  {item.description ||
                    `A chef-curated ${item.vegetarian ? "vegetarian" : "non-vegetarian"} ${item.category.toLowerCase()} dish.`}
                </p>
              </div>

              <div className="mt-5 flex items-end justify-between gap-2 border-t border-[#f0efe9] pt-3">
                <span className="text-[10px] font-medium text-[#8c9185]">
                  {item.vegetarian ? "Vegetarian" : "Non-vegetarian"}
                </span>

                <span className="text-sm font-bold tabular-nums text-[#244b38]">
                  ₹{item.price.toLocaleString("en-IN")}
                </span>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="mt-6 rounded-[22px] border border-dashed border-[#d9ddd4] bg-white/80 px-5 py-12 text-center">
          <div className="text-3xl" aria-hidden="true">
            🍽️
          </div>

          <h3 className="mt-3 font-serif text-xl text-[#30382f]">
            No menu items found
          </h3>

          <p className="mt-1.5 text-xs text-[#85877e]">
            Try clearing your search keyword or switching dietary filters.
          </p>

          <button
            type="button"
            onClick={clearFilters}
            className="mt-5 rounded-full bg-[#244b38] px-5 py-2.5 text-xs font-semibold text-white transition hover:bg-[#183727]"
          >
            Clear filters
          </button>
        </div>
      )}

      <p className="mt-5 text-[10px] leading-relaxed text-[#999b92]">
        Dishes, descriptions and prices reflect current sample menu offerings.
      </p>
    </section>
  );
}