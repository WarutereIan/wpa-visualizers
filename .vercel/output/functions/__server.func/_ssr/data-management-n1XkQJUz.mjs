import { j as jsxRuntimeExports, r as reactExports } from "../_libs/react.mjs";
import { u as useRouterState, O as Outlet } from "../_libs/tanstack__react-router.mjs";
import { B as Button } from "./router-Q-XFCkFr.mjs";
import { Q as QueryBuilder } from "../_libs/react-querybuilder.mjs";
import { u as useDataStore, c as createDefaultAggregation, A as AGGREGATION_OPERATORS } from "./dataStore-De8QcqQ-.mjs";
import "../_libs/tanstack__router-core.mjs";
import "../_libs/tanstack__history.mjs";
import "../_libs/cookie-es.mjs";
import "../_libs/seroval.mjs";
import "../_libs/seroval-plugins.mjs";
import "node:stream/web";
import "node:stream";
import "../_libs/react-dom.mjs";
import "util";
import "crypto";
import "async_hooks";
import "stream";
import "../_libs/isbot.mjs";
import "../_libs/tanstack__query-core.mjs";
import "../_libs/tanstack__react-query.mjs";
import "../_libs/react-pro-sidebar.mjs";
import "../_libs/zustand.mjs";
import "../_libs/class-variance-authority.mjs";
import "../_libs/clsx.mjs";
import "../_libs/tailwind-merge.mjs";
import "../_libs/lucide-react.mjs";
import "../_libs/radix-ui__react-slot.mjs";
import "../_libs/radix-ui__react-compose-refs.mjs";
import "../_libs/react-querybuilder__core.mjs";
import "../_libs/immer.mjs";
import "../_libs/numeric-quantity.mjs";
import "../_libs/reduxjs__toolkit.mjs";
import "../_libs/redux.mjs";
import "../_libs/redux-thunk.mjs";
import "../_libs/react-redux.mjs";
import "../_libs/use-sync-external-store.mjs";
function DataManagementPage() {
  const pathname = useRouterState({
    select: (s) => s.location.pathname
  });
  if (pathname === "/data-management/import") {
    return /* @__PURE__ */ jsxRuntimeExports.jsx(Outlet, {});
  }
  return /* @__PURE__ */ jsxRuntimeExports.jsx(QueryBuilderPage, {});
}
function QueryBuilderPage() {
  const tables = useDataStore((s) => s.tables);
  const queries = useDataStore((s) => s.queries);
  const createQuery = useDataStore((s) => s.createQuery);
  const updateQuery = useDataStore((s) => s.updateQuery);
  const removeQuery = useDataStore((s) => s.removeQuery);
  const runQuery = useDataStore((s) => s.runQuery);
  const [activeQueryId, setActiveQueryId] = reactExports.useState(queries[0]?.id ?? "");
  const activeQuery = queries.find((q) => q.id === activeQueryId) ?? queries[0] ?? null;
  if (!activeQuery) {
    return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "rounded-xl border border-[var(--line)] bg-[var(--surface-strong)] p-6 text-sm text-[var(--sea-ink-soft)]", children: "No queries available. Create one to continue." });
  }
  const selectedColumns = activeQuery.selectedColumns;
  const groupBy = activeQuery.groupBy;
  const aggregations = activeQuery.aggregations;
  const activeTable = tables.find((t) => t.id === activeQuery?.tableId);
  const previewRows = reactExports.useMemo(() => activeQuery ? runQuery(activeQuery.id).slice(0, 50) : [], [activeQuery, runQuery]);
  const queryFields = reactExports.useMemo(() => (activeTable?.columns ?? []).map((c) => ({
    name: c.name,
    label: c.name
  })), [activeTable]);
  const qbQuery = reactExports.useMemo(() => ({
    combinator: "and",
    rules: activeQuery.filters.map((f) => ({
      id: f.id,
      field: f.column,
      operator: dataOperatorToQb(f.operator),
      value: f.value
    }))
  }), [activeQuery]);
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-6", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-xl border border-[var(--line)] bg-[var(--surface-strong)] p-6 shadow-sm", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "text-2xl font-bold text-[var(--sea-ink)]", children: "Query builder" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-2 max-w-3xl text-sm text-[var(--sea-ink-soft)]", children: "Configure reusable queries from source tables. Widgets can bind to these queries and map their X/Y fields in the dashboard builder." })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid gap-4 lg:grid-cols-[300px,1fr]", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("aside", { className: "space-y-3 rounded-xl border border-[var(--line)] bg-[var(--surface-strong)] p-4", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "text-sm font-semibold text-[var(--sea-ink)]", children: "Queries" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { type: "button", size: "sm", onClick: () => {
            const tableId = tables[0]?.id;
            const firstCols = tables[0]?.columns.slice(0, 2).map((c) => c.name) ?? [];
            if (!tableId) return;
            const q = createQuery({
              name: `Query ${queries.length + 1}`,
              tableId,
              selectedColumns: firstCols,
              filters: [],
              groupBy: [],
              aggregations: []
            });
            setActiveQueryId(q.id);
          }, children: "New query" })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("ul", { className: "space-y-2", children: queries.map((q) => /* @__PURE__ */ jsxRuntimeExports.jsx("li", { children: /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { type: "button", onClick: () => setActiveQueryId(q.id), className: `w-full rounded-md border px-3 py-2 text-left text-sm ${(activeQuery?.id ?? activeQueryId) === q.id ? "border-[var(--lagoon)] bg-[rgba(79,184,178,0.12)]" : "border-[var(--line)] bg-[var(--surface)]"}`, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "font-medium text-[var(--sea-ink)]", children: q.name }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-[var(--sea-ink-soft)]", children: q.id })
        ] }) }, q.id)) })
      ] }),
      !activeTable ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "rounded-xl border border-[var(--line)] bg-[var(--surface-strong)] p-6 text-sm text-[var(--sea-ink-soft)]", children: "Create a query to get started." }) : /* @__PURE__ */ jsxRuntimeExports.jsxs("section", { className: "space-y-4 rounded-xl border border-[var(--line)] bg-[var(--surface-strong)] p-4", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid gap-3 md:grid-cols-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "text-sm font-medium text-[var(--sea-ink)]", children: "Query name" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("input", { value: activeQuery.name, onChange: (e) => updateQuery(activeQuery.id, {
              name: e.target.value
            }), className: "mt-1 flex h-9 w-full rounded-md border border-[var(--line)] bg-[var(--surface)] px-3 text-sm" })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "text-sm font-medium text-[var(--sea-ink)]", children: "Source table" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("select", { value: activeQuery.tableId, onChange: (e) => updateQuery(activeQuery.id, {
              tableId: e.target.value
            }), className: "mt-1 flex h-9 w-full rounded-md border border-[var(--line)] bg-[var(--surface)] px-2 text-sm", children: tables.map((t) => /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: t.id, children: t.name }, t.id)) })
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm font-medium text-[var(--sea-ink)]", children: "Columns" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-2 grid gap-2 sm:grid-cols-2 lg:grid-cols-3", children: activeTable.columns.map((col) => {
            const checked = selectedColumns.includes(col.name);
            return /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { className: "flex items-center gap-2 rounded border border-[var(--line)] bg-[var(--surface)] px-2 py-1 text-sm", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("input", { type: "checkbox", checked, onChange: (e) => {
                const next = e.target.checked ? [...selectedColumns, col.name] : selectedColumns.filter((c) => c !== col.name);
                updateQuery(activeQuery.id, {
                  selectedColumns: next
                });
              } }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: col.name })
            ] }, col.name);
          }) })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm font-medium text-[var(--sea-ink)]", children: "Filters (React Query Builder)" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "rounded border border-[var(--line)] bg-[var(--surface)] p-2", children: /* @__PURE__ */ jsxRuntimeExports.jsx(QueryBuilder, { fields: queryFields, query: qbQuery, onQueryChange: (next) => {
            updateQuery(activeQuery.id, {
              filters: qbToDataFilters(next)
            });
          }, showCombinatorsBetweenRules: true }) })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm font-medium text-[var(--sea-ink)]", children: "GROUP BY" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-2 grid gap-2 sm:grid-cols-2 lg:grid-cols-3", children: selectedColumns.map((col) => {
            const checked = groupBy.includes(col);
            return /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { className: "flex items-center gap-2 rounded border border-[var(--line)] bg-[var(--surface)] px-2 py-1 text-sm", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("input", { type: "checkbox", checked, onChange: (e) => {
                const next = e.target.checked ? [...groupBy, col] : groupBy.filter((x) => x !== col);
                updateQuery(activeQuery.id, {
                  groupBy: next
                });
              } }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: col })
            ] }, col);
          }) })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm font-medium text-[var(--sea-ink)]", children: "Aggregations" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { type: "button", size: "sm", variant: "outline", onClick: () => updateQuery(activeQuery.id, {
              aggregations: [...aggregations, createDefaultAggregation(selectedColumns[0] ?? "")]
            }), children: "Add aggregation" })
          ] }),
          aggregations.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-[var(--sea-ink-soft)]", children: "No aggregations. Query returns row-level records." }) : /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "space-y-2", children: aggregations.map((agg) => /* @__PURE__ */ jsxRuntimeExports.jsx(AggregationRow, { agg, columns: activeTable.columns.map((c) => c.name), onChange: (patch) => updateQuery(activeQuery.id, {
            aggregations: aggregations.map((a) => a.id === agg.id ? {
              ...a,
              ...patch
            } : a)
          }), onRemove: () => updateQuery(activeQuery.id, {
            aggregations: aggregations.filter((a) => a.id !== agg.id)
          }) }, agg.id)) })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex justify-end", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { type: "button", variant: "destructive", size: "sm", onClick: () => removeQuery(activeQuery.id), children: "Delete query" }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-lg border border-[var(--line)] bg-[var(--surface)] p-3", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "mb-2 text-sm font-medium text-[var(--sea-ink)]", children: [
            "Preview (",
            previewRows.length,
            " rows)"
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "max-h-[280px] overflow-auto", children: previewRows.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-[var(--sea-ink-soft)]", children: "No rows returned." }) : /* @__PURE__ */ jsxRuntimeExports.jsxs("table", { className: "w-full text-left text-sm", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("thead", { className: "sticky top-0 bg-[var(--sand)] text-xs uppercase text-[var(--sea-ink-soft)]", children: /* @__PURE__ */ jsxRuntimeExports.jsx("tr", { children: Object.keys(previewRows[0] ?? {}).map((k) => /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "px-2 py-1.5", children: k }, k)) }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("tbody", { children: previewRows.map((row, idx) => /* @__PURE__ */ jsxRuntimeExports.jsx("tr", { className: "border-t border-[var(--line)]", children: Object.keys(previewRows[0] ?? {}).map((k) => /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "px-2 py-1.5", children: String(row[k] ?? "") }, `${idx}-${k}`)) }, idx)) })
          ] }) })
        ] })
      ] })
    ] })
  ] });
}
function AggregationRow({
  agg,
  columns,
  onChange,
  onRemove
}) {
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid gap-2 rounded border border-[var(--line)] bg-[var(--surface)] p-2 md:grid-cols-[110px,1fr,1fr,auto]", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("select", { value: agg.operator, onChange: (e) => onChange({
      operator: e.target.value
    }), className: "h-8 rounded border border-[var(--line)] bg-[var(--surface)] px-2 text-sm", children: AGGREGATION_OPERATORS.map((op) => /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: op.value, children: op.label }, op.value)) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("select", { value: agg.column, onChange: (e) => onChange({
      column: e.target.value
    }), className: "h-8 rounded border border-[var(--line)] bg-[var(--surface)] px-2 text-sm", children: columns.map((c) => /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: c, children: c }, c)) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("input", { value: agg.alias, onChange: (e) => onChange({
      alias: e.target.value
    }), className: "h-8 rounded border border-[var(--line)] bg-[var(--surface)] px-2 text-sm", placeholder: "alias" }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { type: "button", size: "sm", variant: "destructive", onClick: onRemove, children: "Remove" })
  ] });
}
function dataOperatorToQb(op) {
  switch (op) {
    case "eq":
      return "=";
    case "neq":
      return "!=";
    case "contains":
      return "contains";
    case "gt":
      return ">";
    case "gte":
      return ">=";
    case "lt":
      return "<";
    case "lte":
      return "<=";
    default:
      return "=";
  }
}
function qbOperatorToData(op) {
  switch (op) {
    case "=":
      return "eq";
    case "!=":
      return "neq";
    case "contains":
      return "contains";
    case ">":
      return "gt";
    case ">=":
      return "gte";
    case "<":
      return "lt";
    case "<=":
      return "lte";
    default:
      return "eq";
  }
}
function qbToDataFilters(query) {
  return query.rules.filter((r) => typeof r === "object" && "field" in r).map((rule, idx) => ({
    id: rule.id ?? `flt-${idx}`,
    column: rule.field,
    operator: qbOperatorToData(rule.operator),
    value: String(rule.value ?? "")
  }));
}
export {
  DataManagementPage as component
};
