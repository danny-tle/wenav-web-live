"use client";

import { ReactNode, useEffect, useRef } from "react";
import {
  MapContainer,
  TileLayer,
  ZoomControl,
  CircleMarker,
  Popup,
  useMap,
} from "react-leaflet";

import { MAP_DEFAULTS } from "@/lib/constants";


type RiskArea = {
  id: string;
  address: string;
  latitude: number;
  longitude: number;
};

interface MapWrapperProps {
  children?: ReactNode;
  className?: string;
  center?: [number, number];
  zoom?: number;
  scrollWheelZoom?: boolean;
  flyToLocation?: [number, number];
  flyToZoom?: number;
  zoomPosition?: "topleft" | "topright" | "bottomleft" | "bottomright";
  riskAreas?: RiskArea[];
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
}: MapWrapperProps) {
  const mapKey = useRef(`map-${Date.now()}`).current;

  return (
    <div className={className}>
      <MapContainer
        key={mapKey}
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

        {/* Dangerous zone mapping */}
        {riskAreas.map((area) => (
          <CircleMarker
            key={area.id}
            center={[area.latitude, area.longitude]}
            radius={10}
            pathOptions={{
              color: "#ef4444",
              fillColor: "#ef4444",
              fillOpacity: 0.35,
              weight: 2,
            }}
          >
            <Popup>
              <p className="font-medium">Risk Area</p>
              <p>{area.address}</p>
            </Popup>
          </CircleMarker>
        ))}

        {children}
      </MapContainer>
    </div>
  );
}