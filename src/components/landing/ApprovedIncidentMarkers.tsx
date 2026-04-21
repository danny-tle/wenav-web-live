"use client";

import L from "leaflet";
import { Marker, Popup } from "react-leaflet";
import { Incident } from "@/lib/types";

const TYPE_LABELS: Record<Incident["type"], string> = {
  blocked_path: "Blocked Path",
  construction: "Under Construction",
  uneven_sidewalk: "Uneven Sidewalk",
  low_obstacle: "Low Obstacle",
  other: "Other",
};

const pinIcon = L.divIcon({
  html: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 48" width="32" height="48">
    <path d="M16 0C7.163 0 0 7.163 0 16c0 12 16 32 16 32s16-20 16-32C32 7.163 24.837 0 16 0z" fill="#EF4444" stroke="white" stroke-width="1.5"/>
    <circle cx="16" cy="16" r="6" fill="white"/>
  </svg>`,
  className: "",
  iconSize: [32, 48],
  iconAnchor: [16, 48],
  popupAnchor: [0, -50],
});

export default function ApprovedIncidentMarkers({ incidents }: { incidents: Incident[] }) {
  return (
    <>
      {incidents
        .filter((inc) => inc.status === "approved")
        .map((inc) => (
          <Marker
            key={inc.id}
            position={[inc.location.lat, inc.location.lng]}
            icon={pinIcon}
          >
            <Popup>
              <div className="min-w-[160px]">
                <p className="font-semibold text-sm text-gray-800">{TYPE_LABELS[inc.type]}</p>
                {inc.address && (
                  <p className="text-xs text-gray-500 mt-0.5 leading-snug">{inc.address}</p>
                )}
                <p className="text-xs text-gray-400 mt-1">{inc.reportedAt}</p>
              </div>
            </Popup>
          </Marker>
        ))}
    </>
  );
}
