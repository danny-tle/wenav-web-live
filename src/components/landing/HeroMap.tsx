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
import MapTourButton from "@/components/landing/MapTourButton";
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

  const sectionRef = useRef<HTMLElement>(null);
  const [mapEngaged, setMapEngaged] = useState(false);
  const mapLive = mapEngaged || tourActive;
  const [showZoomHint, setShowZoomHint] = useState(false);
  const hintTimer = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    if (!map) return;

    const touchScreen =
      typeof window.matchMedia === "function" &&
      window.matchMedia("(pointer: coarse)").matches;
    if (mapLive) {
      map.scrollZoom.enable();
      map.dragPan.enable();
      map.touchZoomRotate.enable();
    } else {
      map.scrollZoom.disable();
      if (touchScreen) {
        map.dragPan.disable();
        map.touchZoomRotate.disable();
      }
    }
  }, [map, mapLive]);

  // Sleep again on a click outside the map or once it's mostly scrolled away.
  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;
    function handlePointerDown(e: PointerEvent) {
      if (!section!.contains(e.target as Node)) setMapEngaged(false);
    }
    document.addEventListener("pointerdown", handlePointerDown);
    let observer: IntersectionObserver | undefined;
    if (typeof IntersectionObserver !== "undefined") {
      observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.intersectionRatio < 0.4) setMapEngaged(false);
        },
        { threshold: [0.4] }
      );
      observer.observe(section);
    }
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      observer?.disconnect();
    };
  }, []);

  useEffect(() => () => clearTimeout(hintTimer.current), []);

  function handleWheel() {
    if (mapLive || introPlaying) return;
    setShowZoomHint(true);
    clearTimeout(hintTimer.current);
    hintTimer.current = setTimeout(() => setShowZoomHint(false), 1500);
  }

  function engageMap() {
    setMapEngaged(true);
    setShowZoomHint(false);
  }

  function engageIfOnMap(target: EventTarget) {
    const el = target as Element;
    if (el.closest?.(".maplibregl-map") || dropdownRef.current?.contains(el)) {
      engageMap();
    }
  }

  useEffect(() => {
    const unsub = subscribeToPublicIncidents(setIncidents);
    return unsub;
  }, []);


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
    engageMap();
    tourSignal("search-picked");
  }

  function handleClear() {
    setQuery("");
    setResults([]);
    setShowDropdown(false);
  }

  return (
    <section
      ref={sectionRef}
      id="home"
      data-tour="home-map"
      className="relative w-full h-[100vh] pt-16 bg-[#030712]"
      // A mouse press wakes the map straight away, so the same press can
      // drag. A tap only counts once it's a tap (not the start of a scroll).
      onPointerDownCapture={(e) => {
        if (e.pointerType === "mouse") engageIfOnMap(e.target);
      }}
      onClickCapture={(e) => engageIfOnMap(e.target)}
      onMouseLeave={() => setMapEngaged(false)}
      onWheel={handleWheel}
    >
      <div aria-hidden="true" className="hero-starfield pointer-events-none absolute inset-0" />
      <MapWrapper
        scrollWheelZoom={false}
        className="relative z-10 h-full w-full"
        flyToLocation={flyToLocation}
        mapStyle={HERO_GLOBE_STYLE}
        center={INTRO_START_CENTER}
        zoom={INTRO_START_ZOOM}
        onLoad={handleMapLoad}
        rounded={false}
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

      {/* Shown when someone scrolls over the map before clicking it. */}
      <div
        aria-hidden="true"
        className={`pointer-events-none absolute inset-0 z-[900] flex items-center justify-center transition-opacity duration-300 ${
          showZoomHint ? "opacity-100" : "opacity-0"
        }`}
      >
        <span className="rounded-full bg-black/65 px-5 py-2.5 text-sm font-medium text-white backdrop-blur">
          Click the map to zoom and explore
        </span>
      </div>

      {/* Search bar overlay */}
      <div
        className={`absolute top-20 left-0 right-0 z-[1000] pointer-events-none transition-opacity duration-500 ${
          introPlaying ? "opacity-0" : "opacity-100"
        }`}
      >
        {/* Same side padding as the navbar, so the bar's right edge lines up
            with the Login button. Map zoom controls sit top-left, so on narrow
            screens the bar leaves them room. */}
        <div className="px-4 sm:px-6 lg:px-[6%]">
          <div
            ref={dropdownRef}
            data-tour="home-search"
            className={`ml-auto w-[min(420px,calc(100%-3.5rem))] ${introPlaying ? "pointer-events-none" : "pointer-events-auto"}`}
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
          {/* The tour teaches the map, so it lives with the map's main control. */}
          <div className="ml-auto mt-2 flex w-[min(420px,calc(100%-3.5rem))] justify-end">
            <MapTourButton ready={!introPlaying} />
          </div>
        </div>
      </div>
      {/* Once the intro's done, offer logged-out visitors a tour of the map. */}
      <TourInvite ready={!introPlaying} />
      {/* Bottom-left: a cue that the page keeps going. Lined up with the
          navbar logo (same side padding), and on the same baseline and text
          size as MapLibre's map credit in the bottom-right corner. */}
      <div
        className={`pointer-events-none absolute bottom-[10px] left-0 z-[1000] flex h-6 items-center px-4 sm:px-6 lg:px-[6%] transition-opacity duration-500 ${
          introPlaying ? "opacity-0" : "opacity-100"
        }`}
      >
        <a
          href="#content"
          tabIndex={introPlaying ? -1 : 0}
          className={`group inline-flex h-6 items-center gap-4 text-[12px] font-medium uppercase leading-none tracking-[0.3em] text-wenav-dark/80 hover:text-wenav-dark transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-wenav-violet ${
            introPlaying ? "" : "pointer-events-auto"
          }`}
        >
          Scroll
          <span
            aria-hidden="true"
            className="block h-px w-16 bg-current transition-[width] duration-300 group-hover:w-24 motion-reduce:transition-none"
          />
        </a>
      </div>
    </section>
  );
}
