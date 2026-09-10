"use client";

import { useCallback, useRef, type RefObject } from "react";
import type { MapRef } from "react-map-gl/maplibre";
import { TILT_ZOOM_THRESHOLD, TILTED_PITCH } from "@/lib/mapStyle";

/** Zoom the camera settles at after flying to a searched location. */
const FLY_IN_ZOOM = 17;

/** Slight rotation on fly-in so buildings read as 3D rather than head-on. */
const FLY_IN_BEARING = -17;

export function prefersReducedMotion(): boolean {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
    return false;
  }
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/**
 * Camera behavior shared by every map:
 *
 *  - flat (pitch 0) while zoomed out
 *  - a smooth fly-in when the user picks a search result
 *  - tilted 3D once past TILT_ZOOM_THRESHOLD, easing back to flat on zoom out
 *
 * Motion is skipped entirely for users who ask for reduced motion — the
 * camera jumps and stays flat, since a swooping tilt is exactly the kind of
 * movement that triggers vestibular discomfort.
 */
export function useMapCamera(mapRef: RefObject<MapRef | null>) {
  // Set while we're driving the camera ourselves, so the zoom handler doesn't
  // fight its own easeTo (which would recurse through moveend).
  const animating = useRef(false);

  const beginAnimation = useCallback(
    (map: MapRef) => {
      animating.current = true;
      map.once("moveend", () => {
        animating.current = false;
      });
    },
    []
  );

  /** Tilt in past the threshold, flatten out below it. */
  const syncPitchToZoom = useCallback(() => {
    const map = mapRef.current;
    if (!map || animating.current) return;
    if (prefersReducedMotion()) return;

    const zoom = map.getZoom();
    const pitch = map.getPitch();

    if (zoom >= TILT_ZOOM_THRESHOLD && pitch < TILTED_PITCH - 1) {
      beginAnimation(map);
      map.easeTo({ pitch: TILTED_PITCH, duration: 700 });
    } else if (zoom < TILT_ZOOM_THRESHOLD && pitch > 1) {
      beginAnimation(map);
      map.easeTo({ pitch: 0, bearing: 0, duration: 700 });
    }
  }, [mapRef, beginAnimation]);

  /** Cinematic fly-in to a searched location, ending in the tilted 3D view. */
  const flyToLocation = useCallback(
    (lat: number, lng: number) => {
      const map = mapRef.current;
      if (!map) return;

      if (prefersReducedMotion()) {
        map.jumpTo({ center: [lng, lat], zoom: FLY_IN_ZOOM, pitch: 0, bearing: 0 });
        return;
      }

      beginAnimation(map);
      map.flyTo({
        center: [lng, lat],
        zoom: FLY_IN_ZOOM,
        pitch: TILTED_PITCH,
        bearing: FLY_IN_BEARING,
        duration: 3000,
        // Gentle arc out and back down rather than a straight zoom punch.
        curve: 1.42,
      });
    },
    [mapRef, beginAnimation]
  );

  return { flyToLocation, syncPitchToZoom };
}
