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
  subscribeToHighRiskAreas,
  subscribeToUserProfiles,
  addHighRiskArea,
  deleteHighRiskArea,
} from "@/lib/firestore";
import { Incident, HighRiskArea } from "@/lib/types";

interface NominatimResult {
  place_id: number;
  display_name: string;
  lat: string;
  lon: string;
}

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

// Red incident pin icon
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

// High-risk area icon (larger, black with exclamation)
const highRiskIcon = L.divIcon({
  html: `<div style="width:36px;height:44px;display:flex;align-items:center;justify-content:center;">
    <svg width="36" height="44" viewBox="0 0 36 44" fill="none">
      <path d="M18 0C8.1 0 0 8.1 0 18c0 13.5 18 26 18 26s18-12.5 18-26C36 8.1 27.9 0 18 0z" fill="#0D0D0D"/>
      <circle cx="18" cy="17" r="9" fill="white" stroke="#0D0D0D" stroke-width="2"/>
      <text x="18" y="21" text-anchor="middle" font-size="14" font-weight="bold" fill="#0D0D0D">!</text>
    </svg>
  </div>`,
  iconSize: [36, 44],
  iconAnchor: [18, 44],
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

export default function AdminDashboardMap() {
  const { user } = useAuth();
  const mapKey = useRef(`map-${Date.now()}`).current;
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [highRiskAreas, setHighRiskAreas] = useState<HighRiskArea[]>([]);
  const [totalUsers, setTotalUsers] = useState(0);
  const [pendingPin, setPendingPin] = useState<PendingPin | null>(null);
  const [pinLabel, setPinLabel] = useState("");

  // Search state
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<NominatimResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [flyToLocation, setFlyToLocation] = useState<[number, number] | undefined>(undefined);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Subscribe to Firestore incidents, high-risk areas, and users
  useEffect(() => {
    const unsubIncidents = subscribeToIncidents(setIncidents);
    const unsubAreas = subscribeToHighRiskAreas(setHighRiskAreas);
    const unsubUsers = subscribeToUserProfiles((users) => setTotalUsers(users.length));
    return () => {
      unsubIncidents();
      unsubAreas();
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
    setPendingPin({ lat, lng });
    setPinLabel("");
  }, []);

  const confirmPin = async () => {
    if (pendingPin && pinLabel.trim()) {
      await addHighRiskArea({
        lat: pendingPin.lat,
        lng: pendingPin.lng,
        label: pinLabel.trim(),
        createdBy: user?.uid ?? "",
      });
      setPendingPin(null);
      setPinLabel("");
    }
  };

  const cancelPin = () => {
    setPendingPin(null);
    setPinLabel("");
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
          <Marker key={inc.id} position={[inc.location.lat, inc.location.lng]} icon={incidentIcon}>
            <Popup>
              <div className="text-sm">
                <p className="font-semibold">{inc.type.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}</p>
                <p className="text-gray-500">{inc.address}</p>
                <p className="text-gray-400 text-xs mt-1">{inc.reportedAt}</p>
              </div>
            </Popup>
          </Marker>
        ))}

        {/* High-risk area markers */}
        {highRiskAreas.map((area) => (
          <Marker
            key={area.id}
            position={[area.lat, area.lng]}
            icon={highRiskIcon}
          >
            <Popup>
              <div className="text-sm min-w-[160px]">
                <p className="font-semibold">High-Risk Area</p>
                <p className="text-gray-500 mb-3">{area.label}</p>
                <button
                  onClick={() => deleteHighRiskArea(area.id)}
                  className="w-full px-3 py-1.5 bg-red-500 text-white text-xs font-semibold rounded hover:bg-red-600 transition-colors"
                >
                  Delete
                </button>
              </div>
            </Popup>
          </Marker>
        ))}

        {/* Pending pin */}
        {pendingPin && (
          <Marker
            position={[pendingPin.lat, pendingPin.lng]}
            icon={highRiskIcon}
          >
            <Popup>
              <div className="min-w-[200px]">
                <p className="font-semibold text-sm mb-2">
                  Mark as High-Risk Area
                </p>
                <input
                  type="text"
                  placeholder="Enter description..."
                  value={pinLabel}
                  onChange={(e) => setPinLabel(e.target.value)}
                  className="w-full px-2 py-1.5 text-sm border rounded mb-2 outline-none focus:border-wenav-purple"
                  autoFocus
                  onKeyDown={(e) => e.key === "Enter" && confirmPin()}
                />
                <div className="flex gap-2">
                  <button
                    onClick={confirmPin}
                    className="flex-1 px-3 py-1.5 bg-emerald-600 text-white text-xs font-semibold rounded hover:bg-emerald-700"
                  >
                    Save
                  </button>
                  <button
                    onClick={cancelPin}
                    className="flex-1 px-3 py-1.5 bg-gray-200 text-gray-600 text-xs font-semibold rounded hover:bg-gray-300"
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
          <span className="text-sm text-red-400 font-medium">Saved high-risk areas</span>
          <span className="text-sm font-bold text-wenav-dark">{highRiskAreas.length}</span>
        </div>
      </div>

      {/* Instructions overlay */}
      {!pendingPin && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-[1000] bg-white/90 backdrop-blur-sm rounded-wenav px-4 py-2 shadow-sm">
          <p className="text-xs text-gray-500">
            Click anywhere on the map to add a high-risk area pin
          </p>
        </div>
      )}
    </div>
  );
}
