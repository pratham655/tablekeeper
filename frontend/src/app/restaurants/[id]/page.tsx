

"use client";



import Link from "next/link";

import { useParams } from "next/navigation";

import { useEffect, useState, type FormEvent } from "react";

import RestaurantMenu from "../../../components/RestaurantMenu";

import Navbar from "../../../components/Navbar";



type Restaurant = {

  id: string;

  name: string;

  cuisine: string;

  location: string;

  rating: string;

  reviews: number;

  price: string;

  description: string;

  address: string;

  openingHours: string;

  phone: string;

  tags: string[];

  highlights: string[];

  images: string[];

};



type CustomerReview = {

  id: string;

  name: string;

  rating: number;

  comment: string;

  date: string;

};



const restaurants: Restaurant[] = [

  {

    id: "1",

    name: "The Olive Table",

    cuisine: "Mediterranean",

    location: "Indiranagar, Bengaluru",

    rating: "4.8",

    reviews: 328,

    price: "₹₹₹",

    description:

      "A relaxed, contemporary dining experience inspired by Mediterranean flavours. Thoughtful ingredients, beautifully prepared plates, and a welcoming setting make it a lovely place to gather.",

    address: "Indiranagar, Bengaluru, Karnataka",

    openingHours: "12:00 PM – 11:00 PM",

    phone: "+91 80000 00001",

    tags: ["Romantic", "Fine Dining", "Outdoor Seating"],

    highlights: [

      "Mediterranean cuisine",

      "Intimate dining",

      "Curated menu",

    ],

    images: [

      "https://images.unsplash.com/photo-1515003197210-e0cd71810b5f?auto=format&fit=crop&w=1400&q=85",

      "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&w=1000&q=85",

      "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1000&q=85",

    ],

  },

  {

    id: "2",

    name: "Spice Route",

    cuisine: "Indian",

    location: "Koramangala, Bengaluru",

    rating: "4.7",

    reviews: 512,

    price: "₹₹",

    description:

      "A vibrant Indian dining destination serving familiar favourites and regional inspirations in a comfortable setting for family meals, friendly catch-ups, and casual celebrations.",

    address: "Koramangala, Bengaluru, Karnataka",

    openingHours: "11:30 AM – 11:00 PM",

    phone: "+91 80000 00002",

    tags: ["Popular", "Family Friendly", "Indian"],

    highlights: [

      "Indian cuisine",

      "Group dining",

      "Comfortable ambience",

    ],

    images: [

      "https://images.unsplash.com/photo-1585937421612-70a008356fbe?auto=format&fit=crop&w=1400&q=85",

      "https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=1000&q=85",

      "https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&w=1000&q=85",

    ],

  },

  {

    id: "3",

    name: "Sakura House",

    cuisine: "Japanese",

    location: "MG Road, Bengaluru",

    rating: "4.9",

    reviews: 241,

    price: "₹₹₹₹",

    description:

      "An elegant Japanese-inspired restaurant with a focus on carefully presented dishes and a calm, modern atmosphere. A considered setting for a memorable evening.",

    address: "MG Road, Bengaluru, Karnataka",

    openingHours: "12:00 PM – 10:30 PM",

    phone: "+91 80000 00003",

    tags: ["Sushi", "Premium", "Date Night"],

    highlights: [

      "Japanese cuisine",

      "Sushi selection",

      "Modern interiors",

    ],

    images: [

      "https://images.unsplash.com/photo-1579871494447-9811cf80d66c?auto=format&fit=crop&w=1400&q=85",

      "https://images.unsplash.com/photo-1579584425555-c3ce17fd4351?auto=format&fit=crop&w=1000&q=85",

      "https://images.unsplash.com/photo-1553621042-f6e147245754?auto=format&fit=crop&w=1000&q=85",

    ],

  },

  {

    id: "4",

    name: "Casa Verde",

    cuisine: "Italian",

    location: "Whitefield, Bengaluru",

    rating: "4.6",

    reviews: 186,

    price: "₹₹₹",

    description:

      "A warm Italian-inspired space for slow lunches and relaxed dinners, bringing together comforting classics and an inviting atmosphere.",

    address: "Whitefield, Bengaluru, Karnataka",

    openingHours: "12:00 PM – 11:00 PM",

    phone: "+91 80000 00004",

    tags: ["Pizza", "Casual", "Friends"],

    highlights: [

      "Italian cuisine",

      "Wood-fired pizza",

      "Casual dining",

    ],

    images: [

      "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=1400&q=85",

      "https://images.unsplash.com/photo-1579751626657-72bc17010498?auto=format&fit=crop&w=1000&q=85",

      "https://images.unsplash.com/photo-1473093295043-cdd812d0e601?auto=format&fit=crop&w=1000&q=85",

    ],

  },

  {

    id: "5",

    name: "The Terrace",

    cuisine: "Continental",

    location: "HSR Layout, Bengaluru",

    rating: "4.7",

    reviews: 274,

    price: "₹₹₹",

    description:

      "A contemporary dining space with a rooftop-inspired feel, ideal for dinner plans, special occasions, and evenings spent catching up.",

    address: "HSR Layout, Bengaluru, Karnataka",

    openingHours: "4:00 PM – 11:30 PM",

    phone: "+91 80000 00005",

    tags: ["Rooftop", "Dinner", "Evening"],

    highlights: [

      "Continental cuisine",

      "Evening dining",

      "Rooftop atmosphere",

    ],

    images: [

      "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1400&q=85",

      "https://images.unsplash.com/photo-1514933651103-005eec06c04b?auto=format&fit=crop&w=1000&q=85",

      "https://images.unsplash.com/photo-1515003197210-e0cd71810b5f?auto=format&fit=crop&w=1000&q=85",

    ],

  },

  {

    id: "6",

    name: "Chai & Co.",

    cuisine: "Indian",

    location: "Jayanagar, Bengaluru",

    rating: "4.5",

    reviews: 398,

    price: "₹₹",

    description:

      "A laid-back neighbourhood spot for tea, snacks, and easy conversations. Drop by for a casual catch-up or a simple meal with friends.",

    address: "Jayanagar, Bengaluru, Karnataka",

    openingHours: "8:00 AM – 10:00 PM",

    phone: "+91 80000 00006",

    tags: ["Casual", "Tea", "Neighbourhood"],

    highlights: [

      "Tea and snacks",

      "Casual dining",

      "Relaxed setting",

    ],

    images: [

      "https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=1400&q=85",

      "https://images.unsplash.com/photo-1544787219-7f47ccb76574?auto=format&fit=crop&w=1000&q=85",

      "https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&w=1000&q=85",

    ],

  },

  {

    id: "7",

    name: "DRUMA",

    cuisine: "Multi-cuisine",

    location: "Jayanagar, Bengaluru",

    rating: "4.4",

    reviews: 126,

    price: "₹₹",

    description:

      "A vegetarian multi-cuisine dining destination in Jayanagar, Bengaluru, with a menu spanning soups, salads, chaats, starters, sliders, quesadillas, pasta, Indian mains, Pan Asian dishes, breads, rice, and desserts.",

    address: "616, 11th Cross, 7th Block West, Jayanagar, Bengaluru, Karnataka 560070",

    openingHours: "12:00 PM – 10:30 PM",

    phone: "+91 9980888862",

    tags: ["Vegetarian", "Multi-cuisine", "Jayanagar"],

    highlights: [

      "Vegetarian multi-cuisine menu",

      "Indian and Pan Asian dishes",

      "Soups, starters, mains, and desserts",

    ],

    images: [

      "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1400&q=85",

      "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&w=1000&q=85",

      "https://images.unsplash.com/photo-1515003197210-e0cd71810b5f?auto=format&fit=crop&w=1000&q=85",

    ],

  },

];



function PinIcon() {

  return (

    <svg

      viewBox="0 0 24 24"

      fill="none"

      className="h-5 w-5"

      aria-hidden="true"

    >

      <path

        d="M20 10c0 5-8 12-8 12S4 15 4 10a8 8 0 1 1 16 0Z"

        stroke="currentColor"

        strokeWidth="1.6"

        strokeLinejoin="round"

      />

      <circle

        cx="12"

        cy="10"

        r="2.5"

        stroke="currentColor"

        strokeWidth="1.6"

      />

    </svg>

  );

}



function ClockIcon() {

  return (

    <svg

      viewBox="0 0 24 24"

      fill="none"

      className="h-5 w-5"

      aria-hidden="true"

    >

      <circle

        cx="12"

        cy="12"

        r="9"

        stroke="currentColor"

        strokeWidth="1.6"

      />

      <path

        d="M12 7v5l3.5 2"

        stroke="currentColor"

        strokeWidth="1.6"

        strokeLinecap="round"

      />

    </svg>

  );

}



function ArrowIcon() {

  return (

    <svg

      viewBox="0 0 24 24"

      fill="none"

      className="h-4 w-4"

      aria-hidden="true"

    >

      <path

        d="M5 12h14M13 5l7 7-7 7"

        stroke="currentColor"

        strokeWidth="1.7"

        strokeLinecap="round"

        strokeLinejoin="round"

      />

    </svg>

  );

}



const demoReviews: Record<string, CustomerReview[]> = {

  "1": [

    { id: "olive-1", name: "Ananya R.", rating: 5, comment: "Beautiful ambience and delicious food. Perfect for a date night!", date: "18 Sep 2026" },

    { id: "olive-2", name: "Rahul M.", rating: 5, comment: "Loved the Mediterranean dishes. A lovely place to spend an evening.", date: "21 Sep 2026" },

    { id: "olive-3", name: "Meera S.", rating: 4, comment: "Great atmosphere and presentation. Slightly pricey, but enjoyable.", date: "25 Sep 2026" },

  ],

  "2": [

    { id: "spice-1", name: "Vikram K.", rating: 5, comment: "The flavours were amazing. Great choice for Indian food lovers.", date: "17 Sep 2026" },

    { id: "spice-2", name: "Pooja N.", rating: 4, comment: "Good food, generous portions, and a comfortable family setting.", date: "22 Sep 2026" },

    { id: "spice-3", name: "Arjun P.", rating: 5, comment: "Really enjoyed the meal. Would happily visit again.", date: "26 Sep 2026" },

  ],

  "3": [

    { id: "sakura-1", name: "Ishita D.", rating: 5, comment: "Loved the sushi and the calm atmosphere. A memorable experience.", date: "16 Sep 2026" },

    { id: "sakura-2", name: "Rohan B.", rating: 5, comment: "Excellent presentation and a lovely selection of Japanese dishes.", date: "20 Sep 2026" },

    { id: "sakura-3", name: "Nisha T.", rating: 4, comment: "A little expensive, but the overall dining experience was enjoyable.", date: "24 Sep 2026" },

  ],

  "4": [

    { id: "casa-1", name: "Diya A.", rating: 5, comment: "The pasta was delicious, and the place has a relaxed vibe.", date: "15 Sep 2026" },

    { id: "casa-2", name: "Kunal S.", rating: 4, comment: "Good pizza and friendly atmosphere. Nice spot for a casual dinner.", date: "19 Sep 2026" },

    { id: "casa-3", name: "Tara V.", rating: 5, comment: "Really enjoyed the food and ambience. Great for catching up with friends.", date: "23 Sep 2026" },

  ],

  "5": [

    { id: "terrace-1", name: "Aditya G.", rating: 5, comment: "The rooftop setting makes the evening feel special. Great experience.", date: "17 Sep 2026" },

    { id: "terrace-2", name: "Sanjana P.", rating: 4, comment: "Lovely ambience and a good variety of continental dishes.", date: "21 Sep 2026" },

    { id: "terrace-3", name: "Manav R.", rating: 5, comment: "A great place for dinner. Loved the overall atmosphere.", date: "27 Sep 2026" },

  ],

  "6": [

    { id: "chai-1", name: "Neha K.", rating: 5, comment: "A cosy place to relax with chai and snacks. Really nice experience.", date: "16 Sep 2026" },

    { id: "chai-2", name: "Siddharth J.", rating: 4, comment: "Affordable, casual, and a nice place to hang out with friends.", date: "20 Sep 2026" },

    { id: "chai-3", name: "Aditi M.", rating: 5, comment: "Loved the relaxed vibe and the food options. Will visit again.", date: "25 Sep 2026" },

  ],

  "7": [

    { id: "druma-1", name: "Riya S.", rating: 5, comment: "Lovely ambience and a great variety of vegetarian dishes.", date: "18 Sep 2026" },

    { id: "druma-2", name: "Harish N.", rating: 4, comment: "A comfortable place for dinner with family. Enjoyed the experience.", date: "22 Sep 2026" },

    { id: "druma-3", name: "Keerthi V.", rating: 4, comment: "Nice atmosphere and plenty of vegetarian options to explore.", date: "27 Sep 2026" },

  ],

};



export default function RestaurantDetailsPage() {

  const params = useParams<{ id: string }>();

  const routeId = String(params.id);

  const restaurantDbIds: Record<string, number> = {
    "1": 12,
    "2": 13,
    "3": 14,
    "4": 17,
    "5": 18,
    "6": 19,
    "7": 20,
  };

  // Support both existing frontend IDs (1–7) and database IDs (12–20).
  const restaurant = restaurants.find(
    (item) => item.id === routeId || String(restaurantDbIds[item.id]) === routeId
  );



  const [customerReviews, setCustomerReviews] = useState<CustomerReview[]>([]);

  const [reviewName, setReviewName] = useState("");

  const [reviewRating, setReviewRating] = useState(5);

  const [reviewComment, setReviewComment] = useState("");

  const [reviewMessage, setReviewMessage] = useState("");

  const [policies, setPolicies] = useState<{

    cancellation_hours: number;

    late_arrival_minutes: number;

    reservation_duration_minutes: number;

    max_party_size: number;

    policy_terms: string;

    policy_version: number;

  } | null>(null);



  useEffect(() => {

    if (!restaurant) return;

    const dbId = restaurantDbIds[restaurant.id];

    if (dbId) {

      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

      fetch(`${apiUrl}/restaurants/${dbId}/policies`)

        .then((res) => (res.ok ? res.json() : null))

        .then((data) => {

          if (data) setPolicies(data);

        })

        .catch(() => {});

    }

  }, [restaurant?.id]);



  useEffect(() => {

    if (!restaurant) return;



    try {

      const savedReviews = window.localStorage.getItem(

        `tablekeeper_reviews_${restaurant.id}`

      );

      const seeded = demoReviews[restaurant.id] ?? [];

      if (savedReviews) {

        const parsed: unknown = JSON.parse(savedReviews);

        const userReviews = Array.isArray(parsed) ? (parsed as CustomerReview[]) : [];

        // Keep demo examples visible and retain reviews submitted in this browser.

        const userOnly = userReviews.filter((review) => !seeded.some((sample) => sample.id === review.id));

        setCustomerReviews([...userOnly, ...seeded]);

      } else {

        setCustomerReviews(seeded);

      }

    } catch {

      setCustomerReviews(demoReviews[restaurant.id] ?? []);

    }

  }, [restaurant?.id]);



  function handleReviewSubmit(event: FormEvent<HTMLFormElement>) {

    event.preventDefault();



    if (!restaurant) return;



    const cleanName = reviewName.trim();

    const cleanComment = reviewComment.trim();



    if (!cleanName || !cleanComment) {

      setReviewMessage("Please enter your name and review.");

      return;

    }



    const newReview: CustomerReview = {

      id: `${Date.now()}`,

      name: cleanName,

      rating: reviewRating,

      comment: cleanComment,

      date: new Date().toLocaleDateString("en-IN", {

        day: "numeric",

        month: "short",

        year: "numeric",

      }),

    };



    const updatedReviews = [newReview, ...customerReviews];

    setCustomerReviews(updatedReviews);



    try {

      window.localStorage.setItem(

        `tablekeeper_reviews_${restaurant.id}`,

        JSON.stringify(updatedReviews)

      );

      setReviewMessage("Thanks! Your review has been added on this browser.");

    } catch {

      setReviewMessage(

        "Your review is visible for this session, but could not be saved in this browser."

      );

    }



    setReviewName("");

    setReviewRating(5);

    setReviewComment("");

  }



  const customerReviewAverage =

    customerReviews.length > 0

      ? customerReviews.reduce((sum, review) => sum + review.rating, 0) /

        customerReviews.length

      : 0;



  if (!restaurant) {

    return (

      <main className="flex min-h-screen items-center justify-center bg-[#f8f7f2] px-6">

        <div className="max-w-md text-center">

          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#e9efe8] text-2xl text-[#244b38]">

            ?

          </div>



          <h1 className="mt-6 font-serif text-3xl text-[#20251f]">

            Restaurant not found

          </h1>



          <p className="mt-3 text-sm leading-6 text-[#777d73]">

            This restaurant may have been moved or is no longer available.

          </p>



          <Link

            href="/"

            className="mt-7 inline-flex items-center gap-2 rounded-full bg-[#244b38] px-6 py-3 text-sm font-semibold text-white hover:bg-[#183727]"

          >

            Back to discovery <ArrowIcon />

          </Link>

        </div>

      </main>

    );

  }



  return (

    <main className="min-h-screen bg-[#f8f7f2] text-[#20251f]">

      {/* NAVBAR */}

      <Navbar />



      <div className="mx-auto w-[min(1200px,calc(100%-40px))] pb-24 pt-7 sm:pt-10">

        {/* BREADCRUMB */}

        <nav

          aria-label="Breadcrumb"

          className="mb-7 flex items-center gap-2 text-[11px] text-[#85877e]"

        >

          <Link href="/" className="hover:text-[#244b38]">

            Discover

          </Link>



          <span>/</span>



          <span className="text-[#30382f]">

            {restaurant.name}

          </span>

        </nav>



        {/* IMAGE GALLERY */}

        <section className="grid gap-3 lg:grid-cols-[1.6fr_1fr]">

          <div className="relative h-[300px] overflow-hidden rounded-[22px] bg-[#e8e8df] sm:h-[440px] lg:h-[510px]">

            <img

              src={restaurant.images[0]}

              alt={`${restaurant.name} dining`}

              className="h-full w-full object-cover"

            />



            <div className="absolute inset-0 bg-gradient-to-t from-black/35 via-transparent to-black/5" />



            <div className="absolute bottom-5 left-5 flex flex-wrap gap-2 sm:bottom-7 sm:left-7">

              {restaurant.tags.slice(0, 3).map((tag) => (

                <span

                  key={tag}

                  className="rounded-full border border-white/30 bg-white/90 px-3 py-2 text-[10px] font-semibold text-[#30382f] backdrop-blur"

                >

                  {tag}

                </span>

              ))}

            </div>

          </div>



          <div className="grid grid-cols-2 gap-3 lg:grid-cols-1 lg:grid-rows-2">

            {restaurant.images.slice(1).map((image, index) => (

              <div

                key={image}

                className="relative h-[145px] overflow-hidden rounded-[18px] bg-[#e8e8df] sm:h-[213px] lg:h-auto"

              >

                <img

                  src={image}

                  alt={`${restaurant.name} gallery ${index + 2}`}

                  loading="lazy"

                  className="h-full w-full object-cover transition duration-500 hover:scale-105"

                />

              </div>

            ))}

          </div>

        </section>



        {/* RESTAURANT DETAILS */}

        <section className="mt-8 grid gap-10 lg:grid-cols-[1fr_340px] lg:gap-14">

          <div className="min-w-0">

            {/* CUISINE AND PRICE */}

            <div className="flex flex-wrap items-center gap-2 text-[10px] font-semibold uppercase tracking-[1.6px] text-[#85877e]">

              <span>{restaurant.cuisine}</span>

              <span className="h-1 w-1 rounded-full bg-[#b4b5aa]" />

              <span>{restaurant.price}</span>

              <span className="h-1 w-1 rounded-full bg-[#b4b5aa]" />

              <span>Bengaluru</span>

            </div>



            {/* NAME AND RATING */}

            <div className="mt-3 flex flex-wrap items-start justify-between gap-4">

              <h1 className="font-serif text-4xl leading-tight tracking-[-1.2px] sm:text-5xl">

                {restaurant.name}

              </h1>



              <div className="flex items-center gap-2 rounded-full border border-[#e5e3da] bg-white px-4 py-2.5">

                <span className="text-sm text-[#b48a43]">★</span>



                <span className="text-sm font-bold">

                  {restaurant.rating}

                </span>



                <span className="text-[10px] text-[#85877e]">

                  ({restaurant.reviews} reviews)

                </span>

              </div>

            </div>



            {/* ADDRESS */}

            <div className="mt-5 flex items-center gap-2 text-sm text-[#777d73]">

              <span className="text-[#244b38]">

                <PinIcon />

              </span>

              {restaurant.address}

            </div>



            {/* DESCRIPTION */}

            <p className="mt-7 max-w-[720px] text-sm leading-8 text-[#697066]">

              {restaurant.description}

            </p>



            {/* THE EXPERIENCE */}

            <div className="mt-9 border-t border-[#e5e3da] pt-7">

              <h2 className="font-serif text-2xl tracking-[-0.5px]">

                The experience

              </h2>



              <div className="mt-5 grid gap-3 sm:grid-cols-3">

                {restaurant.highlights.map((highlight, index) => (

                  <div

                    key={highlight}

                    className="rounded-2xl border border-[#e8e6dd] bg-white p-4"

                  >

                    <span className="text-[10px] font-bold tracking-[1.4px] text-[#9a9d92]">

                      0{index + 1}

                    </span>



                    <p className="mt-3 text-[12px] font-semibold text-[#30382f]">

                      {highlight}

                    </p>

                  </div>

                ))}

              </div>

            </div>



            {/* RESTAURANT MENU */}

            <RestaurantMenu restaurantId={restaurant.id} />



            {/* CUSTOMER REVIEWS */}

            <section

              aria-labelledby="customer-reviews-heading"

              className="mt-10 border-t border-[#e5e3da] pt-8"

            >

              <div className="flex flex-wrap items-end justify-between gap-4">

                <div>

                  <p className="text-[10px] font-bold uppercase tracking-[1.8px] text-[#85877e]">

                    Guest feedback

                  </p>

                  <h2

                    id="customer-reviews-heading"

                    className="mt-2 font-serif text-2xl tracking-[-0.5px]"

                  >

                    Reviews &amp; ratings

                  </h2>

                  <p className="mt-2 text-[12px] text-[#777d73]">

                    Reviews submitted through this demo are saved in this browser.

                  </p>

                </div>



                <div className="rounded-2xl border border-[#e8e6dd] bg-white px-5 py-3">

                  {customerReviews.length > 0 ? (

                    <>

                      <div className="flex items-center gap-2">

                        <span className="text-xl text-[#b48a43]" aria-hidden="true">

                          ★

                        </span>

                        <span className="text-2xl font-bold tabular-nums">

                          {customerReviewAverage.toFixed(1)}

                        </span>

                        <span className="text-[11px] text-[#85877e]">/ 5</span>

                      </div>

                      <p className="mt-1 text-[10px] text-[#85877e]">

                        {customerReviews.length} demo{" "}

                        {customerReviews.length === 1 ? "review" : "reviews"}

                      </p>

                    </>

                  ) : (

                    <>

                      <p className="text-sm font-semibold">No reviews yet</p>

                      <p className="mt-1 text-[10px] text-[#85877e]">

                        Be the first to share feedback

                      </p>

                    </>

                  )}

                </div>

              </div>



              <form

                onSubmit={handleReviewSubmit}

                className="mt-6 rounded-[20px] border border-[#e8e6dd] bg-white p-5 sm:p-6"

              >

                <h3 className="text-sm font-semibold text-[#30382f]">

                  Write a review

                </h3>

                <p className="mt-1 text-[11px] leading-5 text-[#85877e]">

                  Share your experience to help others discover this restaurant.

                </p>



                <div className="mt-5">

                  <label

                    htmlFor="review-name"

                    className="block text-[11px] font-semibold text-[#4b5449]"

                  >

                    Your name

                  </label>

                  <input

                    id="review-name"

                    value={reviewName}

                    onChange={(event) => setReviewName(event.target.value)}

                    maxLength={60}

                    required

                    placeholder="Enter your name"

                    className="mt-2 min-h-11 w-full rounded-xl border border-[#e2e3d9] bg-[#fcfcf9] px-4 text-sm outline-none transition placeholder:text-[#a0a398] focus:border-[#55735b] focus:ring-2 focus:ring-[#55735b]/15"

                  />

                </div>



                <fieldset className="mt-5">

                  <legend className="text-[11px] font-semibold text-[#4b5449]">

                    Your rating

                  </legend>

                  <div className="mt-2 flex items-center gap-1">

                    {[1, 2, 3, 4, 5].map((star) => (

                      <button

                        key={star}

                        type="button"

                        onClick={() => setReviewRating(star)}

                        aria-label={`Rate ${star} out of 5 stars`}

                        aria-pressed={reviewRating === star}

                        className={`rounded-md p-1 text-3xl leading-none transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#55735b] ${

                          star <= reviewRating

                            ? "text-[#b48a43]"

                            : "text-[#d8d8cf]"

                        }`}

                      >

                        ★

                      </button>

                    ))}

                    <span className="ml-2 text-[11px] text-[#777d73]">

                      {reviewRating} of 5

                    </span>

                  </div>

                </fieldset>



                <div className="mt-5">

                  <label

                    htmlFor="review-comment"

                    className="block text-[11px] font-semibold text-[#4b5449]"

                  >

                    Your review

                  </label>

                  <textarea

                    id="review-comment"

                    value={reviewComment}

                    onChange={(event) => setReviewComment(event.target.value)}

                    maxLength={600}

                    required

                    rows={4}

                    placeholder="What did you enjoy? How was the food, service or ambience?"

                    className="mt-2 w-full resize-y rounded-xl border border-[#e2e3d9] bg-[#fcfcf9] px-4 py-3 text-sm leading-6 outline-none transition placeholder:text-[#a0a398] focus:border-[#55735b] focus:ring-2 focus:ring-[#55735b]/15"

                  />

                  <p className="mt-1 text-right text-[10px] text-[#999b92]">

                    {reviewComment.length}/600

                  </p>

                </div>



                <div className="mt-4 flex flex-wrap items-center justify-between gap-3">

                  <p

                    aria-live="polite"

                    className="text-[11px] text-[#55735b]"

                  >

                    {reviewMessage}

                  </p>

                  <button

                    type="submit"

                    className="inline-flex min-h-11 items-center justify-center rounded-full bg-[#244b38] px-6 text-[11px] font-bold text-white transition hover:bg-[#183727] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#55735b] focus-visible:ring-offset-2"

                  >

                    Submit review

                  </button>

                </div>

              </form>



              <div className="mt-6 space-y-3">

                {customerReviews.length === 0 ? (

                  <div className="rounded-2xl border border-dashed border-[#dcded4] px-5 py-8 text-center">

                    <p className="text-sm font-semibold text-[#4b5449]">

                      Your feedback can start the conversation

                    </p>

                    <p className="mt-2 text-[11px] leading-5 text-[#85877e]">

                      Submitted demo reviews will appear here. No customer

                      reviews have been added yet.

                    </p>

                  </div>

                ) : (

                  customerReviews.map((review) => (

                    <article

                      key={review.id}

                      className="rounded-2xl border border-[#e8e6dd] bg-white p-5"

                    >

                      <div className="flex flex-wrap items-start justify-between gap-3">

                        <div className="flex items-center gap-3">

                          <div

                            aria-hidden="true"

                            className="flex h-10 w-10 items-center justify-center rounded-full bg-[#e9efe8] text-sm font-bold text-[#244b38]"

                          >

                            {review.name.charAt(0).toUpperCase()}

                          </div>

                          <div>

                            <p className="text-[12px] font-semibold text-[#30382f]">

                              {review.name}

                            </p>

                            <p className="mt-1 text-[10px] text-[#999b92]">

                              {review.date}

                            </p>

                          </div>

                        </div>

                        <div

                          className="flex items-center gap-1 text-sm text-[#b48a43]"

                          aria-label={`${review.rating} out of 5 stars`}

                        >

                          <span aria-hidden="true">

                            {"★".repeat(review.rating)}

                            <span className="text-[#d8d8cf]">

                              {"★".repeat(5 - review.rating)}

                            </span>

                          </span>

                        </div>

                      </div>

                      <p className="mt-4 whitespace-pre-wrap break-words text-[12px] leading-7 text-[#697066]">

                        {review.comment}

                      </p>

                    </article>

                  ))

                )}

              </div>

            </section>



            {/* BOOKING POLICIES */}

            {policies && (

              <div className="mt-9 border-t border-[#e5e3da] pt-7">

                <div className="flex items-center gap-2">

                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#e9eee6] text-[10px] font-bold text-[#244b38]">✓</span>

                  <h2 className="font-serif text-2xl tracking-[-0.5px]">

                    Booking &amp; Cancellation Policies

                  </h2>

                </div>

                <div className="mt-4 grid gap-3 sm:grid-cols-2">

                  <div className="rounded-xl border border-[#e8e6dd] bg-white p-4">

                    <p className="text-[10px] font-bold uppercase tracking-wider text-[#85877e]">Cancellation Window</p>

                    <p className="mt-1 text-xs font-semibold text-[#20251f]">

                      Free cancellation up to {policies.cancellation_hours} hours in advance

                    </p>

                  </div>

                  <div className="rounded-xl border border-[#e8e6dd] bg-white p-4">

                    <p className="text-[10px] font-bold uppercase tracking-wider text-[#85877e]">Table Holding Grace Period</p>

                    <p className="mt-1 text-xs font-semibold text-[#20251f]">

                      Held for {policies.late_arrival_minutes} minutes past reservation time

                    </p>

                  </div>

                  <div className="rounded-xl border border-[#e8e6dd] bg-white p-4">

                    <p className="text-[10px] font-bold uppercase tracking-wider text-[#85877e]">Dining Duration</p>

                    <p className="mt-1 text-xs font-semibold text-[#20251f]">

                      Standard seating is {policies.reservation_duration_minutes} minutes

                    </p>

                  </div>

                  <div className="rounded-xl border border-[#e8e6dd] bg-white p-4">

                    <p className="text-[10px] font-bold uppercase tracking-wider text-[#85877e]">Max Party Size</p>

                    <p className="mt-1 text-xs font-semibold text-[#20251f]">

                      Online booking supports up to {policies.max_party_size} guests

                    </p>

                  </div>

                </div>

                {policies.policy_terms && (

                  <p className="mt-3 text-[11px] leading-relaxed text-[#697066] italic bg-[#faf9f5] p-3 rounded-lg border border-[#eeece4]">

                    "{policies.policy_terms}" (Policy v{policies.policy_version})

                  </p>

                )}

              </div>

            )}



            {/* RESTAURANT INFORMATION */}

            <div className="mt-9 border-t border-[#e5e3da] pt-7">

              <h2 className="font-serif text-2xl tracking-[-0.5px]">

                Restaurant information

              </h2>



              <div className="mt-5 grid gap-5 sm:grid-cols-2">

                <div className="flex items-start gap-3">

                  <span className="mt-0.5 text-[#55735b]">

                    <ClockIcon />

                  </span>



                  <div>

                    <p className="text-[11px] font-semibold">

                      Opening hours

                    </p>



                    <p className="mt-1 text-[12px] text-[#777d73]">

                      {restaurant.openingHours}

                    </p>

                  </div>

                </div>



                <div className="flex items-start gap-3">

                  <span className="mt-0.5 text-[#55735b]">

                    <PinIcon />

                  </span>



                  <div>

                    <p className="text-[11px] font-semibold">

                      Location

                    </p>



                    <p className="mt-1 text-[12px] text-[#777d73]">

                      {restaurant.location}

                    </p>

                  </div>

                </div>

              </div>

            </div>

          </div>



          {/* RESERVATION SIDEBAR */}

          <aside className="h-fit rounded-[22px] border border-[#e7e5dc] bg-white p-6 shadow-[0_12px_40px_rgba(30,45,32,0.06)] lg:sticky lg:top-24">

            <p className="text-[10px] font-bold uppercase tracking-[1.8px] text-[#85877e]">

              Make it a moment

            </p>



            <h2 className="mt-3 font-serif text-2xl leading-tight">

              Reserve your table

            </h2>



            <p className="mt-2 text-[12px] leading-6 text-[#85877e]">

              Choose a date, party size, and time to explore available tables.

            </p>



            <div className="my-6 border-t border-[#eeeae2]" />



            <div className="flex items-center justify-between text-[12px]">

              <span className="text-[#85877e]">Cuisine</span>

              <span className="font-semibold">

                {restaurant.cuisine}

              </span>

            </div>



            <div className="mt-4 flex items-center justify-between text-[12px]">

              <span className="text-[#85877e]">Price range</span>

              <span className="font-semibold">

                {restaurant.price}

              </span>

            </div>



            <div className="mt-4 flex items-center justify-between text-[12px]">

              <span className="text-[#85877e]">Guest rating</span>

              <span className="font-semibold">

                ★ {restaurant.rating} / 5

              </span>

            </div>



            {policies && (

              <div className="mt-4 rounded-xl bg-[#f8faf6] p-3 border border-[#e5e8e0] text-[11px] text-[#555d52]">

                <p className="font-semibold text-[#244b38]">✓ Policy Protected</p>

                <p className="mt-0.5 text-[10px] text-[#777d73]">

                  {policies.cancellation_hours}h cancellation · {policies.late_arrival_minutes}m hold grace

                </p>

              </div>

            )}



            <Link

              href={`/restaurants/${restaurant.id}/availability`}

              className="mt-7 flex min-h-[50px] w-full items-center justify-center gap-3 rounded-full bg-[#244b38] px-5 text-[12px] font-bold text-white transition hover:-translate-y-0.5 hover:bg-[#183727]"

            >

              Check availability <ArrowIcon />

            </Link>



            <p className="mt-4 text-center text-[10px] leading-5 text-[#999b92]">

              Live table availability confirmed by Tablekeeper.

            </p>

          </aside>

        </section>

      </div>



      {/* FOOTER */}

      <footer className="border-t border-[#e9e7df] bg-[#efeee6]">

        <div className="mx-auto flex w-[min(1200px,calc(100%-40px))] flex-col gap-4 py-7 sm:flex-row sm:items-center sm:justify-between">

          <p className="text-[11px] text-[#777d73]">

            © 2026 Tablekeeper. A table worth keeping.

          </p>



          <div className="flex gap-5 text-[11px] text-[#777d73]">

            <Link href="/" className="hover:text-[#244b38]">

              Discover

            </Link>



            <Link

              href="/reservations"

              className="hover:text-[#244b38]"

            >

              My reservations

            </Link>

          </div>

        </div>

      </footer>

    </main>

  );

}