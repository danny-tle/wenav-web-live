import type { StyleSpecification } from "maplibre-gl";

/**
 * Basemap style shared by every map in the app.
 *
 * History / why this is what it is:
 *  - We originally used CARTO's raster "light_all" basemap (under Leaflet).
 *    CARTO now stamps "API KEY REQUIRED" across every tile unless you sign
 *    up for an account, so we can't use it as-is.
 *  - OpenFreeMap's vector "positron" style is a good keyless replacement,
 *    but vector styles pull glyphs/sprites/TileJSON from several endpoints
 *    and were rendering blank locally, so it's parked below.
 *  - Esri's World Light Gray Base is a keyless raster basemap with the same
 *    light-gray cartography, and raster is the simplest thing that renders.
 *
 * Swap MAP_STYLE to one of the alternatives below to change basemaps.
 */

const ESRI_ATTRIBUTION =
  'Tiles &copy; <a href="https://www.esri.com/" target="_blank" rel="noreferrer">Esri</a> &mdash; Esri, HERE, Garmin, &copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap</a> contributors';

export const ESRI_LIGHT_GRAY_STYLE: StyleSpecification = {
  version: 8,
  sources: {
    basemap: {
      type: "raster",
      tiles: [
        "https://services.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}",
      ],
      tileSize: 256,
      maxzoom: 16,
      attribution: ESRI_ATTRIBUTION,
    },
  },
  layers: [
    {
      id: "basemap-layer",
      type: "raster",
      source: "basemap",
      minzoom: 0,
      maxzoom: 20,
    },
  ],
};

/** Zoom at which the camera tilts into the 3D view and buildings appear. */
export const TILT_ZOOM_THRESHOLD = 15;

/** Pitch (degrees) used for the tilted "street level" view. */
export const TILTED_PITCH = 55;

/** Layer id of the extruded buildings, so components can toggle it. */
export const BUILDINGS_LAYER_ID = "3d-buildings";

/**
 * Raster basemap + a vector source used *only* to extrude buildings.
 *
 * The raster base is what guarantees something always renders: if the vector
 * tiles fail (they need MapLibre's web worker to parse .pbf data), you still
 * get a usable flat map instead of a blank canvas — you just lose the
 * building extrusions.
 */
export const HYBRID_3D_STYLE: StyleSpecification = {
  version: 8,
  sources: {
    basemap: {
      type: "raster",
      tiles: [
        "https://services.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}",
      ],
      tileSize: 256,
      maxzoom: 16,
      attribution: ESRI_ATTRIBUTION,
    },
    openmaptiles: {
      type: "vector",
      url: "https://tiles.openfreemap.org/planet",
    },
  },
  layers: [
    {
      id: "basemap-layer",
      type: "raster",
      source: "basemap",
      minzoom: 0,
      maxzoom: 20,
    },
    {
      id: BUILDINGS_LAYER_ID,
      type: "fill-extrusion",
      source: "openmaptiles",
      "source-layer": "building",
      minzoom: TILT_ZOOM_THRESHOLD - 1,
      paint: {
        "fill-extrusion-color": "#d7d7de",
        // OpenMapTiles ships render_height/render_min_height on buildings;
        // fall back to a nominal height when a footprint has no height data.
        "fill-extrusion-height": ["coalesce", ["get", "render_height"], 8],
        "fill-extrusion-base": ["coalesce", ["get", "render_min_height"], 0],
        // Fade the extrusions in rather than popping them on at the threshold.
        "fill-extrusion-opacity": [
          "interpolate",
          ["linear"],
          ["zoom"],
          TILT_ZOOM_THRESHOLD - 1,
          0,
          TILT_ZOOM_THRESHOLD + 0.5,
          0.9,
        ],
      },
    },
  ],
};

/** Keyless vector alternative — swap in if you'd rather have vector tiles. */
export const OPENFREEMAP_POSITRON_STYLE = "https://tiles.openfreemap.org/styles/positron";

/** Previous CARTO raster basemap — needs an API key to render unwatermarked. */
export const CARTO_LIGHT_RASTER_STYLE: StyleSpecification = {
  version: 8,
  sources: {
    "carto-light": {
      type: "raster",
      tiles: [
        "https://a.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png",
        "https://b.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png",
        "https://c.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png",
        "https://d.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png",
      ],
      tileSize: 256,
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/" target="_blank" rel="noreferrer">CARTO</a>',
    },
  },
  layers: [
    {
      id: "carto-light-layer",
      type: "raster",
      source: "carto-light",
      minzoom: 0,
      maxzoom: 20,
    },
  ],
};

export const MAP_STYLE = HYBRID_3D_STYLE;
