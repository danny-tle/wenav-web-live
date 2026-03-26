"use client";

import { ReactNode } from "react";
import { MapContainer, TileLayer } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { MAP_DEFAULTS } from "@/lib/constants";

interface MapWrapperProps {
  children?: ReactNode;
  className?: string;
  center?: [number, number];
  zoom?: number;
  scrollWheelZoom?: boolean;
}

export default function MapWrapper({
  children,
  className = "h-full w-full",
  center = MAP_DEFAULTS.center,
  zoom = MAP_DEFAULTS.zoom,
  scrollWheelZoom = true,
}: MapWrapperProps) {
  return (
    <div className={className}>
      <MapContainer
        center={center}
        zoom={zoom}
        scrollWheelZoom={scrollWheelZoom}
        className="h-full w-full rounded-wenav"
        attributionControl={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
        />
        {children}
      </MapContainer>
    </div>
  );
}
