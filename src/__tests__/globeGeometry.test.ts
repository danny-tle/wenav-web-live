import { globeRadiusPixels, projectAboveGlobe, type GlobeCamera } from "@/lib/globeGeometry";

const cam: GlobeCamera = {
  centerLng: 0,
  centerLat: 0,
  zoom: 1,
  bearing: 0,
  cameraDistance: 1350,
};

describe("projectAboveGlobe", () => {
  it("puts the map center at the middle of the screen", () => {
    const p = projectAboveGlobe(0, 0, 0, cam);
    expect(p.sx).toBeCloseTo(0);
    expect(p.sy).toBeCloseTo(0);
    expect(p.visible).toBe(true);
  });

  it("puts east to the right and north up", () => {
    expect(projectAboveGlobe(30, 0, 0, cam).sx).toBeGreaterThan(0);
    expect(projectAboveGlobe(0, 30, 0, cam).sy).toBeLessThan(0);
  });

  it("hides the far side of the globe", () => {
    expect(projectAboveGlobe(180, 0, 0, cam).visible).toBe(false);
    expect(projectAboveGlobe(120, 0, 0, cam).visible).toBe(false);
  });

  it("lets a tall beam poke out over the horizon even when its base is hidden", () => {
    // Just behind the eastern limb.
    expect(projectAboveGlobe(95, 0, 0, cam).visible).toBe(false);
    const tip = projectAboveGlobe(95, 0, 0.9, cam);
    expect(tip.visible).toBe(true);
    // …and it shows up outside the globe's disc.
    expect(tip.sx).toBeGreaterThan(globeRadiusPixels(cam.zoom, cam.centerLat) * 0.8);
  });

  it("rotates with the map bearing", () => {
    const turned = projectAboveGlobe(30, 0, 0, { ...cam, bearing: 90 });
    // East swings round to point down the screen when the map turns 90°.
    expect(Math.abs(turned.sx)).toBeLessThan(1e-6);
    expect(Math.abs(turned.sy)).toBeGreaterThan(10);
  });
});
