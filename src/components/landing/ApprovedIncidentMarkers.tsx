"use client";

import { useState } from "react";
import { Marker, Popup } from "react-map-gl/maplibre";
import { Incident, PublicIncident } from "@/lib/types";

const TYPE_LABELS: Record<Incident["type"], string> = {
  blocked_path: "Blocked Path",
  construction: "Under Construction",
  uneven_sidewalk: "Uneven Sidewalk",
  low_obstacle: "Low Obstacle",
  other: "Other",
};

function PinIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 48" width={32} height={48}>
      <path
        d="M16 0C7.163 0 0 7.163 0 16c0 12 16 32 16 32s16-20 16-32C32 7.163 24.837 0 16 0z"
        fill="#EF4444"
        stroke="white"
        strokeWidth={1.5}
      />
      <circle cx="16" cy="16" r="6" fill="white" />
    </svg>
  );
}

export default function ApprovedIncidentMarkers({ incidents }: { incidents: PublicIncident[] }) {
  // Only one popup is shown at a time — clicking a marker opens its popup and
  // closes whichever one was previously open.
  const [openId, setOpenId] = useState<string | null>(null);
  const openIncident = incidents.find((inc) => inc.id === openId) ?? null;

  return (
    <>
      {incidents.map((inc) => (
        <Marker
          key={inc.id}
          longitude={inc.location.lng}
          latitude={inc.location.lat}
          anchor="bottom"
          onClick={(e) => {
            e.originalEvent.stopPropagation();
            setOpenId(inc.id);
          }}
        >
          <PinIcon />
        </Marker>
      ))}

      {openIncident && (
        <Popup
          longitude={openIncident.location.lng}
          latitude={openIncident.location.lat}
          anchor="bottom"
          offset={48}
          closeOnClick={false}
          onClose={() => setOpenId(null)}
        >
          <div className="min-w-[160px]">
            <p className="font-semibold text-sm text-gray-800">{TYPE_LABELS[openIncident.type]}</p>
            {openIncident.address && (
              <p className="text-xs text-gray-500 mt-0.5 leading-snug">{openIncident.address}</p>
            )}
            <p className="text-xs text-gray-400 mt-1">{openIncident.reportedAt}</p>
          </div>
        </Popup>
      )}
    </>
  );
}
