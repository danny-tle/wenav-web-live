"use client";

import dynamic from "next/dynamic";
import { Search, X } from "lucide-react";
import { useState, useEffect, useRef } from "react";

const MapWrapper = dynamic(() => import("@/components/shared/MapWrapper"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full bg-wenav-gray animate-pulse rounded-wenav flex items-center justify-center">
      <p className="text-gray-400">Loading map...</p>
    </div>
  ),
});

interface NominatimResult {
  place_id: number;
  display_name: string;
  lat: string;
  lon: string;
}

export default function HeroMap() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<NominatimResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [flyToLocation, setFlyToLocation] = useState<[number, number] | undefined>(undefined);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Debounced geocoding search via Nominatim
  useEffect(() => {
    if (query.trim().length < 3) {
      setResults([]);
      setShowDropdown(false);
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=5`,
          { headers: { "Accept-Language": "en" } }
        );
        const data: NominatimResult[] = await response.json();
        setResults(data);
        setShowDropdown(data.length > 0);
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [query]);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function handleSelect(result: NominatimResult) {
    setQuery(result.display_name);
    setFlyToLocation([parseFloat(result.lat), parseFloat(result.lon)]);
    setShowDropdown(false);
  }

  function handleClear() {
    setQuery("");
    setResults([]);
    setShowDropdown(false);
  }

  return (
    <section id="home" className="relative w-full h-[100vh] pt-16">
      <MapWrapper scrollWheelZoom={false} className="h-full w-full" flyToLocation={flyToLocation}>
        {/* Markers will be added when Firestore is connected */}
      </MapWrapper>

      {/* Search bar overlay */}
      <div className="absolute top-20 left-0 right-0 z-[1000]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div ref={dropdownRef} className="w-[420px] ml-10">
            <div className="flex items-center bg-white rounded-wenav px-4 py-3 border border-gray-200 shadow-sm">
              <Search size={18} className="text-gray-400 mr-3 flex-shrink-0" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onFocus={() => results.length > 0 && setShowDropdown(true)}
                placeholder="Search for locations..."
                className="flex-1 outline-none text-sm text-gray-700 placeholder:text-gray-400"
              />
              {loading && (
                <div className="ml-2 w-4 h-4 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin flex-shrink-0" />
              )}
              {query && !loading && (
                <button onClick={handleClear} className="ml-2 text-gray-400 hover:text-gray-600 flex-shrink-0">
                  <X size={16} />
                </button>
              )}
            </div>

            {showDropdown && (
              <div className="mt-1 bg-white rounded-wenav border border-gray-200 shadow-lg overflow-hidden">
                {results.map((result) => (
                  <button
                    key={result.place_id}
                    onClick={() => handleSelect(result)}
                    className="w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 flex items-start gap-2 border-b border-gray-100 last:border-0"
                  >
                    <Search size={14} className="text-gray-400 mt-0.5 flex-shrink-0" />
                    <span className="line-clamp-2">{result.display_name}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
