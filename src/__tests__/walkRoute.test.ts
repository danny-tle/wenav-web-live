import {
  distanceMeters,
  latestWalkSegments,
  MAX_SEGMENT_GAP_METERS,
  TrackPoint,
} from "@/lib/walkRoute";

// ~11 m of latitude per 0.0001°, so consecutive points here sit at the
// phone's normal ~10 m spacing.
const STEP = 0.0001;
const at = (i: number, lng = -111.891) => ({ lat: 40.76 + i * STEP, lng });

/** A walk as the track query returns it: newest first. */
function walk(walkId: string, count: number, startMs: number): TrackPoint[] {
  return Array.from({ length: count }, (_, i) => ({
    location: at(i),
    walkId,
    capturedAtMs: startMs + i * 5000,
  })).reverse();
}

describe("distanceMeters", () => {
  test("measures a known short distance", () => {
    expect(distanceMeters(at(0), at(1))).toBeCloseTo(11.1, 0);
  });

  test("is zero for the same point", () => {
    expect(distanceMeters(at(3), at(3))).toBe(0);
  });
});

describe("latestWalkSegments", () => {
  test("returns only the newest walk, never joined to the previous one", () => {
    const yesterday = walk("walk-a", 5, 0).map((p) => ({
      ...p,
      location: { lat: p.location.lat + 0.1, lng: p.location.lng + 0.1 },
    }));
    const today = walk("walk-b", 4, 1_000_000);

    const segments = latestWalkSegments([...today, ...yesterday]);

    expect(segments).toEqual([[at(0), at(1), at(2), at(3)]]);
  });

  test("orders by capture time, not by the order points arrived", () => {
    // Uploaded together after being offline: same server time, shuffled.
    const points: TrackPoint[] = [2, 0, 3, 1].map((i) => ({
      location: at(i),
      walkId: "w",
      capturedAtMs: i * 5000,
      recordedAtMs: 99,
    }));

    expect(latestWalkSegments(points)).toEqual([[at(0), at(1), at(2), at(3)]]);
  });

  test("falls back to server time when capture time is missing", () => {
    const points: TrackPoint[] = [1, 0, 2].map((i) => ({
      location: at(i),
      walkId: "w",
      recordedAtMs: i,
    }));

    expect(latestWalkSegments(points)).toEqual([[at(0), at(1), at(2)]]);
  });

  test("breaks the line where GPS dropped out instead of drawing across", () => {
    const jump = 0.003; // ~330 m: well past the gap threshold
    const points: TrackPoint[] = [
      { location: at(0), walkId: "w", capturedAtMs: 0 },
      { location: at(1), walkId: "w", capturedAtMs: 1 },
      { location: { lat: at(1).lat + jump, lng: at(1).lng }, walkId: "w", capturedAtMs: 2 },
      { location: { lat: at(2).lat + jump, lng: at(2).lng }, walkId: "w", capturedAtMs: 3 },
    ].reverse();

    const segments = latestWalkSegments(points);

    expect(segments).toHaveLength(2);
    expect(distanceMeters(segments[0][1], segments[1][0])).toBeGreaterThan(
      MAX_SEGMENT_GAP_METERS
    );
  });

  test("drops a lone point left over after a gap", () => {
    const points: TrackPoint[] = [
      { location: at(0), walkId: "w", capturedAtMs: 0 },
      { location: at(1), walkId: "w", capturedAtMs: 1 },
      { location: { lat: 41, lng: -111 }, walkId: "w", capturedAtMs: 2 },
    ].reverse();

    expect(latestWalkSegments(points)).toEqual([[at(0), at(1)]]);
  });

  test("ignores points recorded before walks were tagged", () => {
    const legacy: TrackPoint[] = [{ location: at(0) }, { location: at(1) }];
    expect(latestWalkSegments(legacy)).toEqual([]);

    const mixed = [...walk("w", 3, 1000), ...legacy];
    expect(latestWalkSegments(mixed)).toEqual([[at(0), at(1), at(2)]]);
  });

  test("returns nothing for an empty track or a single point", () => {
    expect(latestWalkSegments([])).toEqual([]);
    expect(latestWalkSegments(walk("w", 1, 0))).toEqual([]);
  });
});
