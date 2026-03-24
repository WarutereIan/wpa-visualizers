import { j as jsxRuntimeExports } from "../_libs/react.mjs";
import { d as useNavigate, L as Link } from "../_libs/tanstack__react-router.mjs";
import { D as DashboardWizard } from "./DashboardWizard-ivfV0lL6.mjs";
import { a as Route$1, u as useDashboardStore, B as Button } from "./router-Q-XFCkFr.mjs";
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
import "../_libs/react-grid-layout.mjs";
import "../_libs/react-draggable.mjs";
import "../_libs/prop-types.mjs";
import "../_libs/clsx.mjs";
import "../_libs/react-resizable.mjs";
import "../_libs/fast-equals.mjs";
import "./WidgetRenderer-DMGfeqlx.mjs";
import "../_libs/echarts-for-react.mjs";
import "tslib";
import "../_libs/echarts.mjs";
import "../_libs/zrender.mjs";
import "../_libs/size-sensor.mjs";
import "../_libs/fast-deep-equal.mjs";
import "../_libs/tanstack__react-query.mjs";
import "../_libs/tanstack__query-core.mjs";
import "./dataStore-De8QcqQ-.mjs";
import "../_libs/zustand.mjs";
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
function DashboardManagePage() {
  const {
    dashboardId
  } = Route$1.useParams();
  const {
    step
  } = Route$1.useSearch();
  const dashboard = useDashboardStore((s) => s.getById(dashboardId));
  const upsertDashboard = useDashboardStore((s) => s.upsertDashboard);
  const navigate = useNavigate();
  if (!dashboard) {
    return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-xl border border-[var(--line)] bg-[var(--surface-strong)] p-8 text-center", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-[var(--sea-ink)]", children: "This dashboard does not exist." }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { asChild: true, className: "mt-4", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Link, { to: "/dashboards", children: "Back to dashboards" }) })
    ] });
  }
  const initialStepIndex = step !== void 0 && step >= 0 && step <= 2 ? step : 0;
  return /* @__PURE__ */ jsxRuntimeExports.jsx(DashboardWizard, { mode: "manage", initialDraft: dashboard, initialStepIndex, title: "Manage dashboard", subtitle: dashboard.name, onCancel: () => navigate({
    to: "/dashboards/$dashboardId",
    params: {
      dashboardId
    }
  }), onComplete: (next) => {
    upsertDashboard(next);
    navigate({
      to: "/dashboards/$dashboardId",
      params: {
        dashboardId: next.id
      }
    });
  } });
}
export {
  DashboardManagePage as component
};
