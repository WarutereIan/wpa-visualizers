import getOptions from "./getOptions";
import { updateVisualizationsSettings } from "@/visualizations/visualizationsSettings";

const kenyaMaps = {
  "kenya-counties": {
    name: "Kenya Counties",
    url: "/geo/kenya-counties.geojson",
    fieldNames: { name: "Name", code: "Code" },
  },
};

describe("Visualizations -> Choropleth -> getOptions", () => {
  beforeEach(() => {
    updateVisualizationsSettings({ choroplethAvailableMaps: kenyaMaps });
  });

  afterEach(() => {
    updateVisualizationsSettings({ choroplethAvailableMaps: {} });
  });

  test("keeps nested color defaults when saved colors is null", () => {
    const result = getOptions({ mapType: "kenya-counties", colors: null, legend: null });
    expect(result.colors.background).toEqual(expect.any(String));
    expect(result.colors.min).toEqual(expect.any(String));
    expect(result.legend.visible).toBe(true);
  });

  test("defaults targetField to code when the map exposes a code field", () => {
    const result = getOptions({ mapType: "kenya-counties", targetField: null });
    expect(result.targetField).toBe("code");
  });

  test("auto-picks first string column as keyColumn and first numeric as valueColumn", () => {
    const result = getOptions(
      { mapType: "kenya-counties" },
      {
        columns: [
          { name: "county", type: "string" },
          { name: "total", type: "integer" },
        ],
      }
    );
    expect(result.keyColumn).toBe("county");
    expect(result.valueColumn).toBe("total");
  });

  test("does not overwrite explicitly chosen columns", () => {
    const result = getOptions(
      { mapType: "kenya-counties", keyColumn: "iso", valueColumn: "pop" },
      {
        columns: [
          { name: "county", type: "string" },
          { name: "total", type: "integer" },
        ],
      }
    );
    expect(result.keyColumn).toBe("iso");
    expect(result.valueColumn).toBe("pop");
  });

  test("does not mutate shared color defaults across getOptions calls", () => {
    const first = getOptions({ mapType: "kenya-counties", colors: null });
    first.colors.background = "#000000";
    const second = getOptions({ mapType: "kenya-counties" });
    expect(second.colors.background).not.toBe("#000000");
  });
});
