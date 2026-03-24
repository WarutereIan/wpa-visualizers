import { j as jsxRuntimeExports } from "../_libs/react.mjs";
import { d as useNavigate, L as Link } from "../_libs/tanstack__react-router.mjs";
import { W as WidthProvider, R as ReactGridLayout_default } from "../_libs/react-grid-layout.mjs";
import { W as WidgetRenderer } from "./WidgetRenderer-DMGfeqlx.mjs";
import { R as Route$2, u as useDashboardStore, B as Button } from "./router-Q-XFCkFr.mjs";
import { c as create } from "../_libs/zustand.mjs";
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
import "../_libs/react-draggable.mjs";
import "../_libs/prop-types.mjs";
import "../_libs/clsx.mjs";
import "../_libs/react-resizable.mjs";
import "../_libs/fast-equals.mjs";
import "../_libs/echarts-for-react.mjs";
import "tslib";
import "../_libs/echarts.mjs";
import "../_libs/zrender.mjs";
import "../_libs/size-sensor.mjs";
import "../_libs/fast-deep-equal.mjs";
import "../_libs/tanstack__react-query.mjs";
import "../_libs/tanstack__query-core.mjs";
import "./dataStore-De8QcqQ-.mjs";
import "../_libs/tanstack__react-table.mjs";
import "../_libs/tanstack__table-core.mjs";
import "../_libs/recharts.mjs";
import "../_libs/es-toolkit.mjs";
import "../_libs/reselect.mjs";
import "../_libs/react-is.mjs";
import "../_libs/tiny-invariant.mjs";
import "../_libs/d3-shape.mjs";
import "../_libs/d3-path.mjs";
import "../_libs/reduxjs__toolkit.mjs";
import "../_libs/redux.mjs";
import "../_libs/immer.mjs";
import "../_libs/redux-thunk.mjs";
import "../_libs/react-redux.mjs";
import "../_libs/use-sync-external-store.mjs";
import "../_libs/victory-vendor.mjs";
import "../_libs/d3-scale.mjs";
import "../_libs/internmap.mjs";
import "../_libs/d3-array.mjs";
import "../_libs/d3-time-format.mjs";
import "../_libs/d3-time.mjs";
import "../_libs/d3-interpolate.mjs";
import "../_libs/d3-color.mjs";
import "../_libs/d3-format.mjs";
import "../_libs/decimal.js-light.mjs";
import "../_libs/eventemitter3.mjs";
import "../_libs/react-pro-sidebar.mjs";
import "../_libs/class-variance-authority.mjs";
import "../_libs/tailwind-merge.mjs";
import "../_libs/lucide-react.mjs";
import "../_libs/radix-ui__react-slot.mjs";
import "../_libs/radix-ui__react-compose-refs.mjs";
const initial = {
  dateFrom: null,
  dateTo: null
};
const useDashboardFilterStore = create((set) => ({
  filters: initial,
  setDateRange: (dateFrom, dateTo) => set({ filters: { dateFrom, dateTo } }),
  reset: () => set({ filters: initial })
}));
const GridWithWidth = WidthProvider(ReactGridLayout_default);
function DashboardViewer({
  dashboard,
  showEditLink
}) {
  const { filters, setDateRange, reset } = useDashboardFilterStore();
  const layout = dashboard.layout;
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-4", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col gap-3 rounded-xl border border-[var(--line)] bg-[var(--surface-strong)] p-4 sm:flex-row sm:items-end sm:justify-between", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "text-xl font-bold text-[var(--sea-ink)]", children: dashboard.name }),
        dashboard.description && /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-1 text-sm text-[var(--sea-ink-soft)]", children: dashboard.description })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-wrap items-center gap-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-xs font-medium text-[var(--sea-ink-soft)]", children: "Global filters" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "input",
          {
            type: "date",
            value: filters.dateFrom ?? "",
            onChange: (e) => setDateRange(e.target.value || null, filters.dateTo),
            className: "h-9 rounded-md border border-[var(--line)] bg-[var(--surface)] px-2 text-sm",
            "aria-label": "From date"
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "input",
          {
            type: "date",
            value: filters.dateTo ?? "",
            onChange: (e) => setDateRange(filters.dateFrom, e.target.value || null),
            className: "h-9 rounded-md border border-[var(--line)] bg-[var(--surface)] px-2 text-sm",
            "aria-label": "To date"
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { type: "button", variant: "ghost", size: "sm", onClick: () => reset(), children: "Clear" }),
        showEditLink && /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { type: "button", variant: "outline", size: "sm", asChild: true, children: /* @__PURE__ */ jsxRuntimeExports.jsx(
          Link,
          {
            to: "/dashboards/$dashboardId/manage",
            params: { dashboardId: dashboard.id },
            children: "Manage dashboard"
          }
        ) })
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-[var(--sea-ink-soft)]", children: "Date filters are stored in Zustand and ready to wire into widget queries. Demo data is unchanged for now." }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      GridWithWidth,
      {
        className: "min-h-[280px]",
        cols: 12,
        rowHeight: 36,
        margin: [8, 8],
        containerPadding: [8, 8],
        layout,
        isDraggable: false,
        isResizable: false,
        compactType: "vertical",
        children: layout.map((item) => {
          const cfg = dashboard.widgets[item.i];
          if (!cfg) return null;
          return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "rounded-lg bg-[var(--surface)] p-1", children: /* @__PURE__ */ jsxRuntimeExports.jsx(WidgetRenderer, { config: cfg, readOnly: true }) }, item.i);
        })
      }
    )
  ] });
}
function DashboardViewPage() {
  const {
    dashboardId
  } = Route$2.useParams();
  const dashboard = useDashboardStore((s) => s.getById(dashboardId));
  const removeDashboard = useDashboardStore((s) => s.removeDashboard);
  const navigate = useNavigate();
  if (!dashboard) {
    return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-xl border border-[var(--line)] bg-[var(--surface-strong)] p-8 text-center", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-[var(--sea-ink)]", children: "This dashboard does not exist (or was removed)." }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { asChild: true, className: "mt-4", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Link, { to: "/dashboards", children: "Back to dashboards" }) })
    ] });
  }
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-4", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex flex-wrap gap-2", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { type: "button", variant: "outline", size: "sm", onClick: () => {
      removeDashboard(dashboardId);
      navigate({
        to: "/dashboards"
      });
    }, children: "Delete dashboard" }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(DashboardViewer, { dashboard, showEditLink: true })
  ] });
}
export {
  DashboardViewPage as component
};
