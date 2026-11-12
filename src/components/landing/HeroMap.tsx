"use client";

import dynamic from "next/dynamic";
import { Search, X } from "lucide-react";
import { useState, useEffect, useRef, useCallback } from "react";
import type { Map as MaplibreMap } from "maplibre-gl";
import { subscribeToPublicIncidents } from "@/lib/firestore";
import { PublicIncident } from "@/lib/types";
import { HERO_GLOBE_STYLE } from "@/lib/mapStyle";
import { MAP_DEFAULTS } from "@/lib/constants";
import TourInvite from "@/components/landing/TourInvite";
import { useHomeTour } from "@/components/landing/HomeTour";
import { tourSignal } from "@/lib/tourSignal";
import {
  INTRO_START_CENTER,
  INTRO_START_ZOOM,
  useGlobeIntro,
  type IntroPhase,
} from "@/lib/useGlobeIntro";

const MapWrapper = dynamic(() => import("@/components/shared/MapWrapper"), {
  ssr: false,
  loading: () => (
    // Transparent so the hero's starfield shows while the globe loads.
    <div className="w-full z-10 h-full flex items-center justify-center">
      <p className="text-white/50 text-sm">Loading map...</p>
    </div>
  ),
});

const GlobeBeacon = dynamic(() => import("@/components/landing/GlobeBeacon"), {
  ssr: false,
});

const ApprovedIncidentMarkers = dynamic(
  () => import("@/components/landing/ApprovedIncidentMarkers"),
  { ssr: false }
);

/** Caption shown under the map for each stage of the intro. */
const INTRO_CAPTIONS: Partial<Record<IntroPhase, string>> = {
  space: "Welcome to WeNav",
  city: "Reported incidents · Salt Lake City",
  street: "Street-level 3D view",
};

interface NominatimResult {
  place_id: number;
  display_name: string;
  lat: string;
  lon: string;
}

export default function HeroMap() {
  const { phase, start: startIntro, skip: skipIntro } = useGlobeIntro();
  const introPlaying = phase !== "done";

  // Someone started the tour (from the navbar) mid-intro: get to the map.
  const { active: tourActive } = useHomeTour();
  useEffect(() => {
    if (tourActive && introPlaying) skipIntro();
  }, [tourActive, introPlaying, skipIntro]);
  const [map, setMap] = useState<MaplibreMap | null>(null);
  const handleMapLoad = useCallback(
    (loaded: MaplibreMap) => {
      setMap(loaded);
      void startIntro(loaded);
    },
    [startIntro]
  );
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<NominatimResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [flyToLocation, setFlyToLocation] = useState<[number, number] | undefined>(undefined);
  const [showDropdown, setShowDropdown] = useState(false);
  const [incidents, setIncidents] = useState<PublicIncident[]>([]);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const unsub = subscribeToPublicIncidents(setIncidents);
    return unsub;
  }, []);

  // The place just picked from the results. Picking one fills the box with
  // its name, which shouldn't kick off a fresh search and reopen the list.
  const pickedQuery = useRef<string | null>(null);

  // Debounced geocoding search via Nominatim
  useEffect(() => {
    if (query.trim().length < 3) {
      setResults([]);
      setShowDropdown(false);
      return;
    }
    if (query === pickedQuery.current) return;

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
    pickedQuery.current = result.display_name;
    setQuery(result.display_name);
    setFlyToLocation([parseFloat(result.lat), parseFloat(result.lon)]);
    setShowDropdown(false);
    tourSignal("search-picked");
  }

  function handleClear() {
    setQuery("");
    setResults([]);
    setShowDropdown(false);
  }

  return (
    <section id="home" data-tour="home-map" className="relative w-full h-[100vh] pt-16 bg-[#030712]">
      <div aria-hidden="true" className="hero-starfield pointer-events-none absolute inset-0" />
      <MapWrapper
        scrollWheelZoom={true}
        className="relative z-10 h-full w-full"
        flyToLocation={flyToLocation}
        mapStyle={HERO_GLOBE_STYLE}
        center={INTRO_START_CENTER}
        zoom={INTRO_START_ZOOM}
        onLoad={handleMapLoad}
      >
        {/* HTML markers float over the globe even when they're on its far
            side, so hold the pins back until we've landed on the city. */}
        {phase !== "idle" && phase !== "space" && (
          <ApprovedIncidentMarkers incidents={incidents} />
        )}
      </MapWrapper>
      {/* A beam of light over Salt Lake City while we're up in space. */}
      <GlobeBeacon map={map} location={MAP_DEFAULTS.center} />

      {introPlaying && (
        <div className="absolute bottom-14 left-0 right-0 z-[1000] flex items-center justify-center gap-4 px-4 text-white">
          {INTRO_CAPTIONS[phase] && (
          <span
            key={phase}
            aria-live="polite"
            className="rounded-full bg-black/40 px-4 py-1.5 text-xs font-medium tracking-[0.2em] text-white/85 uppercase backdrop-blur animate-[intro-caption_600ms_ease-out]"
          >
            {INTRO_CAPTIONS[phase]}
          </span>
          )}
          <button
            type="button"
            onClick={skipIntro}
            className="rounded-full border border-white/30 bg-black/30 px-3 py-1.5 text-xs font-medium text-white/90 backdrop-blur transition-colors hover:bg-white/15"
          >
            Skip intro
          </button>
        </div>
      )}

      {/* Search bar overlay */}
      <div
        className={`absolute top-20 left-0 right-0 z-[1000] pointer-events-none transition-opacity duration-500 ${
          introPlaying ? "opacity-0" : "opacity-100"
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div
            ref={dropdownRef}
            data-tour="home-search"
            className={`w-[420px] ml-10 ${introPlaying ? "pointer-events-none" : "pointer-events-auto"}`}
          >
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
      {/* Once the intro's done, offer logged-out visitors a tour of the map. */}
      <TourInvite ready={!introPlaying} />
    </section>
  );
}
