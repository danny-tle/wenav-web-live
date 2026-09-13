"use client";

import { ReactNode, useEffect, useRef } from "react";
import {
  MapContainer,
  TileLayer,
  ZoomControl,
  CircleMarker,
  Popup,
  Polyline,
  useMap,
} from "react-leaflet";

import { MAP_DEFAULTS } from "@/lib/constants";
import type { Coordinate, HighRiskArea, TrackedUser, } from "@/lib/types";

interface MapWrapperProps {
  children?: ReactNode;
  className?: string;
  center?: [number, number];
  zoom?: number;
  scrollWheelZoom?: boolean;
  flyToLocation?: [number, number];
  flyToZoom?: number;
  zoomPosition?: "topleft" | "topright" | "bottomleft" | "bottomright";
  riskAreas?: HighRiskArea[];
  selectedLocation?: Coordinate;
  route?: Coordinate[];
  historyPoints?: NonNullable<TrackedUser["history"]>;
}

function MapFlyTo({
  location,
  zoom,
}: {
  location: [number, number];
  zoom: number;
}) {
  const map = useMap();

  useEffect(() => {
    map.flyTo(location, zoom, {
      duration: 1.5,
    });
  }, [location, zoom, map]);

  return null;
}

export default function MapWrapper({
  children,
  className = "h-full w-full",
  center = MAP_DEFAULTS.center,
  zoom = MAP_DEFAULTS.zoom,
  scrollWheelZoom = true,
  flyToLocation,
  flyToZoom = 14,
  zoomPosition = "topleft",
  riskAreas = [],
  selectedLocation,
  route = [],
  historyPoints = [],
}: MapWrapperProps) {
  // const mapKey = useRef(`map-${Date.now()}`).current;

  const routePositions: [number, number][] = route.map(
  (location) => [location.lat, location.lng]
  );

  return (
    <div className={className}>
      <MapContainer
        // key={mapKey}
        center={center}
        zoom={zoom}
        scrollWheelZoom={scrollWheelZoom}
        zoomControl={false}
        className="h-full w-full rounded-wenav"
        attributionControl={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
        />

        <ZoomControl position={zoomPosition} />

        {flyToLocation && (
          <MapFlyTo
            location={flyToLocation}
            zoom={flyToZoom}
          />
        )}

        {riskAreas.map((area) => (
          <CircleMarker
            key={area.id}
            center={[area.lat, area.lng]}
            radius={10}
          >
            <Popup>{area.label}</Popup>
          </CircleMarker>
        ))}

        {/* Draw the selected user's route when
            at least two locations are available = Selected user's route */}
        {routePositions.length > 1 && (
        <Polyline
          positions={routePositions}
          pathOptions={{
            color: "#111827",
            weight: 4,
            opacity: 0.85,
            lineCap: "round",
            lineJoin: "round",
          }}
        />
        )}

        {/* History location points */}
        {historyPoints.map((activity) => (
          <CircleMarker
            key={activity.id}
            center={[
              activity.location.lat,
              activity.location.lng,
            ]}
            radius={6}
            pathOptions={{
              color: "#7c3aed",
              fillColor: "#a78bfa",
              fillOpacity: 0.85,
              weight: 2,
            }}
          >
            <Popup>{activity.title}</Popup>
          </CircleMarker>
        ))}


        {/* Dangerous zone mapping */}
        {selectedLocation && (
          <CircleMarker
            center={[
              selectedLocation.lat,
              selectedLocation.lng,
            ]}
            radius={10}
            pathOptions={{
              color: "#ef4444",
              fillColor: "#ef4444",
              fillOpacity: 0.35,
              weight: 2,
            }}
          >
            <Popup> Current user location</Popup>
          </CircleMarker>
        )}

        {children}
      </MapContainer>
    </div>
  );
}