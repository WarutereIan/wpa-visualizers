import { j as jsxRuntimeExports } from "../_libs/react.mjs";
import { L as Link } from "../_libs/tanstack__react-router.mjs";
import { M as Map, L as LayoutGrid, C as ChartLine, D as Database } from "../_libs/lucide-react.mjs";
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
function HomePage() {
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-8", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-2xl border border-[var(--line)] bg-[var(--surface-strong)] px-6 py-10 shadow-sm sm:px-10", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "island-kicker mb-2", children: "WPA program workspace" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "text-3xl font-bold tracking-tight text-[var(--sea-ink)] sm:text-4xl", children: "Baseline mapping, dashboards, and data in one place" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-3 max-w-2xl text-[var(--sea-ink-soft)]", children: "Use the sidebar to open the baseline map iframe, build drag-and-drop dashboards with ECharts / Recharts / TanStack Table widgets, and manage indicators and datasets." }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-6 flex flex-wrap gap-3", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs(Link, { to: "/baseline-mapping", className: "inline-flex items-center gap-2 rounded-full border border-[var(--chip-line)] bg-[rgba(79,184,178,0.14)] px-5 py-2.5 text-sm font-semibold text-[var(--lagoon-deep)] no-underline transition hover:bg-[rgba(79,184,178,0.24)]", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Map, { className: "size-4" }),
          "Baseline mapping"
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(Link, { to: "/dashboards/add", className: "inline-flex items-center gap-2 rounded-full border border-[var(--line)] bg-white/60 px-5 py-2.5 text-sm font-semibold text-[var(--sea-ink)] no-underline transition hover:border-[var(--lagoon)]", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(LayoutGrid, { className: "size-4" }),
          "Add dashboard"
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "grid gap-4 sm:grid-cols-2 lg:grid-cols-4", children: [{
      title: "Baseline mapping",
      desc: "Embedded map from your program baseline URL.",
      to: "/baseline-mapping",
      icon: Map
    }, {
      title: "Dashboards",
      desc: "Drag-and-drop builder with 20+ chart types.",
      to: "/dashboards",
      icon: LayoutGrid
    }, {
      title: "Indicator visualization",
      desc: "Indicator views and narrative charts.",
      to: "/indicator-visualization",
      icon: ChartLine
    }, {
      title: "Data management",
      desc: "Datasets, connections, and query builder.",
      to: "/data-management",
      icon: Database
    }].map(({
      title,
      desc,
      to,
      icon: Icon
    }) => /* @__PURE__ */ jsxRuntimeExports.jsxs(Link, { to, className: "island-shell rise-in rounded-2xl p-5 no-underline transition hover:border-[var(--lagoon)]", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(Icon, { className: "mb-2 size-5 text-[var(--lagoon-deep)]" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "text-base font-semibold text-[var(--sea-ink)]", children: title }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-1 text-sm text-[var(--sea-ink-soft)]", children: desc })
    ] }, to)) })
  ] });
}
export {
  HomePage as component
};
