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
    <section id="home" className="relative w-full h-[100vh] pt-16">
      <MapWrapper scrollWheelZoom={false} className="h-full w-full">
        {/* Markers will be added when Firestore is connected */}
      </MapWrapper>

      {/* Search bar overlay */}
      <div className="absolute top-20 left-0 right-0 z-[1000]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="w-[420px] ml-10 border-gray-200">
            <div className="flex items-center bg-white rounded-wenav  px-4 py-3 border-gray-200">
              <Search size={18} className="text-gray-400 mr-3 flex-shrink-0" />
              <input
                type="text"
                placeholder="Search for locations..."
                className="flex-1 outline-none text-sm text-gray-700 placeholder:text-gray-400"
                readOnly
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
