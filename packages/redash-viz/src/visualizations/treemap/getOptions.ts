import { includes, map } from "lodash";

export const DEFAULT_OPTIONS = {
  labelsColName: null,
  parentsColName: null,
  valuesColName: null,
  colorColName: null,
};

export default function getOptions(options: any, { columns }: any = {}) {
  options = {
    ...DEFAULT_OPTIONS,
    ...options,
  };

  const availableColumns = map(columns, (c) => c.name);
  if (!includes(availableColumns, options.labelsColName)) {
    options.labelsColName = availableColumns[0] || null;
  }
  if (options.parentsColName && !includes(availableColumns, options.parentsColName)) {
    options.parentsColName = null;
  }
  if (!includes(availableColumns, options.valuesColName)) {
    options.valuesColName = availableColumns.length > 1 ? availableColumns[1] : availableColumns[0] || null;
  }
  if (options.colorColName && !includes(availableColumns, options.colorColName)) {
    options.colorColName = null;
  }

  return options;
}
