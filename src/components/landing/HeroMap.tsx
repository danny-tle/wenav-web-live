"use client";

import dynamic from "next/dynamic";
import { Search } from "lucide-react";

const MapWrapper = dynamic(() => import("@/components/shared/MapWrapper"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full bg-wenav-gray animate-pulse rounded-wenav flex items-center justify-center">
      <p className="text-gray-400">Loading map...</p>
    </div>
  ),
});

export default function HeroMap() {
  return (
    <section id="home" className="relative w-full h-[85vh] pt-16">
      <MapWrapper scrollWheelZoom={false} className="h-full w-full">
        {/* Markers will be added when Firestore is connected */}
      </MapWrapper>

      {/* Search bar overlay */}
      <div className="absolute top-24 left-1/2 -translate-x-1/2 z-[1000] w-full max-w-lg px-4">
        <div className="flex items-center bg-white rounded-wenav shadow-lg px-4 py-3">
          <Search size={18} className="text-gray-400 mr-3 flex-shrink-0" />
          <input
            type="text"
            placeholder="Search for locations..."
            className="flex-1 outline-none text-sm text-gray-700 placeholder:text-gray-400"
            readOnly
          />
        </div>
      </div>
    </section>
  );
}
