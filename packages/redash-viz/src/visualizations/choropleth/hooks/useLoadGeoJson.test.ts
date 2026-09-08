import { geoJsonFromResponse } from "./useLoadGeoJson";

describe("Visualizations -> Choropleth -> geoJsonFromResponse", () => {
  test("returns null instead of throwing when the axios response is null", () => {
    expect(geoJsonFromResponse(null)).toBeNull();
    expect(geoJsonFromResponse(undefined)).toBeNull();
  });

  test("returns GeoJSON from a successful axios payload", () => {
    const collection = { type: "FeatureCollection", features: [] };
    expect(geoJsonFromResponse({ data: collection })).toEqual(collection);
  });

  test("returns null when data is not an object", () => {
    expect(geoJsonFromResponse({ data: "not-json" })).toBeNull();
  });
});
