"use client";

import { ReactNode, useEffect, useRef } from "react";
import { Map as MapGL, NavigationControl, MapRef } from "react-map-gl/maplibre";
import type { ControlPosition } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { MAP_DEFAULTS } from "@/lib/constants";
import { MAP_STYLE, TILTED_PITCH } from "@/lib/mapStyle";
import { useMapCamera } from "@/lib/useMapCamera";

interface MapWrapperProps {
  children?: ReactNode;
  className?: string;
  center?: [number, number];
  zoom?: number;
  scrollWheelZoom?: boolean;
  flyToLocation?: [number, number];
  zoomPosition?: ControlPosition;
}

export default function MapWrapper({
  children,
  className = "h-full w-full",
  center = MAP_DEFAULTS.center,
  zoom = MAP_DEFAULTS.zoom,
  scrollWheelZoom = true,
  flyToLocation,
  zoomPosition = "top-left",
}: MapWrapperProps) {
  const mapRef = useRef<MapRef>(null);
  const { flyToLocation: flyTo, syncPitchToZoom } = useMapCamera(mapRef);

  // Fly in whenever the caller passes a new location (e.g. a geocoded search
  // result). The camera arcs in and settles tilted; useMapCamera keeps the
  // move flat and instant for reduced-motion users.
  useEffect(() => {
    if (!flyToLocation) return;
    flyTo(flyToLocation[0], flyToLocation[1]);
  }, [flyToLocation, flyTo]);

  return (
    <div className={className}>
      <div className="w-full h-full rounded-wenav overflow-hidden">
        <MapGL
          ref={mapRef}
          initialViewState={{
            latitude: center[0],
            longitude: center[1],
            zoom,
          }}
          mapStyle={MAP_STYLE}
          style={{ width: "100%", height: "100%" }}
          scrollZoom={scrollWheelZoom}
          maxPitch={TILTED_PITCH}
          onZoomEnd={syncPitchToZoom}
        >
          <NavigationControl position={zoomPosition} showCompass visualizePitch />
          {children}
        </MapGL>
      </div>
    </div>
  );
}
