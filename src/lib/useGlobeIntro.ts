"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { Map as MaplibreMap } from "maplibre-gl";
import { MAP_DEFAULTS } from "@/lib/constants";
import { TILTED_PITCH } from "@/lib/mapStyle";
import { prefersReducedMotion } from "@/lib/useMapCamera";

/**
 * Where the landing-page intro is:
 *
 *  - idle:   map not loaded yet
 *  - space:  globe spinning round to North America
 *  - city:   dropped into Salt Lake City on the flat incident map
 *  - street: tilted down into the 3D buildings view
 *  - done:   the visitor has the controls
 */
export type IntroPhase = "idle" | "space" | "city" | "street" | "done";

/** [lat, lng] the hero map mounts at — the far side of the world from us. */
export const INTRO_START_CENTER: [number, number] = [15, 60];
/** Zoom the hero map mounts at: the whole globe, small, in space. */
export const INTRO_START_ZOOM = 0.6;

/** MapLibre wants [lng, lat]; MAP_DEFAULTS is [lat, lng]. */
const HOME: [number, number] = [MAP_DEFAULTS.center[1], MAP_DEFAULTS.center[0]];

/**
 * Where the spin comes to rest: a little south-east of us, so Salt Lake City
 * sits up and to the left and its light beam is seen side-on, not end-on.
 */
const SPIN_END: [number, number] = [HOME[0] + 18, HOME[1] - 14];

/** The flat city overview — also where reduced-motion visitors start. */
const CITY_VIEW = { center: HOME, zoom: MAP_DEFAULTS.zoom, pitch: 0, bearing: 0 };

/** The tilted 3D street view the intro ends on. */
export const STREET_VIEW = {
  center: HOME,
  zoom: 16.5,
  pitch: TILTED_PITCH,
  bearing: -17,
};

/** Durations (ms). Tuned so the whole intro runs ~14s. */
const TIMING = {
  /** Max wait for the first tiles before spinning anyway. */
  firstPaint: 1500,
  spin: 4000,
  flyIn: 4500,
  cityHold: 1600,
  tilt: 3200,
  /** If the map never loads (no WebGL, etc.), give the page back after this. */
  loadTimeout: 8000,
};

const easeInOutCubic = (t: number) =>
  t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

class IntroAborted extends Error {}

/** Run one camera move and resolve when it ends, or reject if aborted. */
function animate(map: MaplibreMap, signal: AbortSignal, run: () => void): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal.aborted) return reject(new IntroAborted());
    const onEnd = () => {
      signal.removeEventListener("abort", onAbort);
      resolve();
    };
    const onAbort = () => {
      map.off("moveend", onEnd);
      reject(new IntroAborted());
    };
    map.once("moveend", onEnd);
    signal.addEventListener("abort", onAbort, { once: true });
    run();
  });
}

function wait(ms: number, signal: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal.aborted) return reject(new IntroAborted());
    const timer = setTimeout(() => {
      signal.removeEventListener("abort", onAbort);
      resolve();
    }, ms);
    const onAbort = () => {
      clearTimeout(timer);
      reject(new IntroAborted());
    };
    signal.addEventListener("abort", onAbort, { once: true });
  });
}

/** Resolve once the first tiles have drawn, or after `ms`, whichever is first. */
function firstIdle(map: MaplibreMap, ms: number, signal: AbortSignal): Promise<void> {
  return Promise.race([
    new Promise<void>((resolve) => map.once("idle", () => resolve())),
    wait(ms, signal),
  ]);
}

/** Any of these on the map (or its controls) means the visitor wants the wheel. */
const TAKEOVER_EVENTS = ["pointerdown", "wheel", "touchstart", "keydown"] as const;

/**
 * Landing-page intro: start in space, spin the globe, fly into Salt Lake
 * City's flat incident map, then tilt down into the 3D street view.
 *
 * Mount the map at INTRO_START_CENTER / INTRO_START_ZOOM with
 * HERO_GLOBE_STYLE, and call `start` from the map's load event.
 *
 * Touching the map at any point hands control straight over, wherever the
 * camera happens to be. `skip` jumps to the final street view. Visitors who
 * prefer reduced motion never see the intro — they land on the flat city map.
 */
export function useGlobeIntro() {
  const [phase, setPhaseState] = useState<IntroPhase>("idle");
  const phaseRef = useRef<IntroPhase>("idle");
  const mapRef = useRef<MaplibreMap | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const setPhase = useCallback((next: IntroPhase) => {
    phaseRef.current = next;
    setPhaseState(next);
  }, []);

  /** Stop the intro where it is and hand the map over. */
  const finish = useCallback(() => {
    if (phaseRef.current === "done") return;
    abortRef.current?.abort();
    mapRef.current?.stop();
    setPhase("done");
  }, [setPhase]);

  const start = useCallback(
    async (map: MaplibreMap) => {
      if (mapRef.current) return;
      mapRef.current = map;

      // Load timed out earlier and the page already moved on — just settle on
      // the city rather than leaving the visitor floating in space.
      if (phaseRef.current === "done" || prefersReducedMotion()) {
        map.jumpTo(CITY_VIEW);
        setPhase("done");
        return;
      }

      const controller = new AbortController();
      abortRef.current = controller;
      const { signal } = controller;

      const container = map.getContainer();
      TAKEOVER_EVENTS.forEach((type) =>
        container.addEventListener(type, finish, { passive: true })
      );
      const cleanup = () =>
        TAKEOVER_EVENTS.forEach((type) => container.removeEventListener(type, finish));

      try {
        await firstIdle(map, TIMING.firstPaint, signal);

        setPhase("space");
        await animate(map, signal, () =>
          map.easeTo({
            center: SPIN_END,
            // Still the whole globe in frame, just a touch closer.
            zoom: 1.3,
            bearing: 0,
            duration: TIMING.spin,
            easing: easeInOutCubic,
            // We handle reduced motion ourselves above.
            essential: true,
          })
        );

        await animate(map, signal, () =>
          map.flyTo({ ...CITY_VIEW, duration: TIMING.flyIn, curve: 1.2, essential: true })
        );

        setPhase("city");
        await wait(TIMING.cityHold, signal);

        setPhase("street");
        await animate(map, signal, () =>
          map.flyTo({ ...STREET_VIEW, duration: TIMING.tilt, curve: 1.2, essential: true })
        );

        setPhase("done");
      } catch (err) {
        if (!(err instanceof IntroAborted)) throw err;
      } finally {
        cleanup();
      }
    },
    [finish, setPhase]
  );

  /** Jump straight to where the intro would have ended. */
  const skip = useCallback(() => {
    finish();
    mapRef.current?.jumpTo(STREET_VIEW);
  }, [finish]);

  // Never hold the search bar hostage to a map that won't load.
  useEffect(() => {
    const timer = setTimeout(() => {
      if (phaseRef.current === "idle") setPhase("done");
    }, TIMING.loadTimeout);
    return () => clearTimeout(timer);
  }, [setPhase]);

  // Stop driving the camera if the hero unmounts mid-flight.
  useEffect(() => () => abortRef.current?.abort(), []);

  return { phase, start, skip };
}
