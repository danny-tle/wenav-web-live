"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  ZoomControl,
  useMapEvents,
  useMap,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { MAP_DEFAULTS } from "@/lib/constants";
import { MapPin, Search, X } from "lucide-react";
import { useAuth } from "@/lib/auth";
import {
  subscribeToIncidents,
  subscribeToUserProfiles,
  createIncident,
  updateIncidentStatus,
} from "@/lib/firestore";
import { Incident } from "@/lib/types";

interface NominatimResult {
  place_id: number;
  display_name: string;
  lat: string;
  lon: string;
}

// ─── Type metadata ───────────────────────────────────────────────────────────

const TYPE_OPTIONS: { value: Incident["type"]; label: string }[] = [
  { value: "blocked_path", label: "Blocked Path" },
  { value: "construction", label: "Under Construction" },
  { value: "uneven_sidewalk", label: "Uneven Sidewalk" },
  { value: "low_obstacle", label: "Low Obstacle" },
  { value: "other", label: "Other" },
];

const TYPE_LABEL: Record<Incident["type"], string> = {
  blocked_path: "Blocked Path",
  construction: "Under Construction",
  uneven_sidewalk: "Uneven Sidewalk",
  low_obstacle: "Low Obstacle",
  other: "Other",
};

// ─── Map helpers ─────────────────────────────────────────────────────────────

function MapFlyTo({ location, zoom }: { location: [number, number]; zoom: number }) {
  const map = useMap();
  useEffect(() => {
    map.flyTo(location, zoom, { duration: 1.5 });
  }, [location, zoom, map]);
  return null;
}

interface PendingPin {
  lat: number;
  lng: number;
}

// Red icon — approved incidents (user- or admin-created).
const incidentIcon = L.divIcon({
  html: `<div style="width:24px;height:32px;display:flex;align-items:center;justify-content:center;">
    <svg width="24" height="32" viewBox="0 0 24 32" fill="none">
      <path d="M12 0C5.4 0 0 5.4 0 12c0 9 12 20 12 20s12-11 12-20C24 5.4 18.6 0 12 0z" fill="#DC2626"/>
      <circle cx="12" cy="12" r="5" fill="white"/>
    </svg>
  </div>`,
  iconSize: [24, 32],
  iconAnchor: [12, 32],
  className: "",
});

// Black icon — pending (under_review) incidents. Used for both user-submitted
// pending pins AND the admin's own just-dropped pin awaiting details.
const pendingIncidentIcon = L.divIcon({
  html: `<div style="width:24px;height:32px;display:flex;align-items:center;justify-content:center;">
    <svg width="24" height="32" viewBox="0 0 24 32" fill="none">
      <path d="M12 0C5.4 0 0 5.4 0 12c0 9 12 20 12 20s12-11 12-20C24 5.4 18.6 0 12 0z" fill="#0D0D0D"/>
      <circle cx="12" cy="12" r="5" fill="white"/>
    </svg>
  </div>`,
  iconSize: [24, 32],
  iconAnchor: [12, 32],
  className: "",
});

function MapClickHandler({
  onMapClick,
}: {
  onMapClick: (lat: number, lng: number) => void;
}) {
  useMapEvents({
    click(e) {
      onMapClick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

/// Reverse-geocodes a lat/lng to an address via OpenStreetMap Nominatim.
/// Falls back to a coordinate string if the API call fails. Matches the
/// behavior used by the mobile app so admin- and user-created incidents have
/// the same address format.
async function reverseGeocode(lat: number, lng: number): Promise<string> {
  const fallback = `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`,
      { headers: { "Accept-Language": "en" } }
    );
    if (!res.ok) return fallback;
    const data = await res.json();
    return (data?.display_name as string | undefined) ?? fallback;
  } catch {
    return fallback;
  }
}

// ─── Main component ──────────────────────────────────────────────────────────

export default function AdminDashboardMap() {
  const { user } = useAuth();
  const mapKey = useRef(`map-${Date.now()}`).current;
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [totalUsers, setTotalUsers] = useState(0);

  // Local state for the admin's "dropped but not yet saved" pin.
  const [pendingPin, setPendingPin] = useState<PendingPin | null>(null);
  const [pendingType, setPendingType] = useState<Incident["type"]>("blocked_path");
  const [pendingDescription, setPendingDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Search state
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<NominatimResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [flyToLocation, setFlyToLocation] = useState<[number, number] | undefined>(undefined);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Subscribe to Firestore: incidents + user count.
  useEffect(() => {
    const unsubIncidents = subscribeToIncidents(setIncidents);
    const unsubUsers = subscribeToUserProfiles((users) => setTotalUsers(users.length));
    return () => {
      unsubIncidents();
      unsubUsers();
    };
  }, []);

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

  const handleMapClick = useCallback((lat: number, lng: number) => {
    // First click: drop a black pending pin. No popup, no Firestore write.
    // The admin clicks the pin itself to open the type/description form.
    setPendingPin({ lat, lng });
    setPendingType("blocked_path");
    setPendingDescription("");
  }, []);

  const cancelPin = () => {
    setPendingPin(null);
    setPendingDescription("");
  };

  const submitPin = async () => {
    if (!pendingPin || submitting) return;
    setSubmitting(true);
    try {
      const address = await reverseGeocode(pendingPin.lat, pendingPin.lng);
      await createIncident({
        type: pendingType,
        status: "approved", // admin is the reviewer, so we skip under_review
        location: { lat: pendingPin.lat, lng: pendingPin.lng },
        address,
        description: pendingDescription.trim(),
        reportedBy: user?.uid ?? "admin",
      });
      setPendingPin(null);
      setPendingDescription("");
    } catch {
      // Swallow silently for demo; in production we'd surface an error banner.
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="h-full w-full relative">
      <MapContainer
        key={mapKey}
        center={MAP_DEFAULTS.center}
        zoom={MAP_DEFAULTS.zoom}
        scrollWheelZoom={true}
        zoomControl={false}
        className="h-full w-full"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
        />

        <ZoomControl position="topleft" />
        <MapClickHandler onMapClick={handleMapClick} />
        {flyToLocation && <MapFlyTo location={flyToLocation} zoom={15} />}

        {/* Incident markers from Firestore */}
        {incidents.map((inc) => (
          <Marker
            key={inc.id}
            position={[inc.location.lat, inc.location.lng]}
            icon={inc.status === "under_review" ? pendingIncidentIcon : incidentIcon}
          >
            <Popup>
              <div className="text-sm min-w-[180px]">
                <p className="font-semibold">{TYPE_LABEL[inc.type]}</p>
                <p className="text-gray-500 text-xs mt-0.5">{inc.address}</p>
                <p className="text-gray-400 text-xs mt-0.5">{inc.reportedAt}</p>
                {inc.description && (
                  <p className="text-gray-500 text-xs mt-1 italic">&ldquo;{inc.description}&rdquo;</p>
                )}
                {inc.status === "under_review" && (
                  <div className="flex gap-2 mt-3">
                    <button
                      onClick={() => updateIncidentStatus(inc.id, "approved")}
                      className="flex-1 px-2 py-1.5 bg-emerald-600 text-white text-xs font-semibold rounded hover:bg-emerald-700 transition-colors"
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => updateIncidentStatus(inc.id, "not_confirmed")}
                      className="flex-1 px-2 py-1.5 bg-red-500 text-white text-xs font-semibold rounded hover:bg-red-600 transition-colors"
                    >
                      Deny
                    </button>
                  </div>
                )}
                {inc.status !== "under_review" && (
                  <p className={`text-xs font-semibold mt-2 ${inc.status === "approved" ? "text-emerald-600" : "text-red-500"}`}>
                    {inc.status === "approved" ? "Approved" : "Denied"}
                  </p>
                )}
              </div>
            </Popup>
          </Marker>
        ))}

        {/* Admin's pending pin — local state only. Clicking it opens the
            type + description form; Submit saves as an approved incident. */}
        {pendingPin && (
          <Marker
            position={[pendingPin.lat, pendingPin.lng]}
            icon={pendingIncidentIcon}
          >
            <Popup>
              <div className="min-w-[220px]">
                <p className="font-semibold text-sm mb-2">New Incident</p>

                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
                  Type
                </label>
                <select
                  value={pendingType}
                  onChange={(e) => setPendingType(e.target.value as Incident["type"])}
                  className="w-full px-2 py-1.5 text-sm border rounded mb-3 outline-none focus:border-wenav-purple"
                >
                  {TYPE_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>

                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
                  Description <span className="font-normal normal-case text-gray-400">(optional)</span>
                </label>
                <textarea
                  value={pendingDescription}
                  onChange={(e) => setPendingDescription(e.target.value)}
                  placeholder="Describe the hazard..."
                  rows={2}
                  className="w-full px-2 py-1.5 text-sm border rounded mb-3 outline-none focus:border-wenav-purple resize-none"
                />

                <div className="flex gap-2">
                  <button
                    onClick={submitPin}
                    disabled={submitting}
                    className="flex-1 px-3 py-1.5 bg-emerald-600 text-white text-xs font-semibold rounded hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {submitting ? "Saving…" : "Submit"}
                  </button>
                  <button
                    onClick={cancelPin}
                    disabled={submitting}
                    className="flex-1 px-3 py-1.5 bg-gray-200 text-gray-600 text-xs font-semibold rounded hover:bg-gray-300 disabled:opacity-50"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </Popup>
          </Marker>
        )}
      </MapContainer>

      {/* Top right overlay: search + stats */}
      <div className="absolute top-4 right-4 z-[1000] flex flex-col gap-3 w-72">
        {/* Address search */}
        <div ref={dropdownRef}>
          <div className="flex items-center bg-white rounded-wenav shadow-md px-4 py-3">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onFocus={() => results.length > 0 && setShowDropdown(true)}
              placeholder="Enter your Address"
              className="flex-1 outline-none text-sm text-gray-600 placeholder:text-gray-400"
            />
            {loading && (
              <div className="w-4 h-4 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin flex-shrink-0 ml-2" />
            )}
            {query && !loading && (
              <button onClick={handleClear} className="ml-2 text-gray-400 hover:text-gray-600 flex-shrink-0">
                <X size={16} />
              </button>
            )}
            {!query && <MapPin size={18} className="text-wenav-dark ml-2 flex-shrink-0" />}
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

        {/* Stats cards */}
        <div className="bg-white rounded-wenav shadow-md px-4 py-3 flex items-center justify-between">
          <span className="text-sm text-red-400 font-medium">Total Users</span>
          <span className="text-sm font-bold text-wenav-dark">{totalUsers}</span>
        </div>
        <div className="bg-white rounded-wenav shadow-md px-4 py-3 flex items-center justify-between">
          <span className="text-sm text-red-400 font-medium">Pending Reports</span>
          <span className="text-sm font-bold text-wenav-dark">
            {incidents.filter((i) => i.status === "under_review").length}
          </span>
        </div>
        <div className="bg-white rounded-wenav shadow-md px-4 py-3 flex items-center justify-between">
          <span className="text-sm text-red-400 font-medium">Approved Incidents</span>
          <span className="text-sm font-bold text-wenav-dark">
            {incidents.filter((i) => i.status === "approved").length}
          </span>
        </div>
      </div>

      {/* Instructions overlay */}
      {!pendingPin && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-[1000] bg-white/90 backdrop-blur-sm rounded-wenav px-4 py-2 shadow-sm">
          <p className="text-xs text-gray-500">
            Click anywhere on the map to add an incident, then click the pin to set type + description
          </p>
        </div>
      )}
    </div>
  );
}
