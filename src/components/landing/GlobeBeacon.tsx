"use client";

import { useEffect } from "react";
import type { Map as MaplibreMap } from "maplibre-gl";
import { projectAboveGlobe, viewNormal, type GlobeCamera } from "@/lib/globeGeometry";
import { prefersReducedMotion } from "@/lib/useMapCamera";

/** How tall the beam is, in globe radii. */
const BEAM_HEIGHT = 0.9;
/** Fully lit at or below this zoom… */
const FADE_START_ZOOM = 2.2;
/** …and gone by this one, as the camera drops toward the city. */
const FADE_END_ZOOM = 3.6;
/** How long the beam takes to shoot up the first time it's drawn. */
const RISE_MS = 1400;
/** Samples along the beam, for clipping it where the globe hides it. */
const BEAM_SAMPLES = 24;

const BEAM_RGB = "186, 230, 253"; // sky-200
const CORE_RGB = "255, 255, 255";
const GLOW_RGB = "56, 189, 248"; // sky-400

interface GlobeBeaconProps {
  map: MaplibreMap | null;
  /** [lat, lng] the beacon stands on. */
  location: [number, number];
}

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);

/**
 * A beam of light shooting up off the globe at `location`, for the landing
 * intro's "from space" shot. It rises over the horizon as the globe turns,
 * pulses while we're up high, and fades out as the camera dives into the city.
 *
 * Drawn on a 2D canvas laid over the map, since MapLibre can only place
 * things on the ground. Draws nothing (and stops animating) once zoomed in.
 */
export default function GlobeBeacon({ map, location }: GlobeBeaconProps) {
  const [lat, lng] = location;

  useEffect(() => {
    if (!map) return;

    const container = map.getContainer();
    const canvas = document.createElement("canvas");
    canvas.setAttribute("aria-hidden", "true");
    Object.assign(canvas.style, {
      position: "absolute",
      inset: "0",
      width: "100%",
      height: "100%",
      pointerEvents: "none",
    });
    // Above the map, below the markers' popups and the controls.
    container.insertBefore(canvas, map.getCanvasContainer().nextSibling);
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      canvas.remove();
      return;
    }

    const still = prefersReducedMotion();
    let firstDrawAt: number | null = null;
    let frame: number | null = null;

    function camera(): GlobeCamera {
      const center = map!.getCenter();
      // cameraToCenterDistance isn't public API; MapLibre's default 36.87° fov
      // puts the camera 1.5 viewport-heights back, so fall back to that.
      const transform = (map as unknown as { transform?: { cameraToCenterDistance?: number } })
        .transform;
      return {
        centerLng: center.lng,
        centerLat: center.lat,
        zoom: map!.getZoom(),
        bearing: map!.getBearing(),
        cameraDistance: transform?.cameraToCenterDistance ?? 1.5 * container.clientHeight,
      };
    }

    /** Draw one frame. Returns false when there's nothing to show. */
    function draw(now: number): boolean {
      const width = container.clientWidth;
      const height = container.clientHeight;
      const dpr = window.devicePixelRatio || 1;
      if (canvas.width !== Math.round(width * dpr) || canvas.height !== Math.round(height * dpr)) {
        canvas.width = Math.round(width * dpr);
        canvas.height = Math.round(height * dpr);
      }
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx!.clearRect(0, 0, width, height);

      const zoom = map!.getZoom();
      const fade = 1 - clamp01((zoom - FADE_START_ZOOM) / (FADE_END_ZOOM - FADE_START_ZOOM));
      // The geometry assumes a top-down camera; bow out if someone tilts.
      if (fade <= 0 || map!.getPitch() > 5) return false;

      const cam = camera();
      const cx = width / 2;
      const cy = height / 2;
      const n = viewNormal(lng, lat, cam);

      // Wait until the beacon first comes round the horizon, then shoot up.
      const base = projectAboveGlobe(lng, lat, 0, cam);
      const tip = projectAboveGlobe(lng, lat, BEAM_HEIGHT, cam);
      if (firstDrawAt === null) {
        if (!base.visible && !tip.visible) return true;
        firstDrawAt = now;
      }
      const rise = still ? 1 : easeOutCubic(clamp01((now - firstDrawAt) / RISE_MS));
      const pulse = still ? 0.5 : 0.5 + 0.5 * Math.sin(now / 420);

      ctx!.globalCompositeOperation = "lighter";

      // Beam: walk up from the ground, drawing only the stretches the globe
      // doesn't hide — so a beacon just past the horizon still pokes over it.
      const height3d = BEAM_HEIGHT * rise;
      let prev: { x: number; y: number; visible: boolean; t: number } | null = null;
      for (let i = 0; i <= BEAM_SAMPLES; i++) {
        const t = i / BEAM_SAMPLES;
        const p = projectAboveGlobe(lng, lat, height3d * t, cam);
        const point = { x: cx + p.sx, y: cy + p.sy, visible: p.visible, t };
        if (prev && prev.visible && point.visible) {
          // Bright at the ground, thinning out into space.
          const alpha = fade * (1 - prev.t) * (0.75 + 0.25 * pulse);
          for (const [w, rgb, a] of [
            [24, GLOW_RGB, 0.1],
            [10, BEAM_RGB, 0.3],
            [3, CORE_RGB, 0.95],
          ] as const) {
            ctx!.strokeStyle = `rgba(${rgb}, ${a * alpha})`;
            ctx!.lineWidth = w;
            ctx!.lineCap = "round";
            ctx!.beginPath();
            ctx!.moveTo(prev.x, prev.y);
            ctx!.lineTo(point.x, point.y);
            ctx!.stroke();
          }
        }
        prev = point;
      }

      if (base.visible) {
        const bx = cx + base.sx;
        const by = cy + base.sy;
        // The ground glow and rings lie flat on the globe, so squash them
        // toward the limb: a circle seen at an angle is an ellipse.
        const angle = Math.atan2(-n.y, n.x) + Math.PI / 2;
        const squash = Math.max(0.08, n.z);

        // Soft ground glow.
        const glowR = 22 + 6 * pulse;
        const glow = ctx!.createRadialGradient(bx, by, 0, bx, by, glowR);
        glow.addColorStop(0, `rgba(${CORE_RGB}, ${0.95 * fade})`);
        glow.addColorStop(0.25, `rgba(${BEAM_RGB}, ${0.6 * fade})`);
        glow.addColorStop(1, `rgba(${GLOW_RGB}, 0)`);
        ctx!.save();
        ctx!.translate(bx, by);
        ctx!.rotate(angle);
        ctx!.scale(1, squash);
        ctx!.translate(-bx, -by);
        ctx!.fillStyle = glow;
        ctx!.beginPath();
        ctx!.arc(bx, by, glowR, 0, Math.PI * 2);
        ctx!.fill();

        // Two rings rippling outward along the ground.
        if (!still) {
          for (const offset of [0, 0.5]) {
            const phase = ((now / 2200 + offset) % 1 + 1) % 1;
            ctx!.strokeStyle = `rgba(${BEAM_RGB}, ${0.7 * (1 - phase) * fade})`;
            ctx!.lineWidth = 1.5 / squash;
            ctx!.beginPath();
            ctx!.arc(bx, by, 6 + phase * 46, 0, Math.PI * 2);
            ctx!.stroke();
          }
        }
        ctx!.restore();

        // Star flare on top, facing the camera, so the beacon still reads
        // bright when we're looking straight down the beam.
        const spike = (34 + 10 * pulse) * rise;
        ctx!.save();
        ctx!.translate(bx, by);
        ctx!.rotate(Math.PI / 4 + (still ? 0 : now / 6000));
        for (const [len, w, a] of [
          [spike, 2, 0.8],
          [spike * 0.55, 1.5, 0.5],
        ] as const) {
          const g = ctx!.createLinearGradient(-len, 0, len, 0);
          g.addColorStop(0, `rgba(${BEAM_RGB}, 0)`);
          g.addColorStop(0.5, `rgba(${CORE_RGB}, ${a * fade})`);
          g.addColorStop(1, `rgba(${BEAM_RGB}, 0)`);
          ctx!.strokeStyle = g;
          ctx!.lineWidth = w;
          for (let k = 0; k < 2; k++) {
            ctx!.beginPath();
            ctx!.moveTo(-len, 0);
            ctx!.lineTo(len, 0);
            ctx!.stroke();
            ctx!.rotate(Math.PI / 2);
          }
          ctx!.rotate(Math.PI / 4);
        }
        ctx!.restore();
      }

      ctx!.globalCompositeOperation = "source-over";
      return true;
    }

    function loop(now: number) {
      if (draw(now) && !still) {
        frame = requestAnimationFrame(loop);
      } else {
        frame = null;
      }
    }

    // Keep a frame loop going while there's something to animate; otherwise
    // just redraw when the camera moves (e.g. the visitor zooms back out).
    const wake = () => {
      if (frame === null) frame = requestAnimationFrame(loop);
    };
    map.on("move", wake);
    map.on("resize", wake);
    wake();

    return () => {
      map.off("move", wake);
      map.off("resize", wake);
      if (frame !== null) cancelAnimationFrame(frame);
      canvas.remove();
    };
  }, [map, lat, lng]);

  return null;
}
