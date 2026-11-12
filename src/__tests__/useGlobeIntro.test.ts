import { act, renderHook } from "@testing-library/react";
import type { Map as MaplibreMap } from "maplibre-gl";
import { STREET_VIEW, useGlobeIntro } from "@/lib/useGlobeIntro";
import { MAP_DEFAULTS } from "@/lib/constants";
import { TILTED_PITCH } from "@/lib/mapStyle";

/**
 * Stand-in for the MapLibre map. Camera moves finish instantly unless
 * `holdMoves` is set, in which case they stay "in flight" until `endMove()`.
 */
function makeFakeMap({ holdMoves = false } = {}) {
  const handlers: Record<string, Array<() => void>> = {};
  const container = document.createElement("div");

  const fire = (event: string) => {
    const pending = handlers[event] ?? [];
    handlers[event] = [];
    pending.forEach((cb) => cb());
  };
  const move = () => {
    if (!holdMoves) fire("moveend");
  };

  const map = {
    container,
    easeTo: jest.fn(move),
    flyTo: jest.fn(move),
    jumpTo: jest.fn(),
    stop: jest.fn(() => fire("moveend")),
    getContainer: () => container,
    once: jest.fn((event: string, cb: () => void) => {
      (handlers[event] ??= []).push(cb);
      // Tiles are always "ready" in tests.
      if (event === "idle") fire("idle");
    }),
    off: jest.fn((event: string, cb: () => void) => {
      handlers[event] = (handlers[event] ?? []).filter((h) => h !== cb);
    }),
    endMove: () => fire("moveend"),
  };
  return map;
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

/** Let pending promise callbacks run. */
const flush = () => act(async () => {});

beforeEach(() => {
  jest.useFakeTimers();
  setReducedMotion(false);
});

afterEach(() => {
  jest.useRealTimers();
});

describe("useGlobeIntro", () => {
  it("spins the globe, lands on the flat city map, then tilts into 3D", async () => {
    const map = makeFakeMap();
    const { result } = renderHook(() => useGlobeIntro());
    expect(result.current.phase).toBe("idle");

    act(() => {
      void result.current.start(map as unknown as MaplibreMap);
    });
    await flush();

    // Spin round to (just south-east of) us, then fly down to the flat city view.
    const spin = (map.easeTo.mock.calls as unknown as [{ center: [number, number] }][])[0][0];
    const [spinLng, spinLat] = spin.center;
    expect(Math.abs(spinLng - MAP_DEFAULTS.center[1])).toBeLessThan(30);
    expect(Math.abs(spinLat - MAP_DEFAULTS.center[0])).toBeLessThan(30);
    expect(map.flyTo).toHaveBeenCalledWith(
      expect.objectContaining({
        center: [MAP_DEFAULTS.center[1], MAP_DEFAULTS.center[0]],
        zoom: MAP_DEFAULTS.zoom,
        pitch: 0,
      })
    );
    expect(result.current.phase).toBe("city");

    // Hold on the flat map, then tilt into the 3D street view.
    await act(async () => {
      jest.advanceTimersByTime(2000);
    });
    await flush();
    expect(map.flyTo).toHaveBeenLastCalledWith(
      expect.objectContaining({ pitch: TILTED_PITCH, zoom: STREET_VIEW.zoom })
    );
    expect(result.current.phase).toBe("done");
  });

  it("hands control over as soon as the visitor touches the map", async () => {
    const map = makeFakeMap({ holdMoves: true });
    const { result } = renderHook(() => useGlobeIntro());

    act(() => {
      void result.current.start(map as unknown as MaplibreMap);
    });
    await flush();
    expect(result.current.phase).toBe("space");

    act(() => {
      map.container.dispatchEvent(new Event("pointerdown"));
    });
    await flush();

    expect(map.stop).toHaveBeenCalled();
    expect(result.current.phase).toBe("done");
    // The camera stays where the visitor grabbed it — no further flights.
    expect(map.flyTo).not.toHaveBeenCalled();
  });

  it("skip jumps straight to the final street view", async () => {
    const map = makeFakeMap({ holdMoves: true });
    const { result } = renderHook(() => useGlobeIntro());

    act(() => {
      void result.current.start(map as unknown as MaplibreMap);
    });
    await flush();
    act(() => result.current.skip());
    await flush();

    expect(map.jumpTo).toHaveBeenCalledWith(STREET_VIEW);
    expect(result.current.phase).toBe("done");
  });

  it("skips the intro entirely for reduced-motion visitors", async () => {
    setReducedMotion(true);
    const map = makeFakeMap();
    const { result } = renderHook(() => useGlobeIntro());

    act(() => {
      void result.current.start(map as unknown as MaplibreMap);
    });
    await flush();

    expect(map.easeTo).not.toHaveBeenCalled();
    expect(map.flyTo).not.toHaveBeenCalled();
    expect(map.jumpTo).toHaveBeenCalledWith(
      expect.objectContaining({ zoom: MAP_DEFAULTS.zoom, pitch: 0 })
    );
    expect(result.current.phase).toBe("done");
  });

  it("gives the page back if the map never loads", () => {
    const { result } = renderHook(() => useGlobeIntro());
    act(() => {
      jest.advanceTimersByTime(8000);
    });
    expect(result.current.phase).toBe("done");
  });
});
