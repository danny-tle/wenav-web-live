import { renderHook } from "@testing-library/react";
import { useMapCamera } from "@/lib/useMapCamera";
import { TILT_ZOOM_THRESHOLD, TILTED_PITCH } from "@/lib/mapStyle";
import type { MapRef } from "react-map-gl/maplibre";

// Minimal stand-in for the bits of the map ref the camera hook touches.
function makeFakeMap({ zoom = 13, pitch = 0 }: { zoom?: number; pitch?: number } = {}) {
  return {
    flyTo: jest.fn(),
    easeTo: jest.fn(),
    jumpTo: jest.fn(),
    getZoom: jest.fn(() => zoom),
    getPitch: jest.fn(() => pitch),
    // Fire the one-shot moveend right away so the hook's animating guard clears.
    once: jest.fn((_event: string, cb: () => void) => cb()),
  };
}

function renderCamera(fakeMap: ReturnType<typeof makeFakeMap> | null) {
  const ref = { current: fakeMap as unknown as MapRef | null };
  return renderHook(() => useMapCamera(ref));
}

function setReducedMotion(reduce: boolean) {
  Object.defineProperty(window, "matchMedia", {
    writable: true,
    configurable: true,
    value: jest.fn().mockImplementation((query: string) => ({
      matches: reduce,
      media: query,
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
    })),
  });
}

beforeEach(() => {
  jest.clearAllMocks();
  setReducedMotion(false);
});

describe("useMapCamera — fly-in", () => {
  it("flies to the target tilted, rotated, and zoomed in", () => {
    const map = makeFakeMap();
    const { result } = renderCamera(map);

    result.current.flyToLocation(40.7608, -111.891);

    expect(map.flyTo).toHaveBeenCalledWith(
      expect.objectContaining({
        center: [-111.891, 40.7608],
        pitch: TILTED_PITCH,
        zoom: 17,
      })
    );
  });

  it("converts [lat, lng] to MapLibre's [lng, lat] ordering", () => {
    const map = makeFakeMap();
    const { result } = renderCamera(map);

    result.current.flyToLocation(40.7608, -111.891);

    const { center } = map.flyTo.mock.calls[0][0];
    expect(center).toEqual([-111.891, 40.7608]);
  });

  it("does nothing when the map isn't mounted yet", () => {
    const { result } = renderCamera(null);
    expect(() => result.current.flyToLocation(40, -111)).not.toThrow();
  });
});

describe("useMapCamera — tilt follows zoom", () => {
  it("tilts into 3D once zoomed past the threshold", () => {
    const map = makeFakeMap({ zoom: TILT_ZOOM_THRESHOLD + 1, pitch: 0 });
    const { result } = renderCamera(map);

    result.current.syncPitchToZoom();

    expect(map.easeTo).toHaveBeenCalledWith(
      expect.objectContaining({ pitch: TILTED_PITCH })
    );
  });

  it("flattens back to 2D when zoomed out below the threshold", () => {
    const map = makeFakeMap({ zoom: TILT_ZOOM_THRESHOLD - 2, pitch: TILTED_PITCH });
    const { result } = renderCamera(map);

    result.current.syncPitchToZoom();

    expect(map.easeTo).toHaveBeenCalledWith(
      expect.objectContaining({ pitch: 0, bearing: 0 })
    );
  });

  it("leaves the camera alone when it's already tilted and still zoomed in", () => {
    const map = makeFakeMap({ zoom: TILT_ZOOM_THRESHOLD + 1, pitch: TILTED_PITCH });
    const { result } = renderCamera(map);

    result.current.syncPitchToZoom();

    expect(map.easeTo).not.toHaveBeenCalled();
  });

  it("leaves the camera alone when it's already flat and still zoomed out", () => {
    const map = makeFakeMap({ zoom: TILT_ZOOM_THRESHOLD - 2, pitch: 0 });
    const { result } = renderCamera(map);

    result.current.syncPitchToZoom();

    expect(map.easeTo).not.toHaveBeenCalled();
  });
});

describe("useMapCamera — reduced motion", () => {
  it("jumps flat instead of flying when the user asks for reduced motion", () => {
    setReducedMotion(true);
    const map = makeFakeMap();
    const { result } = renderCamera(map);

    result.current.flyToLocation(40.7608, -111.891);

    expect(map.flyTo).not.toHaveBeenCalled();
    expect(map.jumpTo).toHaveBeenCalledWith(
      expect.objectContaining({ center: [-111.891, 40.7608], pitch: 0 })
    );
  });

  it("never tilts the camera for reduced-motion users", () => {
    setReducedMotion(true);
    const map = makeFakeMap({ zoom: TILT_ZOOM_THRESHOLD + 1, pitch: 0 });
    const { result } = renderCamera(map);

    result.current.syncPitchToZoom();

    expect(map.easeTo).not.toHaveBeenCalled();
  });
});
