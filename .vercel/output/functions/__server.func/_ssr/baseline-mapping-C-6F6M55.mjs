import { j as jsxRuntimeExports } from "../_libs/react.mjs";
function getBaselineMapUrl() {
  const url = "https://gartsafrica.com/nyahururu_WASH_program/";
  if (url.trim()) return url.trim();
  return "https://www.openstreetmap.org/export/embed.html?bbox=-5,35,40,60&layer=mapnik";
}
function BaselineMappingPage() {
  const src = getBaselineMapUrl();
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-3", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "text-2xl font-bold text-[var(--sea-ink)]", children: "Baseline mapping" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-1 text-sm text-[var(--sea-ink-soft)]", children: "Baseline map for the program." })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "overflow-hidden rounded-xl border border-[var(--line)] bg-[var(--surface-strong)] shadow-sm", children: /* @__PURE__ */ jsxRuntimeExports.jsx("iframe", { title: "Baseline map", src, className: "h-[min(72vh,720px)] w-full border-0", loading: "lazy", referrerPolicy: "no-referrer-when-downgrade" }) })
  ] });
}
export {
  BaselineMappingPage as component
};
