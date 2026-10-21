import type { Coordinate } from "./types";

/**
 * One breadcrumb from `liveLocations/{uid}/track`, as the dashboard needs it.
 *
 * `walkId` and `capturedAtMs` are written by the mobile app from the
 * walk-route fix onward; older points have neither.
 */
export interface TrackPoint {
  location: Coordinate;
  walkId?: string;
  /** When the phone took the GPS fix. Preferred for ordering. */
  capturedAtMs?: number;
  /** Server write time. Points queued offline all share one value. */
  recordedAtMs?: number;
  /** The phone's own error estimate for the fix, in metres. */
  accuracyMeters?: number;
}

/**
 * Fixes the phone reports as worse than this are left out of the line. The app
 * already filters at the same threshold before writing; this holds points from
 * older app builds, or written some other way, to the same standard.
 */
export const MAX_ACCURACY_METERS = 20;

/**
 * Consecutive points farther apart than this are drawn as separate pieces
 * rather than joined. The phone records a point every ~10 m, so a jump this
 * large means GPS dropped out (a building, a tunnel) and a straight line would
 * claim a path nobody walked.
 *
 * Distance only, not time: standing at a crosswalk records nothing (the phone
 * waits for 10 m of movement), and that pause must not break the line.
 */
export const MAX_SEGMENT_GAP_METERS = 100;

const EARTH_RADIUS_METERS = 6_371_000;

/** Great-circle distance between two coordinates, in metres. */
export function distanceMeters(a: Coordinate, b: Coordinate): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_RADIUS_METERS * Math.asin(Math.min(1, Math.sqrt(h)));
}

const orderKey = (point: TrackPoint) =>
  point.capturedAtMs ?? point.recordedAtMs ?? 0;

/**
 * The most recent walk, as line segments ready to draw.
 *
 * Only points sharing the newest point's `walkId` are kept, so one walk is
 * never joined to the next. Points without a `walkId` predate walk tagging and
 * cannot be grouped safely, so they are dropped rather than drawn as a line
 * across town.
 *
 * @param newestFirst points as the track query returns them, newest first.
 * @returns segments in walking order; each has at least two points. Empty when
 *   there is no tagged walk or it has fewer than two points.
 */
export function latestWalkSegments(newestFirst: TrackPoint[]): Coordinate[][] {
  const walkId = newestFirst.find((point) => point.walkId)?.walkId;
  if (!walkId) return [];

  const walk = newestFirst
    .filter((point) => point.walkId === walkId)
    .filter(
      (point) =>
        point.accuracyMeters === undefined ||
        point.accuracyMeters <= MAX_ACCURACY_METERS
    )
    .sort((a, b) => orderKey(a) - orderKey(b));

  const segments: Coordinate[][] = [];
  let current: Coordinate[] = [];
  for (const { location } of walk) {
    const previous = current[current.length - 1];
    if (previous && distanceMeters(previous, location) > MAX_SEGMENT_GAP_METERS) {
      segments.push(current);
      current = [];
    }
    current.push(location);
  }
  segments.push(current);

  return segments.filter((segment) => segment.length > 1);
}
