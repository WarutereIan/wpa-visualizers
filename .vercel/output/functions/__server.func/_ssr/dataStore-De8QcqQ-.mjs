import { c as create, p as persist } from "../_libs/zustand.mjs";
function parseMaybeNumber(v) {
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}
function matchesFilter(row, filter, column) {
  const raw = row[filter.column];
  if (raw === void 0) return false;
  switch (filter.operator) {
    case "eq":
      return String(raw) === filter.value;
    case "neq":
      return String(raw) !== filter.value;
    case "contains":
      return String(raw).toLowerCase().includes(filter.value.toLowerCase());
    case "gt":
    case "gte":
    case "lt":
    case "lte": {
      const left = typeof raw === "number" ? raw : parseMaybeNumber(String(raw));
      const right = parseMaybeNumber(filter.value);
      if (left === null || right === null) return false;
      if (filter.operator === "gt") return left > right;
      if (filter.operator === "gte") return left >= right;
      if (filter.operator === "lt") return left < right;
      return left <= right;
    }
    default:
      return true;
  }
}
function projectRow(row, selected) {
  if (selected.length === 0) return row;
  const out = {};
  selected.forEach((k) => {
    out[k] = row[k] ?? null;
  });
  return out;
}
function runQueryDefinition(table, query) {
  const columnsByName = new Map(table.columns.map((c) => [c.name, c]));
  const filters = query.filters ?? [];
  const groupBy = query.groupBy ?? [];
  const aggregations = query.aggregations ?? [];
  const selectedColumns = query.selectedColumns ?? [];
  const filtered = table.rows.filter(
    (row) => filters.every((f) => matchesFilter(row, f, columnsByName.get(f.column)))
  );
  if (aggregations.length === 0) {
    return filtered.map((r) => projectRow(r, selectedColumns));
  }
  if (groupBy.length === 0) {
    return [computeAggRow(filtered, aggregations)];
  }
  const grouped = /* @__PURE__ */ new Map();
  filtered.forEach((row) => {
    const key = groupBy.map((k) => String(row[k] ?? "")).join("||");
    const list = grouped.get(key);
    if (list) list.push(row);
    else grouped.set(key, [row]);
  });
  return Array.from(grouped.entries()).map(([_, rows]) => {
    const out = {};
    const first = rows[0] ?? {};
    groupBy.forEach((k) => {
      out[k] = first[k] ?? null;
    });
    const aggRow = computeAggRow(rows, aggregations);
    Object.assign(out, aggRow);
    return out;
  });
}
function computeAggRow(rows, aggregations) {
  const out = {};
  aggregations.forEach((agg) => {
    const alias = agg.alias?.trim() || `${agg.operator}_${agg.column || "all"}`;
    if (agg.operator === "count") {
      out[alias] = rows.length;
      return;
    }
    const nums = rows.map((r) => r[agg.column]).map((v) => typeof v === "number" ? v : parseMaybeNumber(String(v ?? ""))).filter((v) => v !== null);
    if (agg.operator === "sum") out[alias] = nums.reduce((a, b) => a + b, 0);
    else out[alias] = nums.length ? nums.reduce((a, b) => a + b, 0) / nums.length : 0;
  });
  return out;
}
const STORAGE_KEY = "wpa-data-layer-v2";
function nowIso() {
  return (/* @__PURE__ */ new Date()).toISOString();
}
function id(prefix) {
  return `${prefix}-${crypto.randomUUID().slice(0, 8)}`;
}
function demoTables() {
  return [
    {
      id: "tbl-households",
      name: "Households",
      columns: [
        { name: "district", type: "string" },
        { name: "program", type: "string" },
        { name: "month", type: "string" },
        { name: "beneficiaries", type: "number" },
        { name: "budget_usd", type: "number" }
      ],
      rows: [
        { district: "North", program: "Meals", month: "Jan", beneficiaries: 1200, budget_usd: 18e3 },
        { district: "North", program: "Meals", month: "Feb", beneficiaries: 1300, budget_usd: 19200 },
        { district: "South", program: "Meals", month: "Jan", beneficiaries: 900, budget_usd: 14200 },
        { district: "East", program: "Cash", month: "Jan", beneficiaries: 1500, budget_usd: 32e3 },
        { district: "West", program: "Cash", month: "Feb", beneficiaries: 1700, budget_usd: 35500 },
        { district: "South", program: "Voucher", month: "Mar", beneficiaries: 800, budget_usd: 12100 }
      ]
    },
    {
      id: "tbl-indicators",
      name: "Indicators",
      columns: [
        { name: "indicator", type: "string" },
        { name: "location", type: "string" },
        { name: "value", type: "number" },
        { name: "target", type: "number" },
        { name: "period", type: "string" }
      ],
      rows: [
        { indicator: "Coverage", location: "North", value: 68, target: 75, period: "2026-Q1" },
        { indicator: "Coverage", location: "South", value: 61, target: 75, period: "2026-Q1" },
        { indicator: "Timeliness", location: "North", value: 82, target: 85, period: "2026-Q1" },
        { indicator: "Timeliness", location: "South", value: 79, target: 85, period: "2026-Q1" },
        { indicator: "Satisfaction", location: "East", value: 74, target: 80, period: "2026-Q1" }
      ]
    }
  ];
}
function demoQueries() {
  const now = nowIso();
  return [
    {
      id: "qry-households-beneficiaries",
      name: "Households by district",
      tableId: "tbl-households",
      selectedColumns: ["district", "beneficiaries"],
      filters: [],
      groupBy: ["district"],
      aggregations: [
        {
          id: "agg-1",
          operator: "sum",
          column: "beneficiaries",
          alias: "beneficiaries"
        }
      ],
      createdAt: now,
      updatedAt: now
    },
    {
      id: "qry-indicator-values",
      name: "Indicator values",
      tableId: "tbl-indicators",
      selectedColumns: ["indicator", "value"],
      filters: [],
      groupBy: ["indicator"],
      aggregations: [
        {
          id: "agg-2",
          operator: "avg",
          column: "value",
          alias: "value"
        }
      ],
      createdAt: now,
      updatedAt: now
    }
  ];
}
const useDataStore = create()(
  persist(
    (set, get) => ({
      version: 1,
      tables: demoTables(),
      queries: demoQueries(),
      getTableById: (tableId) => get().tables.find((t) => t.id === tableId),
      getQueryById: (queryId) => get().queries.find((q) => q.id === queryId),
      runQuery: (queryId) => {
        const query = get().queries.find((q) => q.id === queryId);
        if (!query) return [];
        const table = get().tables.find((t) => t.id === query.tableId);
        if (!table) return [];
        return runQueryDefinition(table, query);
      },
      createQuery: (input) => {
        const now = nowIso();
        const query = {
          id: id("qry"),
          ...input,
          createdAt: now,
          updatedAt: now
        };
        set((s) => ({ queries: [...s.queries, query], version: s.version + 1 }));
        return query;
      },
      updateQuery: (queryId, patch) => {
        set((s) => ({
          queries: s.queries.map(
            (q) => q.id === queryId ? { ...q, ...patch, updatedAt: nowIso() } : q
          ),
          version: s.version + 1
        }));
      },
      removeQuery: (queryId) => {
        set((s) => ({
          queries: s.queries.filter((q) => q.id !== queryId),
          version: s.version + 1
        }));
      },
      addFilter: (queryId) => {
        const query = get().queries.find((q) => q.id === queryId);
        if (!query) return;
        const defaultColumn = query.selectedColumns[0] ?? "";
        const filter = {
          id: id("flt"),
          column: defaultColumn,
          operator: "eq",
          value: ""
        };
        set((s) => ({
          queries: s.queries.map(
            (q) => q.id === queryId ? { ...q, filters: [...q.filters, filter], updatedAt: nowIso() } : q
          ),
          version: s.version + 1
        }));
      },
      updateFilter: (queryId, filterId, patch) => {
        set((s) => ({
          queries: s.queries.map(
            (q) => q.id === queryId ? {
              ...q,
              updatedAt: nowIso(),
              filters: q.filters.map((f) => f.id === filterId ? { ...f, ...patch } : f)
            } : q
          ),
          version: s.version + 1
        }));
      },
      removeFilter: (queryId, filterId) => {
        set((s) => ({
          queries: s.queries.map(
            (q) => q.id === queryId ? { ...q, filters: q.filters.filter((f) => f.id !== filterId), updatedAt: nowIso() } : q
          ),
          version: s.version + 1
        }));
      },
      importTable: ({ name, rows, preferredId }) => {
        const columns = inferColumns(rows);
        const tableId = preferredId?.trim() || `tbl-${name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "")}-${crypto.randomUUID().slice(0, 6)}`;
        const table = {
          id: tableId,
          name: name.trim() || "Imported Table",
          columns,
          rows
        };
        set((s) => ({
          tables: [table, ...s.tables.filter((t) => t.id !== tableId)],
          version: s.version + 1
        }));
        return table;
      }
    }),
    { name: STORAGE_KEY }
  )
);
function inferColumns(rows) {
  const first = rows[0] ?? {};
  const keys = Object.keys(first);
  return keys.map((k) => {
    const sample = rows.find((r) => r[k] !== null && r[k] !== void 0)?.[k];
    const type = typeof sample;
    return {
      name: k,
      type: type === "number" ? "number" : type === "boolean" ? "boolean" : "string"
    };
  });
}
const AGGREGATION_OPERATORS = [
  { value: "sum", label: "SUM" },
  { value: "count", label: "COUNT" },
  { value: "avg", label: "AVG" }
];
function createDefaultAggregation(column = "") {
  return {
    id: id("agg"),
    operator: "sum",
    column,
    alias: column ? `sum_${column}` : "sum_value"
  };
}
export {
  AGGREGATION_OPERATORS as A,
  createDefaultAggregation as c,
  useDataStore as u
};
