"use client";

import { useState, useCallback } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  useMapEvents,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { MAP_DEFAULTS } from "@/lib/constants";
import { MapPin } from "lucide-react";

interface HighRiskArea {
  id: string;
  lat: number;
  lng: number;
  label: string;
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

// Sample incident locations around SLC
const SAMPLE_INCIDENTS = [
  { id: "i1", lat: 40.771, lng: -111.895 },
  { id: "i2", lat: 40.769, lng: -111.888 },
  { id: "i3", lat: 40.755, lng: -111.905 },
  { id: "i4", lat: 40.748, lng: -111.876 },
  { id: "i5", lat: 40.738, lng: -111.895 },
  { id: "i6", lat: 40.742, lng: -111.87 },
  { id: "i7", lat: 40.765, lng: -111.862 },
];

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
  const [highRiskAreas, setHighRiskAreas] = useState<HighRiskArea[]>([]);
  const [pendingPin, setPendingPin] = useState<PendingPin | null>(null);
  const [pinLabel, setPinLabel] = useState("");

  const handleMapClick = useCallback((lat: number, lng: number) => {
    setPendingPin({ lat, lng });
    setPinLabel("");
  }, []);

  const confirmPin = () => {
    if (pendingPin && pinLabel.trim()) {
      setHighRiskAreas((prev) => [
        ...prev,
        {
          id: `hr-${Date.now()}`,
          lat: pendingPin.lat,
          lng: pendingPin.lng,
          label: pinLabel.trim(),
        },
      ]);
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
        center={MAP_DEFAULTS.center}
        zoom={MAP_DEFAULTS.zoom}
        scrollWheelZoom={true}
        className="h-full w-full"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
        />

        <MapClickHandler onMapClick={handleMapClick} />

        {/* Sample incident markers */}
        {SAMPLE_INCIDENTS.map((inc) => (
          <Marker key={inc.id} position={[inc.lat, inc.lng]} icon={incidentIcon}>
            <Popup>
              <div className="text-sm">
                <p className="font-semibold">Reported Incident</p>
                <p className="text-gray-500">Click to view details</p>
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
              <div className="text-sm">
                <p className="font-semibold">High-Risk Area</p>
                <p className="text-gray-500">{area.label}</p>
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
        <div className="flex items-center bg-white rounded-wenav shadow-md px-4 py-3">
          <input
            type="text"
            placeholder="Enter your Address"
            className="flex-1 outline-none text-sm text-gray-600 placeholder:text-gray-400"
          />
          <MapPin size={18} className="text-wenav-dark ml-2" />
        </div>

        {/* Stats cards */}
        <div className="bg-white rounded-wenav shadow-md px-4 py-3 flex items-center justify-between">
          <span className="text-sm text-red-400 font-medium">Active Users</span>
          <span className="text-sm font-bold text-wenav-dark">10,345,235</span>
        </div>
        <div className="bg-white rounded-wenav shadow-md px-4 py-3 flex items-center justify-between">
          <span className="text-sm text-red-400 font-medium">Pending Reports</span>
          <span className="text-sm font-bold text-wenav-dark">5</span>
        </div>
        <div className="bg-white rounded-wenav shadow-md px-4 py-3 flex items-center justify-between">
          <span className="text-sm text-red-400 font-medium">Saved high-risk areas</span>
          <span className="text-sm font-bold text-wenav-dark">
            {101 + highRiskAreas.length}
          </span>
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
