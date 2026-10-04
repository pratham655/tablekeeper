
export type RestaurantSearchData = {
  name: string;
  cuisine: string;
  location: string;
  tags: string[];
};

export type SearchIntent = {
  cuisine: string | null;
  location: string | null;
  vegetarian: boolean;
  budgetFriendly: boolean;
  remainingTerms: string[];
};

const STOP_WORDS = new Set([
  "find", "show", "me", "some", "a", "an", "the", "in", "at",
  "near", "around", "for", "with", "want", "looking", "search",
  "restaurant", "restaurants", "place", "places", "food",
  "please", "that", "is", "are", "to", "of", "and",
]);

const CUISINE_ALIASES: Record<string, string[]> = {
  Indian: ["indian", "north indian", "south indian"],
  Italian: ["italian", "pizza", "pasta"],
  Japanese: ["japanese", "sushi", "ramen"],
  Mediterranean: ["mediterranean", "greek", "hummus"],
  Continental: ["continental", "western"],
  "Multi-cuisine": ["multi cuisine", "multicuisine"],
};

const AREAS = [
  "Indiranagar",
  "Koramangala",
  "MG Road",
  "Whitefield",
  "HSR Layout",
  "Jayanagar",
];

export function parseNaturalSearch(query: string): SearchIntent {
  const normalized = query.toLowerCase().replace(/[^\w\s-]/g, " ").replace(/\s+/g, " ").trim();

  const cuisine = Object.entries(CUISINE_ALIASES).find(([, aliases]) =>
    aliases.some((alias) => normalized.includes(alias))
  )?.[0] ?? null;

  const location = AREAS.find((area) =>
    normalized.includes(area.toLowerCase())
  ) ?? null;

  const vegetarian =
    /\b(vegetarian|veggie|veg)\b/.test(normalized);

  const budgetFriendly =
    /\b(cheap|cheaper|affordable|budget|inexpensive|low cost)\b/.test(normalized);

  const matchedPhrases = [
    ...Object.values(CUISINE_ALIASES).flat(),
    ...AREAS.map((area) => area.toLowerCase()),
  ];

  let remaining = normalized;
  for (const phrase of matchedPhrases) {
    remaining = remaining.replace(
      new RegExp(`\\b${phrase.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "g"),
      " "
    );
  }

  const remainingTerms = remaining
    .split(" ")
    .filter((word) => word && !STOP_WORDS.has(word) && !/^\d+$/.test(word));

  return {
    cuisine,
    location,
    vegetarian,
    budgetFriendly,
    remainingTerms,
  };
}

export function matchesNaturalSearch(
  restaurant: RestaurantSearchData,
  intent: SearchIntent
): boolean {
  const searchable = [
    restaurant.name,
    restaurant.cuisine,
    restaurant.location,
    ...restaurant.tags,
  ].join(" ").toLowerCase();

  if (
    intent.cuisine &&
    restaurant.cuisine.toLowerCase() !== intent.cuisine.toLowerCase()
  ) {
    // Pizza, pasta, sushi, etc. can also match through tags.
    const cuisineAlias = Object.entries(CUISINE_ALIASES).find(
      ([name]) => name === intent.cuisine
    )?.[1] ?? [];

    const cuisineMatches = cuisineAlias.some((alias) =>
      searchable.includes(alias)
    );

    if (!cuisineMatches) return false;
  }

  if (
    intent.location &&
    !restaurant.location.toLowerCase().includes(intent.location.toLowerCase())
  ) {
    return false;
  }

  if (
    intent.vegetarian &&
    !restaurant.tags.some((tag) =>
      /vegetarian|veg/i.test(tag)
    )
  ) {
    return false;
  }

  if (
    intent.budgetFriendly &&
    !["₹", "₹₹"].includes((restaurant as any).price)
  ) {
    return false;
  }

  return intent.remainingTerms.every((term) => searchable.includes(term));
}