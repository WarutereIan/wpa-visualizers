import { isNil, merge, first, keys, get, isArray, isPlainObject } from "lodash";
import { visualizationsSettings } from "@/visualizations/visualizationsSettings";
import ColorPalette from "./ColorPalette";

function getDefaultMap() {
  return first(keys(visualizationsSettings.choroplethAvailableMaps)) || null;
}

const NUMERIC_COLUMN_TYPES = new Set(["integer", "float"]);

const DEFAULT_OPTIONS = {
  mapType: "countries",
  keyColumn: null,
  targetField: null,
  valueColumn: null,
  clusteringMode: "e",
  steps: 5,
  valueFormat: "0,0.00",
  noValuePlaceholder: "N/A",
  colors: {
    min: ColorPalette["Light Blue"],
    max: ColorPalette["Dark Blue"],
    background: ColorPalette.White,
    borders: ColorPalette.White,
    noValue: ColorPalette["Light Gray"],
  },
  legend: {
    visible: true,
    position: "bottom-left",
    alignText: "right",
  },
  tooltip: {
    enabled: true,
    template: "<b>{{ @@name }}</b>: {{ @@value }}",
  },
  popup: {
    enabled: true,
    template: "Country: <b>{{ @@name_long }} ({{ @@iso_a2 }})</b>\n<br>\nValue: <b>{{ @@value }}</b>",
  },
};

function omitNullProperties(value: any): any {
  if (!isPlainObject(value)) {
    return value;
  }
  const result: Record<string, unknown> = {};
  Object.keys(value).forEach((key) => {
    const next = value[key];
    if (next === null) {
      return;
    }
    result[key] = omitNullProperties(next);
  });
  return result;
}

function mergeOptions(options: any) {
  return merge({}, DEFAULT_OPTIONS, omitNullProperties(options || {}));
}

function firstColumnMatching(columns: any[], predicate: (column: any) => boolean) {
  const match = columns.find(predicate);
  return match?.name ?? null;
}

export default function getOptions(options: any, data?: any) {
  const result = mergeOptions(options);

  // Both renderer and editor always provide new `bounds` array, so no need to clone it here.
  // Keeping original object also reduces amount of updates in components
  result.bounds = get(options, "bounds");

  if (isNil(get(visualizationsSettings, `choroplethAvailableMaps.${result.mapType}`))) {
    result.mapType = getDefaultMap();
  }

  // backward compatibility
  if (!isNil(result.countryCodeColumn)) {
    result.keyColumn = result.countryCodeColumn;
  }
  delete result.countryCodeColumn;

  if (!isNil(result.countryCodeType)) {
    result.targetField = result.countryCodeType;
  }
  delete result.countryCodeType;

  if (isNil(result.targetField) && result.mapType) {
    const fieldNames = get(
      visualizationsSettings,
      `choroplethAvailableMaps.${result.mapType}.fieldNames`,
      {}
    ) as Record<string, string>;
    result.targetField = fieldNames.code ? "code" : first(keys(fieldNames)) || null;
  }

  const columns = data && isArray(data.columns) ? data.columns : [];
  if (columns.length > 0) {
    if (isNil(result.keyColumn)) {
      result.keyColumn =
        firstColumnMatching(columns, (column) => !NUMERIC_COLUMN_TYPES.has(column?.type)) ?? columns[0].name;
    }
    if (isNil(result.valueColumn)) {
      result.valueColumn = firstColumnMatching(columns, (column) => NUMERIC_COLUMN_TYPES.has(column?.type));
    }
  }

  return result;
}
