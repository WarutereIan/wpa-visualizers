import { j as jsxRuntimeExports } from "../_libs/react.mjs";
import { L as Link } from "../_libs/tanstack__react-router.mjs";
import { u as useDashboardStore, B as Button } from "./router-Q-XFCkFr.mjs";
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
function DashboardsIndexPage() {
  const dashboards = useDashboardStore((s) => s.dashboards);
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-6", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "text-2xl font-bold text-[var(--sea-ink)]", children: "Dashboards" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-1 text-sm text-[var(--sea-ink-soft)]", children: "Create layouts, attach datasets, and organize visualizations." })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { asChild: true, children: /* @__PURE__ */ jsxRuntimeExports.jsx(Link, { to: "/dashboards/add", children: "Create with wizard" }) })
    ] }),
    dashboards.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-xl border border-dashed border-[var(--line)] bg-[var(--surface-strong)] p-10 text-center", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-[var(--sea-ink-soft)]", children: "No dashboards yet." }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { asChild: true, className: "mt-4", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Link, { to: "/dashboards/add", children: "Create your first dashboard (wizard)" }) })
    ] }) : /* @__PURE__ */ jsxRuntimeExports.jsx("ul", { className: "grid gap-3 sm:grid-cols-2 lg:grid-cols-3", children: dashboards.map((d) => /* @__PURE__ */ jsxRuntimeExports.jsx("li", { children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-xl border border-[var(--line)] bg-[var(--surface-strong)] p-4 shadow-sm transition hover:border-[var(--lagoon)]", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs(Link, { to: "/dashboards/$dashboardId", params: {
        dashboardId: d.id
      }, className: "block", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-semibold text-[var(--sea-ink)]", children: d.name }),
        d.description && /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-1 line-clamp-2 text-sm text-[var(--sea-ink-soft)]", children: d.description }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "mt-2 text-xs text-[var(--sea-ink-soft)]", children: [
          "Updated ",
          new Date(d.updatedAt).toLocaleString()
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-3 flex flex-wrap gap-2 border-t border-[var(--line)] pt-3", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "outline", size: "sm", asChild: true, children: /* @__PURE__ */ jsxRuntimeExports.jsx(Link, { to: "/dashboards/$dashboardId/manage", params: {
          dashboardId: d.id
        }, children: "Manage" }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "ghost", size: "sm", asChild: true, children: /* @__PURE__ */ jsxRuntimeExports.jsx(Link, { to: "/dashboards/$dashboardId", params: {
          dashboardId: d.id
        }, children: "Open" }) })
      ] })
    ] }) }, d.id)) })
  ] });
}
export {
  DashboardsIndexPage as component
};
