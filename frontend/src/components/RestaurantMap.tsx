"use client";

import "leaflet/dist/leaflet.css";
import { useMemo } from "react";
import Link from "next/link";
import { MapContainer, Marker, Popup, TileLayer } from "react-leaflet";
import MarkerClusterGroup from "react-leaflet-cluster";
import L from "leaflet";

type MapRestaurant = {
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

type Props = { restaurants: MapRestaurant[] };

// These are neighbourhood-level reference points for the demo, not venue coordinates.
const neighbourhoodCoordinates: Record<string, [number, number]> = {
  Indiranagar: [12.9784, 77.6408],
  Koramangala: [12.9352, 77.6245],
  "MG Road": [12.9756, 77.6066],
  Whitefield: [12.9698, 77.7500],
  "HSR Layout": [12.9116, 77.6389],
  Jayanagar: [12.9250, 77.5838],
};

function makeRestaurantIcon() {
  return L.divIcon({
    className: "tablekeeper-map-marker-wrap",
    html: '<span class="tablekeeper-map-marker"><span></span></span>',
    iconSize: [34, 42],
    iconAnchor: [17, 38],
    popupAnchor: [0, -36],
  });
}

export default function RestaurantMap({ restaurants }: Props) {
  const icon = useMemo(() => makeRestaurantIcon(), []);
  const locatedRestaurants = useMemo(
    () =>
      restaurants.flatMap((restaurant) => {
        const neighbourhood = Object.keys(neighbourhoodCoordinates).find((key) =>
          restaurant.location.toLowerCase().includes(key.toLowerCase())
        );
        if (!neighbourhood) return [];
        return [
          {
            ...restaurant,
            position: neighbourhoodCoordinates[neighbourhood],
          },
        ];
      }),
    [restaurants]
  );

  return (
    <div className="relative h-[440px] overflow-hidden rounded-[20px] sm:h-[540px]">
      <MapContainer
        center={[12.96, 77.64]}
        zoom={12}
        minZoom={10}
        maxZoom={18}
        scrollWheelZoom={false}
        className="h-full w-full"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <MarkerClusterGroup
          chunkedLoading
          showCoverageOnHover={false}
          maxClusterRadius={48}
        >
          {locatedRestaurants.map((restaurant) => (
            <Marker
              key={restaurant.id}
              position={restaurant.position}
              icon={icon}
              title={restaurant.name}
              alt={restaurant.name}
            >
              <Popup>
                <div className="w-[220px] overflow-hidden text-[#20251f]">
                  <div className="relative mb-2.5 h-[110px] w-full overflow-hidden rounded-xl bg-[#eef0e8]">
                    <img
                      src={restaurant.image}
                      alt={restaurant.name}
                      className="h-full w-full object-cover"
                      loading="lazy"
                    />
                    {restaurant.rating > 0 && (
                      <span className="absolute right-2 top-2 rounded-full bg-white/95 px-2 py-0.5 text-[10px] font-bold text-[#8c6b32] shadow-xs">
                        ★ {restaurant.rating.toFixed(1)}
                      </span>
                    )}
                  </div>
                  <p className="font-serif text-base font-semibold leading-tight text-[#20251f]">
                    {restaurant.name}
                  </p>
                  <p className="mt-1 text-xs text-[#777d73]">
                    {restaurant.cuisine} · {restaurant.location.split(",")[0]}
                    {restaurant.price !== "—" ? ` · ${restaurant.price}` : ""}
                  </p>
                  <p className="mt-1 text-[11px] text-[#85877e]">
                    {restaurant.reviews} guest reviews
                  </p>
                  <Link
                    href={`/restaurants/${restaurant.id}`}
                    className="mt-3 inline-flex items-center gap-1 text-xs font-bold text-[#244b38] hover:text-[#183727] hover:underline"
                  >
                    View restaurant details →
                  </Link>
                </div>
              </Popup>
            </Marker>
          ))}
        </MarkerClusterGroup>
      </MapContainer>
      {locatedRestaurants.length === 0 && (
        <div className="absolute inset-x-4 top-4 z-[1000] rounded-xl border border-[#e5e3da] bg-white/95 px-4 py-3 text-center text-xs font-medium text-[#777d73] shadow-md backdrop-blur-xs">
          No restaurants with mapped neighbourhoods match these filters.
        </div>
      )}
    </div>
  );
}
