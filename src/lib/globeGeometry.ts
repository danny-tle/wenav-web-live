/**
 * Screen-space geometry for drawing things *above* MapLibre's globe — light
 * beams rising off the surface, which `map.project` can't do because it only
 * knows about points on the ground.
 *
 * Model: a pinhole camera looking straight down at the map center (pitch 0),
 * a sphere of radius `r` pixels whose near surface sits `D` pixels in front of
 * the camera. That's exactly how MapLibre frames the globe at pitch 0, so a
 * point projected here lands where MapLibre draws it.
 */

const DEG = Math.PI / 180;

export interface GlobeCamera {
  /** Map center, degrees. */
  centerLng: number;
  centerLat: number;
  zoom: number;
  /** Map bearing, degrees. */
  bearing: number;
  /** Distance from the camera to the map center, in pixels. */
  cameraDistance: number;
}

/** Same formula as MapLibre's getGlobeRadiusPixels (512px tiles). */
export function globeRadiusPixels(zoom: number, centerLat: number): number {
  const worldSize = 512 * Math.pow(2, zoom);
  return worldSize / (2 * Math.PI) / Math.cos(centerLat * DEG);
}

/**
 * Unit surface normal of (lng, lat) in view space: x right, y up, z toward
 * the camera. z > 0 is the hemisphere facing us.
 */
export function viewNormal(lng: number, lat: number, cam: GlobeCamera) {
  const dLng = (lng - cam.centerLng) * DEG;
  const phi = lat * DEG;
  const phi0 = cam.centerLat * DEG;

  const x = Math.cos(phi) * Math.sin(dLng);
  const y = Math.cos(phi0) * Math.sin(phi) - Math.sin(phi0) * Math.cos(phi) * Math.cos(dLng);
  const z = Math.sin(phi0) * Math.sin(phi) + Math.cos(phi0) * Math.cos(phi) * Math.cos(dLng);

  // Bearing turns the map clockwise; turn screen-space x/y with it.
  const b = -cam.bearing * DEG;
  return {
    x: x * Math.cos(b) - y * Math.sin(b),
    y: x * Math.sin(b) + y * Math.cos(b),
    z,
  };
}

export interface ProjectedPoint {
  /** Offset from the screen center, pixels (y down, like the canvas). */
  sx: number;
  sy: number;
  /** False when the globe is in the way. */
  visible: boolean;
}

/**
 * Project the point `altitude` globe-radii above (lng, lat) onto the screen,
 * and say whether the globe hides it.
 */
export function projectAboveGlobe(
  lng: number,
  lat: number,
  altitude: number,
  cam: GlobeCamera
): ProjectedPoint {
  const r = globeRadiusPixels(cam.zoom, cam.centerLat);
  const D = cam.cameraDistance;
  const n = viewNormal(lng, lat, cam);
  const k = r * (1 + altitude);

  // Camera at the origin looking down +w; globe center at w = D + r.
  const px = k * n.x;
  const py = k * n.y;
  const pw = D + r - k * n.z;

  const sx = (D * px) / pw;
  const sy = (-D * py) / pw;

  // Occlusion: does the ray from the camera hit the sphere before the point?
  // Solve |t·P − S|² = r² for t, with S = (0, 0, D + r).
  const S = D + r;
  const a = px * px + py * py + pw * pw;
  const bHalf = pw * S;
  const c = S * S - r * r;
  const disc = bHalf * bHalf - a * c;
  let visible = true;
  if (disc > 0) {
    const tNear = (bHalf - Math.sqrt(disc)) / a;
    visible = tNear >= 1 - 1e-4;
  }

  return { sx, sy, visible };
}
