import { isArray, isFinite, includes, map } from "lodash";
import ColorPalette from "@/visualizations/ColorPalette";

const DEFAULT_THRESHOLDS = [
  { range: [0, 50], color: ColorPalette.Green },
  { range: [50, 80], color: ColorPalette.Orange },
  { range: [80, 100], color: ColorPalette.Red },
];

export const DEFAULT_OPTIONS = {
  counterColName: null,
  rowNumber: 1,
  min: 0,
  max: 100,
  thresholds: DEFAULT_THRESHOLDS,
  deltaColName: null,
  deltaReference: null,
};

function cloneThresholds(thresholds: any) {
  return map(thresholds, (threshold) => ({
    range: isArray(threshold?.range) ? [...threshold.range] : [0, 0],
    color: threshold?.color || ColorPalette.Gray,
  }));
}

export default function getOptions(options: any, { columns }: any = {}) {
  const thresholds =
    isArray(options?.thresholds) && options.thresholds.length > 0
      ? cloneThresholds(options.thresholds)
      : cloneThresholds(DEFAULT_THRESHOLDS);

  options = {
    ...DEFAULT_OPTIONS,
    ...options,
    thresholds,
  };

  const availableColumns = map(columns, (c) => c.name);
  if (!includes(availableColumns, options.counterColName)) {
    options.counterColName = availableColumns[0] || null;
  }
  if (options.deltaColName && !includes(availableColumns, options.deltaColName)) {
    options.deltaColName = null;
  }

  if (!isFinite(options.min)) {
    options.min = DEFAULT_OPTIONS.min;
  }
  if (!isFinite(options.max)) {
    options.max = DEFAULT_OPTIONS.max;
  }
  if (options.max <= options.min) {
    options.max = options.min + 1;
  }

  if (!isFinite(options.rowNumber)) {
    options.rowNumber = DEFAULT_OPTIONS.rowNumber;
  }

  if (options.deltaReference != null && !isFinite(Number(options.deltaReference))) {
    options.deltaReference = null;
  }

  return options;
}
