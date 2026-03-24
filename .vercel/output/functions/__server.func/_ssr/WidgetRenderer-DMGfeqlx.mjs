import { j as jsxRuntimeExports, r as reactExports } from "../_libs/react.mjs";
import { E as EChartsReact } from "../_libs/echarts-for-react.mjs";
import { u as useQuery } from "../_libs/tanstack__react-query.mjs";
import { u as useDataStore } from "./dataStore-De8QcqQ-.mjs";
import { u as useReactTable, f as flexRender } from "../_libs/tanstack__react-table.mjs";
import { R as ResponsiveContainer, C as ComposedChart, a as CartesianGrid, X as XAxis, Y as YAxis, T as Tooltip, L as Legend, B as Bar, b as Line } from "../_libs/recharts.mjs";
import { g as getCoreRowModel } from "../_libs/tanstack__table-core.mjs";
function deriveChartRows(rows, bindings) {
  const first = rows[0] ?? {};
  const keys = Object.keys(first);
  const xKey = bindings?.xKey ?? keys.find((k) => typeof first[k] === "string") ?? keys[0] ?? "name";
  const yKey = bindings?.yKey ?? keys.find((k) => typeof first[k] === "number") ?? keys[1] ?? "value";
  return rows.map((r, idx) => ({
    name: String(r[xKey] ?? `Row ${idx + 1}`),
    value: Number(r[yKey] ?? 0)
  }));
}
function useDemoDataset(dataSourceId, bindings, enabled = true) {
  const version = useDataStore((s) => s.version);
  const runQuery = useDataStore((s) => s.runQuery);
  return useQuery({
    queryKey: ["dataset", "query", dataSourceId, bindings?.xKey, bindings?.yKey, version],
    queryFn: async () => {
      await new Promise((r) => setTimeout(r, 120));
      if (!dataSourceId) return [];
      const rows = runQuery(dataSourceId);
      return deriveChartRows(rows, bindings);
    },
    enabled: enabled && !!dataSourceId,
    placeholderData: (prev) => prev
  });
}
function useDatasetRows(dataSourceId, enabled = true) {
  const version = useDataStore((s) => s.version);
  const runQuery = useDataStore((s) => s.runQuery);
  return useQuery({
    queryKey: ["dataset", "raw", dataSourceId, version],
    queryFn: async () => {
      await new Promise((r) => setTimeout(r, 120));
      if (!dataSourceId) return [];
      return runQuery(dataSourceId);
    },
    enabled: enabled && !!dataSourceId,
    placeholderData: (prev) => prev
  });
}
const LAGOON = "#4fb8b2";
const LAGOON_D = "#328f97";
const PALM = "#6b9f7a";
const SAND = "#c4a574";
const CORAL = "#e07b63";
const SLATE = "#7b8fa3";
const SERIES_COLORS = [LAGOON, PALM, SAND, CORAL, SLATE, LAGOON_D, "#a070c0", "#5aa0d0"];
function names(rows) {
  return rows.map((r) => r.name);
}
function vals(rows) {
  return rows.map((r) => r.value);
}
function peak(rows) {
  return Math.max(1, ...rows.map((r) => r.value));
}
function baseTitle(title) {
  return { text: title, left: "center", top: 4, textStyle: { fontSize: 13, color: "#1e3a3a" } };
}
const cartGrid = { left: "8%", right: "4%", bottom: "8%", top: 44, containLabel: true };
function buildEChartsOption(kind, title, rows) {
  const ns = names(rows);
  const vs = vals(rows);
  const mx = peak(rows);
  switch (kind) {
    /* ── Comparison ────────────────────────────────── */
    case "bar":
      return {
        title: baseTitle(title),
        tooltip: { trigger: "axis" },
        grid: cartGrid,
        xAxis: { type: "category", data: ns },
        yAxis: { type: "value" },
        series: [{ type: "bar", data: vs, itemStyle: { color: LAGOON }, barMaxWidth: 40 }]
      };
    case "stacked_bar":
      return {
        title: baseTitle(title),
        tooltip: { trigger: "axis" },
        legend: { bottom: 0, textStyle: { fontSize: 10 } },
        grid: { ...cartGrid, bottom: "14%" },
        xAxis: { type: "category", data: ns },
        yAxis: { type: "value" },
        series: [
          { name: "Series A", type: "bar", stack: "s", data: vs, itemStyle: { color: LAGOON }, barMaxWidth: 40 },
          { name: "Series B", type: "bar", stack: "s", data: vs.map((v) => Math.round(v * 0.6)), itemStyle: { color: PALM }, barMaxWidth: 40 }
        ]
      };
    case "horizontal_bar":
      return {
        title: baseTitle(title),
        tooltip: { trigger: "axis" },
        grid: cartGrid,
        yAxis: { type: "category", data: ns, inverse: true },
        xAxis: { type: "value" },
        series: [{ type: "bar", data: vs, itemStyle: { color: LAGOON }, barMaxWidth: 28 }]
      };
    case "radar":
      return {
        title: baseTitle(title),
        tooltip: {},
        radar: { indicator: rows.map((r) => ({ name: r.name, max: mx })) },
        series: [{ type: "radar", data: [{ value: vs, name: title }], areaStyle: { opacity: 0.2 }, lineStyle: { color: LAGOON } }]
      };
    /* ── Trend ─────────────────────────────────────── */
    case "line":
      return {
        title: baseTitle(title),
        tooltip: { trigger: "axis" },
        grid: cartGrid,
        xAxis: { type: "category", data: ns },
        yAxis: { type: "value" },
        series: [{ type: "line", smooth: true, data: vs, lineStyle: { color: PALM }, itemStyle: { color: PALM } }]
      };
    case "area":
      return {
        title: baseTitle(title),
        tooltip: { trigger: "axis" },
        grid: cartGrid,
        xAxis: { type: "category", boundaryGap: false, data: ns },
        yAxis: { type: "value" },
        series: [{ type: "line", smooth: true, data: vs, areaStyle: { opacity: 0.25, color: LAGOON }, lineStyle: { color: LAGOON } }]
      };
    case "stacked_area":
      return {
        title: baseTitle(title),
        tooltip: { trigger: "axis" },
        legend: { bottom: 0, textStyle: { fontSize: 10 } },
        grid: { ...cartGrid, bottom: "14%" },
        xAxis: { type: "category", boundaryGap: false, data: ns },
        yAxis: { type: "value" },
        series: [
          { name: "Set A", type: "line", stack: "total", areaStyle: { opacity: 0.3 }, data: vs, lineStyle: { color: LAGOON }, itemStyle: { color: LAGOON } },
          { name: "Set B", type: "line", stack: "total", areaStyle: { opacity: 0.3 }, data: vs.map((v) => Math.round(v * 0.5)), lineStyle: { color: PALM }, itemStyle: { color: PALM } }
        ]
      };
    /* ── Part-to-whole ─────────────────────────────── */
    case "pie":
      return {
        title: baseTitle(title),
        tooltip: { trigger: "item" },
        series: [{ type: "pie", radius: "65%", data: rows.map((r, i) => ({ name: r.name, value: r.value, itemStyle: { color: SERIES_COLORS[i % SERIES_COLORS.length] } })), label: { fontSize: 10 } }]
      };
    case "donut":
      return {
        title: baseTitle(title),
        tooltip: { trigger: "item" },
        series: [{ type: "pie", radius: ["40%", "70%"], data: rows.map((r, i) => ({ name: r.name, value: r.value, itemStyle: { color: SERIES_COLORS[i % SERIES_COLORS.length] } })), label: { fontSize: 10 } }]
      };
    case "sunburst":
      return {
        title: baseTitle(title),
        tooltip: { trigger: "item" },
        series: [{ type: "sunburst", radius: ["15%", "90%"], data: [{ name: "root", children: rows.map((r) => ({ name: r.name, value: r.value })) }], label: { fontSize: 9 } }]
      };
    case "treemap":
      return {
        title: baseTitle(title),
        tooltip: { trigger: "item" },
        series: [{ type: "treemap", roam: false, data: rows.map((r) => ({ name: r.name, value: r.value })), label: { fontSize: 10 }, upperLabel: { show: true } }]
      };
    case "funnel":
      return {
        title: baseTitle(title),
        tooltip: { trigger: "item" },
        series: [{ type: "funnel", sort: "descending", data: rows.map((r) => ({ name: r.name, value: r.value })) }]
      };
    /* ── Correlation ───────────────────────────────── */
    case "scatter":
      return {
        title: baseTitle(title),
        tooltip: { trigger: "item" },
        grid: cartGrid,
        xAxis: { type: "value", name: "Index" },
        yAxis: { type: "value", name: "Value" },
        series: [{ type: "scatter", data: rows.map((r, i) => [i, r.value]), symbolSize: 14, itemStyle: { color: LAGOON } }]
      };
    case "bubble":
      return {
        title: baseTitle(title),
        tooltip: { trigger: "item" },
        grid: cartGrid,
        xAxis: { type: "value", name: "Index" },
        yAxis: { type: "value", name: "Value" },
        series: [{ type: "scatter", data: rows.map((r, i) => [i, r.value, r.value]), symbolSize: (d) => 8 + (d[2] ?? 10) / 5, itemStyle: { color: LAGOON, opacity: 0.7 } }]
      };
    case "heatmap": {
      const data = [];
      const ySeries = ["Set A", "Set B"];
      rows.forEach((r, xi) => {
        data.push([xi, 0, r.value]);
        data.push([xi, 1, Math.round(r.value * 0.7)]);
      });
      return {
        title: baseTitle(title),
        tooltip: { position: "top" },
        grid: { left: "12%", right: "8%", bottom: "18%", top: 40 },
        xAxis: { type: "category", data: ns, splitArea: { show: true } },
        yAxis: { type: "category", data: ySeries, splitArea: { show: true } },
        visualMap: { min: 0, max: mx, calculable: true, orient: "horizontal", left: "center", bottom: 0, inRange: { color: ["#e8f4f3", LAGOON] } },
        series: [{ type: "heatmap", data, label: { show: true, fontSize: 10 }, emphasis: { itemStyle: { shadowBlur: 10 } } }]
      };
    }
    /* ── Flow & relationship ───────────────────────── */
    case "sankey": {
      const nodes = rows.length >= 2 ? rows.map((r) => ({ name: r.name })) : [{ name: rows[0]?.name ?? "A" }, { name: "B" }];
      const links = rows.length >= 2 ? rows.slice(0, -1).map((_, i) => ({ source: i, target: i + 1, value: Math.max(1, rows[i].value) })) : [{ source: 0, target: 1, value: Math.max(1, rows[0]?.value ?? 1) }];
      return {
        title: baseTitle(title),
        tooltip: {},
        series: [{ type: "sankey", data: nodes, links, emphasis: { focus: "adjacency" }, lineStyle: { color: "source", curveness: 0.5 } }]
      };
    }
    case "graph": {
      const nodeData = rows.map((r, i) => ({ id: String(i), name: r.name, value: r.value, symbolSize: 14 + r.value / 4 }));
      const linkData = rows.slice(0, -1).map((_, i) => ({ source: String(i), target: String(i + 1), value: rows[i].value }));
      return {
        title: baseTitle(title),
        tooltip: {},
        series: [{ type: "graph", layout: "force", roam: true, label: { show: true, fontSize: 9 }, force: { repulsion: 200, edgeLength: 80 }, data: nodeData, links: linkData, lineStyle: { color: SAND, curveness: 0.2 } }]
      };
    }
    /* ── Statistical ───────────────────────────────── */
    case "boxplot": {
      const sorted = [...vs].sort((a, b) => a - b);
      const q1 = sorted[Math.floor(sorted.length * 0.25)] ?? 0;
      const med = sorted[Math.floor(sorted.length * 0.5)] ?? 0;
      const q3 = sorted[Math.floor(sorted.length * 0.75)] ?? 0;
      const lo = sorted[0] ?? 0;
      const hi = sorted[sorted.length - 1] ?? 0;
      return {
        title: baseTitle(title),
        tooltip: { trigger: "item" },
        grid: cartGrid,
        xAxis: { type: "category", data: [title] },
        yAxis: { type: "value" },
        series: [{ type: "boxplot", data: [[lo, q1, med, q3, hi]], itemStyle: { color: LAGOON, borderColor: LAGOON_D } }]
      };
    }
    case "candlestick": {
      const ohlc = rows.map((r) => {
        const o = r.value;
        const c = Math.round(o * (0.85 + Math.random() * 0.3));
        const h = Math.max(o, c) + Math.round(Math.random() * 10);
        const l = Math.min(o, c) - Math.round(Math.random() * 10);
        return [o, c, l, h];
      });
      return {
        title: baseTitle(title),
        tooltip: { trigger: "axis" },
        grid: cartGrid,
        xAxis: { type: "category", data: ns },
        yAxis: { type: "value", scale: true },
        series: [{ type: "candlestick", data: ohlc }]
      };
    }
    case "histogram":
      return {
        title: baseTitle(title),
        tooltip: { trigger: "axis" },
        grid: cartGrid,
        xAxis: { type: "category", data: ns },
        yAxis: { type: "value" },
        series: [{ type: "bar", data: vs, itemStyle: { color: LAGOON }, barCategoryGap: "5%" }]
      };
    /* ── Indicator ─────────────────────────────────── */
    case "gauge": {
      const avg = vs.length ? Math.round(vs.reduce((a, b) => a + b, 0) / vs.length) : 0;
      return {
        title: baseTitle(title),
        series: [{ type: "gauge", min: 0, max: mx, detail: { fontSize: 14 }, data: [{ value: avg, name: "Avg" }], axisLine: { lineStyle: { color: [[1, LAGOON]] } } }]
      };
    }
    case "waterfall": {
      const base = [];
      const plus = [];
      const minus = [];
      let running = 0;
      for (const r of rows) {
        const delta = r.value - (running || 0);
        if (delta >= 0) {
          base.push(running);
          plus.push(delta);
          minus.push("-");
        } else {
          base.push(running + delta);
          plus.push("-");
          minus.push(-delta);
        }
        running = r.value;
      }
      return {
        title: baseTitle(title),
        tooltip: { trigger: "axis" },
        grid: cartGrid,
        xAxis: { type: "category", data: ns },
        yAxis: { type: "value" },
        series: [
          { name: "Base", type: "bar", stack: "w", data: base, itemStyle: { color: "transparent" }, emphasis: { itemStyle: { color: "transparent" } } },
          { name: "Increase", type: "bar", stack: "w", data: plus, itemStyle: { color: LAGOON }, barMaxWidth: 32 },
          { name: "Decrease", type: "bar", stack: "w", data: minus, itemStyle: { color: CORAL }, barMaxWidth: 32 }
        ]
      };
    }
    default:
      return buildEChartsOption("bar", title, rows);
  }
}
function KpiWidget({
  title,
  rows,
  readOnly: _readOnly
}) {
  const sum = rows.reduce((a, r) => a + r.value, 0);
  const avg = rows.length ? Math.round(sum / rows.length) : 0;
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex h-full flex-col justify-center rounded-xl border border-[var(--line)] bg-[var(--surface-strong)] p-4 shadow-sm", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs font-medium uppercase tracking-wide text-[var(--sea-ink-soft)]", children: title }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-1 text-3xl font-bold tabular-nums text-[var(--lagoon-deep)]", children: avg }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-1 text-xs text-[var(--sea-ink-soft)]", children: "Average from current query" })
  ] });
}
function TableWidget({ title, rows }) {
  const columns = reactExports.useMemo(() => {
    const keys = Object.keys(rows[0] ?? {});
    return keys.map((k) => ({
      accessorKey: k,
      header: k,
      cell: ({ getValue }) => String(getValue() ?? "")
    }));
  }, [rows]);
  const table = useReactTable({
    data: rows,
    columns,
    getCoreRowModel: getCoreRowModel()
  });
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex h-full min-h-[160px] flex-col overflow-hidden rounded-xl border border-[var(--line)] bg-[var(--surface-strong)] shadow-sm", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "border-b border-[var(--line)] px-3 py-2 text-sm font-semibold text-[var(--sea-ink)]", children: title }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "min-h-0 flex-1 overflow-auto", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("table", { className: "w-full text-left text-sm", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("thead", { className: "sticky top-0 bg-[var(--sand)] text-xs uppercase text-[var(--sea-ink-soft)]", children: table.getHeaderGroups().map((hg) => /* @__PURE__ */ jsxRuntimeExports.jsx("tr", { children: hg.headers.map((h) => /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "px-3 py-2 font-medium", children: h.isPlaceholder ? null : flexRender(h.column.columnDef.header, h.getContext()) }, h.id)) }, hg.id)) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("tbody", { children: table.getRowModel().rows.map((row) => /* @__PURE__ */ jsxRuntimeExports.jsx(
        "tr",
        {
          className: "border-t border-[var(--line)] hover:bg-[rgba(79,184,178,0.08)]",
          children: row.getVisibleCells().map((cell) => /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "px-3 py-2 tabular-nums", children: flexRender(cell.column.columnDef.cell, cell.getContext()) }, cell.id))
        },
        row.id
      )) })
    ] }) })
  ] });
}
function ComposedChartWidget({ title, rows }) {
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex h-full min-h-[200px] flex-col rounded-xl border border-[var(--line)] bg-[var(--surface-strong)] p-3 shadow-sm", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mb-2 text-sm font-semibold text-[var(--sea-ink)]", children: title }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "min-h-0 flex-1", children: /* @__PURE__ */ jsxRuntimeExports.jsx(ResponsiveContainer, { width: "100%", height: "100%", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(ComposedChart, { data: rows, margin: { top: 8, right: 8, left: 0, bottom: 0 }, children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(CartesianGrid, { strokeDasharray: "3 3", stroke: "var(--line)" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(XAxis, { dataKey: "name", tick: { fontSize: 11 } }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(YAxis, { tick: { fontSize: 11 } }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Tooltip, {}),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Legend, { wrapperStyle: { fontSize: 11 } }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Bar, { dataKey: "value", fill: "var(--lagoon)", radius: [4, 4, 0, 0], barSize: 28 }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        Line,
        {
          type: "monotone",
          dataKey: "value",
          stroke: "var(--palm)",
          strokeWidth: 2,
          dot: { r: 3 }
        }
      )
    ] }) }) })
  ] });
}
const ECHARTS_MAP = {
  bar: "bar",
  stacked_bar: "stacked_bar",
  horizontal_bar: "horizontal_bar",
  radar: "radar",
  line: "line",
  area: "area",
  stacked_area: "stacked_area",
  pie: "pie",
  donut: "donut",
  sunburst: "sunburst",
  treemap: "treemap",
  funnel: "funnel",
  scatter: "scatter",
  bubble: "bubble",
  heatmap: "heatmap",
  sankey: "sankey",
  graph: "graph",
  boxplot: "boxplot",
  candlestick: "candlestick",
  histogram: "histogram",
  gauge: "gauge",
  waterfall: "waterfall"
};
function EChartsViz({ kind, title, rows }) {
  const option = reactExports.useMemo(() => buildEChartsOption(kind, title, rows), [kind, title, rows]);
  return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-full min-h-[200px] rounded-xl border border-[var(--line)] bg-[var(--surface-strong)] p-2 shadow-sm", children: /* @__PURE__ */ jsxRuntimeExports.jsx(EChartsReact, { option, style: { height: "100%", minHeight: 200 } }) });
}
function WidgetRenderer({
  config,
  readOnly
}) {
  const chartQuery = useDemoDataset(config.dataSourceId, config.bindings);
  const tableQuery = useDatasetRows(config.dataSourceId);
  const isTable = config.type === "table";
  const data = isTable ? tableQuery.data : chartQuery.data;
  const isLoading = isTable ? tableQuery.isLoading : chartQuery.isLoading;
  const error = isTable ? tableQuery.error : chartQuery.error;
  if (isLoading) {
    return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex h-full min-h-[80px] items-center justify-center rounded-lg border border-dashed border-[var(--line)] bg-[var(--surface)] text-sm text-[var(--sea-ink-soft)]", children: "Loading…" });
  }
  if (error) {
    return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex h-full min-h-[80px] items-center justify-center rounded-lg border border-red-200 bg-red-50 p-2 text-sm text-red-800", children: "Failed to load data" });
  }
  const rows = data ?? [];
  const rawRows = data ?? [];
  const { title, type } = config;
  if (type === "kpi") return /* @__PURE__ */ jsxRuntimeExports.jsx(KpiWidget, { title, rows, readOnly });
  if (type === "table") return /* @__PURE__ */ jsxRuntimeExports.jsx(TableWidget, { title, rows: rawRows });
  if (type === "composed") return /* @__PURE__ */ jsxRuntimeExports.jsx(ComposedChartWidget, { title, rows });
  const eKind = ECHARTS_MAP[type];
  if (eKind) return /* @__PURE__ */ jsxRuntimeExports.jsx(EChartsViz, { kind: eKind, title, rows });
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "p-2 text-sm text-[var(--sea-ink-soft)]", children: [
    "Unknown widget type: ",
    type
  ] });
}
export {
  WidgetRenderer as W
};
