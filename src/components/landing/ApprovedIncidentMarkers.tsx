"use client";

import { useEffect, useRef, useState } from "react";
import { ZoomOut } from "lucide-react";
import { Marker, Popup, useMap, type MapRef } from "react-map-gl/maplibre";
import { Incident, PublicIncident } from "@/lib/types";
import { prefersReducedMotion, useMapCamera } from "@/lib/useMapCamera";
import { MAP_DEFAULTS } from "@/lib/constants";
import { TILT_ZOOM_THRESHOLD } from "@/lib/mapStyle";
import { tourSignal } from "@/lib/tourSignal";

/** A camera position to come back to. */
interface CameraView {
  center: [number, number];
  zoom: number;
  pitch: number;
  bearing: number;
}

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

  // Clicking a pin flies down to it at street level, using the same tilted
  // fly-in as search.
  const { current: map } = useMap();
  const mapRef = useRef<MapRef | null>(null);
  mapRef.current = map ?? null;
  const { flyToLocation } = useMapCamera(mapRef);

  // Where to go when the visitor hits "Zoom out". Set on the first pin click
  // and kept through any further ones, so one click takes you all the way back.
  const [returnView, setReturnView] = useState<CameraView | null>(null);

  function selectIncident(inc: PublicIncident) {
    setOpenId(inc.id);
    if (map && !returnView) {
      const zoom = map.getZoom();
      const center = map.getCenter();
      setReturnView(
        // Already at street level? "Back" would just be more street level, so
        // pull out to the flat city view around the pin instead.
        zoom < TILT_ZOOM_THRESHOLD
          ? { center: [center.lng, center.lat], zoom, pitch: map.getPitch(), bearing: map.getBearing() }
          : { center: [inc.location.lng, inc.location.lat], zoom: MAP_DEFAULTS.zoom, pitch: 0, bearing: 0 }
      );
    }
    flyToLocation(inc.location.lat, inc.location.lng);
    tourSignal("pin-opened");
  }

  function zoomOut() {
    if (!map || !returnView) return;
    setOpenId(null);
    setReturnView(null);
    tourSignal("zoomed-out");
    if (prefersReducedMotion()) {
      map.jumpTo(returnView);
      return;
    }
    map.flyTo({ ...returnView, duration: 2200, curve: 1.42 });
  }

  // If the visitor zooms back out on their own, the button has done its job.
  useEffect(() => {
    if (!map || !returnView) return;
    const onZoomEnd = () => {
      if (map.getZoom() < TILT_ZOOM_THRESHOLD) setReturnView(null);
    };
    map.on("zoomend", onZoomEnd);
    return () => {
      map.off("zoomend", onZoomEnd);
    };
  }, [map, returnView]);

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
            selectIncident(inc);
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

      {returnView && (
        <div className="pointer-events-none absolute bottom-12 left-0 right-0 z-10 flex justify-center px-4">
          <button
            type="button"
            onClick={zoomOut}
            data-tour="home-zoom-out"
            className="pointer-events-auto flex items-center gap-2 rounded-full bg-wenav-dark px-4 py-2.5 text-sm font-semibold text-white shadow-lg transition-colors hover:bg-wenav-dark/85"
          >
            <ZoomOut size={16} aria-hidden="true" />
            Zoom out
          </button>
        </div>
      )}
    </>
  );
}
