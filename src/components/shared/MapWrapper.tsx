"use client";

import { ReactNode, useEffect, useMemo, useRef, useState } from "react";
import {
  Map as MapGL,
  Marker,
  Popup,
  NavigationControl,
  Source,
  Layer,
  MapRef,
} from "react-map-gl/maplibre";
import type { ControlPosition } from "maplibre-gl";
import type { FeatureCollection, LineString } from "geojson";
import "maplibre-gl/dist/maplibre-gl.css";
import { MAP_DEFAULTS } from "@/lib/constants";
import { MAP_STYLE, TILTED_PITCH } from "@/lib/mapStyle";
import { useMapCamera } from "@/lib/useMapCamera";
import type { Coordinate, HighRiskArea, TrackedUser } from "@/lib/types";

type HistoryPoint = NonNullable<TrackedUser["history"]>[number];

/** A paired person to drop on the map. */
export interface MapPerson {
  id: string;
  name: string;
  location: Coordinate;
  /** False once the position has gone stale — the pin greys and says so. */
  live: boolean;
  lastUpdated?: string;
}

interface MapWrapperProps {
  children?: ReactNode;
  className?: string;
  center?: [number, number];
  zoom?: number;
  scrollWheelZoom?: boolean;
  flyToLocation?: [number, number];
  /** Zoom the camera settles at after a fly-in. Defaults to the shared fly-in zoom. */
  flyToZoom?: number;
  zoomPosition?: ControlPosition;
  /** Admin-flagged high-risk areas. */
  riskAreas?: HighRiskArea[];
  /** Every paired person, each with their own pin. */
  people?: MapPerson[];
  /** Currently focused user or incident location. */
  selectedLocation?: Coordinate;
  /**
   * Popup text for `selectedLocation`. Defaults to the live phrasing; pass the
   * stale wording when the position is only the last one on record.
   */
  selectedLocationLabel?: string;
  /** Ordered path for the selected user's route. */
  route?: Coordinate[];
  /** Individual recorded stops along the route. */
  historyPoints?: HistoryPoint[];
}

/**
 * Which popup is open.
 *
 * Leaflet nested <Popup> inside its marker; MapLibre renders popups as
 * siblings of markers, so the open one is tracked here instead.
 */
type OpenPopup =
  | { kind: "person"; id: string }
  | { kind: "risk"; id: string }
  | { kind: "history"; id: string }
  | { kind: "selected" }
  | null;

export default function MapWrapper({
  children,
  className = "h-full w-full",
  center = MAP_DEFAULTS.center,
  zoom = MAP_DEFAULTS.zoom,
  scrollWheelZoom = true,
  flyToLocation,
  flyToZoom,
  zoomPosition = "top-left",
  riskAreas = [],
  people = [],
  selectedLocation,
  selectedLocationLabel = "Current user location",
  route = [],
  historyPoints = [],
}: MapWrapperProps) {
  const mapRef = useRef<MapRef>(null);
  const { flyToLocation: flyTo, syncPitchToZoom } = useMapCamera(mapRef);
  const [openPopup, setOpenPopup] = useState<OpenPopup>(null);

  // Callers build `flyToLocation` as a fresh array literal each render, so key
  // the effect on the coordinates themselves — otherwise the camera re-flies on
  // every unrelated state change.
  const flyKey = flyToLocation
    ? `${flyToLocation[0]},${flyToLocation[1]},${flyToZoom ?? ""}`
    : null;

  useEffect(() => {
    if (!flyToLocation) return;
    flyTo(flyToLocation[0], flyToLocation[1], flyToZoom);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [flyKey, flyTo]);

  // MapLibre wants [lng, lat]; every Coordinate in the app is {lat, lng}.
  const routeGeoJson = useMemo<FeatureCollection<LineString>>(
    () => ({
      type: "FeatureCollection",
      features:
        route.length > 1
          ? [
              {
                type: "Feature",
                properties: {},
                geometry: {
                  type: "LineString",
                  coordinates: route.map((point) => [point.lng, point.lat]),
                },
              },
            ]
          : [],
    }),
    [route]
  );

  const openRiskArea =
    openPopup?.kind === "risk"
      ? riskAreas.find((area) => area.id === openPopup.id)
      : undefined;

  const openPerson =
    openPopup?.kind === "person"
      ? people.find((person) => person.id === openPopup.id)
      : undefined;

  const openHistoryPoint =
    openPopup?.kind === "history"
      ? historyPoints.find((point) => point.id === openPopup.id)
      : undefined;

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

          {/* Selected user's route */}
          {route.length > 1 && (
            <Source id="wenav-route" type="geojson" data={routeGeoJson}>
              <Layer
                id="wenav-route-line"
                type="line"
                layout={{ "line-cap": "round", "line-join": "round" }}
                paint={{
                  "line-color": "#111827",
                  "line-width": 4,
                  "line-opacity": 0.85,
                }}
              />
            </Source>
          )}

          {/* High-risk areas */}
          {riskAreas.map((area) => (
            <Marker
              key={area.id}
              longitude={area.lng}
              latitude={area.lat}
              anchor="center"
              onClick={(event) => {
                event.originalEvent.stopPropagation();
                setOpenPopup({ kind: "risk", id: area.id });
              }}
            >
              <span className="block h-5 w-5 cursor-pointer rounded-full border-[3px] border-[#3388ff] bg-[#3388ff]/20" />
            </Marker>
          ))}

          {/* Recorded stops along the route */}
          {historyPoints.map((point) => (
            <Marker
              key={point.id}
              longitude={point.location.lng}
              latitude={point.location.lat}
              anchor="center"
              onClick={(event) => {
                event.originalEvent.stopPropagation();
                setOpenPopup({ kind: "history", id: point.id });
              }}
            >
              <span className="block h-3 w-3 cursor-pointer rounded-full border-2 border-[#7c3aed] bg-[#a78bfa]/85" />
            </Marker>
          ))}

          {/* Paired people. A stale pin still shows — it is the last place
              they were seen, which is more useful than no pin at all. */}
          {people.map((person) => (
            <Marker
              key={person.id}
              longitude={person.location.lng}
              latitude={person.location.lat}
              anchor="center"
              onClick={(event) => {
                event.originalEvent.stopPropagation();
                setOpenPopup({ kind: "person", id: person.id });
              }}
            >
              <span
                className={`block h-5 w-5 cursor-pointer rounded-full border-2 ${
                  person.live
                    ? "border-[#5C00F2] bg-[#5C00F2]/35"
                    : "border-gray-400 bg-gray-400/30"
                }`}
              />
            </Marker>
          ))}

          {/* Current location of the selected user / incident */}
          {selectedLocation && (
            <Marker
              longitude={selectedLocation.lng}
              latitude={selectedLocation.lat}
              anchor="center"
              onClick={(event) => {
                event.originalEvent.stopPropagation();
                setOpenPopup({ kind: "selected" });
              }}
            >
              <span className="block h-5 w-5 cursor-pointer rounded-full border-2 border-[#ef4444] bg-[#ef4444]/35" />
            </Marker>
          )}

          {openPerson && (
            <Popup
              longitude={openPerson.location.lng}
              latitude={openPerson.location.lat}
              anchor="bottom"
              closeOnClick={false}
              onClose={() => setOpenPopup(null)}
            >
              <span className="font-semibold">{openPerson.name}</span>
              <br />
              {openPerson.live
                ? "Walking now"
                : `Last known location${
                    openPerson.lastUpdated ? ` · ${openPerson.lastUpdated}` : ""
                  }`}
            </Popup>
          )}

          {openRiskArea && (
            <Popup
              longitude={openRiskArea.lng}
              latitude={openRiskArea.lat}
              anchor="bottom"
              closeOnClick={false}
              onClose={() => setOpenPopup(null)}
            >
              {openRiskArea.label}
            </Popup>
          )}

          {openHistoryPoint && (
            <Popup
              longitude={openHistoryPoint.location.lng}
              latitude={openHistoryPoint.location.lat}
              anchor="bottom"
              closeOnClick={false}
              onClose={() => setOpenPopup(null)}
            >
              {openHistoryPoint.title}
            </Popup>
          )}

          {selectedLocation && openPopup?.kind === "selected" && (
            <Popup
              longitude={selectedLocation.lng}
              latitude={selectedLocation.lat}
              anchor="bottom"
              closeOnClick={false}
              onClose={() => setOpenPopup(null)}
            >
              {selectedLocationLabel}
            </Popup>
          )}

          {children}
        </MapGL>
      </div>
    </div>
  );
}
