import { c as createRouter, a as createRootRoute, b as createFileRoute, l as lazyRouteComponent, H as HeadContent, S as Scripts, u as useRouterState, d as useNavigate } from "../_libs/tanstack__react-router.mjs";
import { I as redirect } from "../_libs/tanstack__router-core.mjs";
import { j as jsxRuntimeExports, r as reactExports } from "../_libs/react.mjs";
import { b as QueryClient } from "../_libs/tanstack__query-core.mjs";
import { Q as QueryClientProvider } from "../_libs/tanstack__react-query.mjs";
import { S as Sidebar, M as Menu, a as MenuItem, b as SubMenu } from "../_libs/react-pro-sidebar.mjs";
import { c as create, p as persist } from "../_libs/zustand.mjs";
import { c as cva } from "../_libs/class-variance-authority.mjs";
import { c as clsx } from "../_libs/clsx.mjs";
import { t as twMerge } from "../_libs/tailwind-merge.mjs";
import { M as Map, P as Plus, C as ChartLine, D as Database, a as PanelLeft, b as PanelLeftClose } from "../_libs/lucide-react.mjs";
import { S as Slot } from "../_libs/radix-ui__react-slot.mjs";
import "../_libs/react-dom.mjs";
import "util";
import "crypto";
import "async_hooks";
import "stream";
import "node:stream";
import "../_libs/isbot.mjs";
import "../_libs/tanstack__history.mjs";
import "../_libs/cookie-es.mjs";
import "../_libs/seroval.mjs";
import "../_libs/seroval-plugins.mjs";
import "node:stream/web";
import "../_libs/radix-ui__react-compose-refs.mjs";
function AppProviders({ children }) {
  const [queryClient] = reactExports.useState(
    () => new QueryClient({
      defaultOptions: {
        queries: {
          staleTime: 60 * 1e3,
          refetchOnWindowFocus: false
        }
      }
    })
  );
  return /* @__PURE__ */ jsxRuntimeExports.jsx(QueryClientProvider, { client: queryClient, children });
}
function getInitialMode() {
  if (typeof window === "undefined") {
    return "auto";
  }
  const stored = window.localStorage.getItem("theme");
  if (stored === "light" || stored === "dark" || stored === "auto") {
    return stored;
  }
  return "auto";
}
function applyThemeMode(mode) {
  const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  const resolved = mode === "auto" ? prefersDark ? "dark" : "light" : mode;
  document.documentElement.classList.remove("light", "dark");
  document.documentElement.classList.add(resolved);
  if (mode === "auto") {
    document.documentElement.removeAttribute("data-theme");
  } else {
    document.documentElement.setAttribute("data-theme", mode);
  }
  document.documentElement.style.colorScheme = resolved;
}
function ThemeToggle() {
  const [mode, setMode] = reactExports.useState("auto");
  reactExports.useEffect(() => {
    const initialMode = getInitialMode();
    setMode(initialMode);
    applyThemeMode(initialMode);
  }, []);
  reactExports.useEffect(() => {
    if (mode !== "auto") {
      return;
    }
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => applyThemeMode("auto");
    media.addEventListener("change", onChange);
    return () => {
      media.removeEventListener("change", onChange);
    };
  }, [mode]);
  function toggleMode() {
    const nextMode = mode === "light" ? "dark" : mode === "dark" ? "auto" : "light";
    setMode(nextMode);
    applyThemeMode(nextMode);
    window.localStorage.setItem("theme", nextMode);
  }
  const label = mode === "auto" ? "Theme mode: auto (system). Click to switch to light mode." : `Theme mode: ${mode}. Click to switch mode.`;
  return /* @__PURE__ */ jsxRuntimeExports.jsx(
    "button",
    {
      type: "button",
      onClick: toggleMode,
      "aria-label": label,
      title: label,
      className: "rounded-full border border-[var(--chip-line)] bg-[var(--chip-bg)] px-3 py-1.5 text-sm font-semibold text-[var(--sea-ink)] shadow-[0_8px_22px_rgba(30,90,72,0.08)] transition hover:-translate-y-0.5",
      children: mode === "auto" ? "Auto" : mode === "dark" ? "Dark" : "Light"
    }
  );
}
const DASHBOARD_TEMPLATE_LIST = [
  {
    id: "blank",
    name: "Blank canvas",
    description: "Start empty and add widgets from the palette."
  },
  {
    id: "sample",
    name: "Sample mix",
    description: "KPI card plus bar chart with demo data — good for a quick tour."
  },
  {
    id: "kpi_row",
    name: "KPI row",
    description: "Three KPI cards in a row for headline numbers."
  },
  {
    id: "analytics",
    name: "Analytics pack",
    description: "Bar chart, line chart, and a data table."
  }
];
function getLayoutWidgetsForTemplate(id) {
  switch (id) {
    case "blank":
      return { layout: [], widgets: {} };
    case "sample":
      return sampleMix();
    case "kpi_row":
      return kpiRow();
    case "analytics":
      return analyticsPack();
    default:
      return { layout: [], widgets: {} };
  }
}
function sampleMix() {
  const widgets = {
    "kpi-1": {
      id: "kpi-1",
      type: "kpi",
      title: "Headline KPI",
      dataSourceId: "qry-households-beneficiaries",
      bindings: { xKey: "district", yKey: "beneficiaries" }
    },
    "chart-1": {
      id: "chart-1",
      type: "bar",
      title: "Values by category",
      dataSourceId: "qry-households-beneficiaries",
      bindings: { xKey: "district", yKey: "beneficiaries" }
    }
  };
  const layout = [
    { i: "kpi-1", x: 0, y: 0, w: 3, h: 3, minW: 2, minH: 2 },
    { i: "chart-1", x: 3, y: 0, w: 9, h: 8, minW: 3, minH: 3 }
  ];
  return { layout, widgets };
}
function kpiRow() {
  const widgets = {
    k1: {
      id: "k1",
      type: "kpi",
      title: "Indicator A",
      dataSourceId: "qry-indicator-values",
      bindings: { xKey: "indicator", yKey: "value" }
    },
    k2: {
      id: "k2",
      type: "kpi",
      title: "Indicator B",
      dataSourceId: "qry-indicator-values",
      bindings: { xKey: "indicator", yKey: "value" }
    },
    k3: {
      id: "k3",
      type: "kpi",
      title: "Indicator C",
      dataSourceId: "qry-indicator-values",
      bindings: { xKey: "indicator", yKey: "value" }
    }
  };
  const layout = [
    { i: "k1", x: 0, y: 0, w: 4, h: 3, minW: 2, minH: 2 },
    { i: "k2", x: 4, y: 0, w: 4, h: 3, minW: 2, minH: 2 },
    { i: "k3", x: 8, y: 0, w: 4, h: 3, minW: 2, minH: 2 }
  ];
  return { layout, widgets };
}
function analyticsPack() {
  const widgets = {
    b1: {
      id: "b1",
      type: "bar",
      title: "Bar trend",
      dataSourceId: "qry-households-beneficiaries",
      bindings: { xKey: "district", yKey: "beneficiaries" }
    },
    l1: {
      id: "l1",
      type: "line",
      title: "Line trend",
      dataSourceId: "qry-indicator-values",
      bindings: { xKey: "indicator", yKey: "value" }
    },
    t1: { id: "t1", type: "table", title: "Data preview", dataSourceId: "qry-households-beneficiaries" }
  };
  const layout = [
    { i: "b1", x: 0, y: 0, w: 6, h: 7, minW: 3, minH: 3 },
    { i: "l1", x: 6, y: 0, w: 6, h: 7, minW: 3, minH: 3 },
    { i: "t1", x: 0, y: 7, w: 12, h: 6, minW: 4, minH: 3 }
  ];
  return { layout, widgets };
}
const STORAGE_KEY = "wpa-dashboards-v1";
function nowIso() {
  return (/* @__PURE__ */ new Date()).toISOString();
}
function defaultLayoutAndWidgets() {
  return getLayoutWidgetsForTemplate("sample");
}
function createNewDashboardDraft(opts) {
  const id = crypto.randomUUID();
  const templateId = opts?.templateId;
  const { layout, widgets } = getLayoutWidgetsForTemplate(templateId);
  return {
    id,
    name: "New dashboard",
    description: "",
    createdAt: nowIso(),
    updatedAt: nowIso(),
    layout,
    widgets
  };
}
const useDashboardStore = create()(
  persist(
    (set, get) => ({
      dashboards: [],
      addDashboard: (name, description) => {
        const id = crypto.randomUUID();
        const base = defaultLayoutAndWidgets();
        const d = {
          id,
          name,
          description,
          createdAt: nowIso(),
          updatedAt: nowIso(),
          ...base
        };
        set((s) => ({ dashboards: [...s.dashboards, d] }));
        return d;
      },
      upsertDashboard: (d) => {
        set((s) => {
          const i = s.dashboards.findIndex((x) => x.id === d.id);
          if (i >= 0) {
            const next = [...s.dashboards];
            next[i] = { ...d, updatedAt: nowIso() };
            return { dashboards: next };
          }
          return { dashboards: [...s.dashboards, { ...d, updatedAt: nowIso() }] };
        });
      },
      updateDashboard: (id, patch) => {
        set((s) => ({
          dashboards: s.dashboards.map(
            (d) => d.id === id ? { ...d, ...patch, updatedAt: nowIso() } : d
          )
        }));
      },
      removeDashboard: (id) => {
        set((s) => ({ dashboards: s.dashboards.filter((d) => d.id !== id) }));
      },
      getById: (id) => get().dashboards.find((d) => d.id === id)
    }),
    { name: STORAGE_KEY }
  )
);
function cn(...inputs) {
  return twMerge(clsx(inputs));
}
const buttonVariants = cva(
  "group/button inline-flex shrink-0 items-center justify-center rounded-none border border-transparent bg-clip-padding text-xs font-medium whitespace-nowrap transition-all outline-none select-none focus-visible:border-ring focus-visible:ring-1 focus-visible:ring-ring/50 active:translate-y-px disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-1 aria-invalid:ring-destructive/20 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground [a]:hover:bg-primary/80",
        outline: "border-border bg-background hover:bg-muted hover:text-foreground aria-expanded:bg-muted aria-expanded:text-foreground dark:border-input dark:bg-input/30 dark:hover:bg-input/50",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80 aria-expanded:bg-secondary aria-expanded:text-secondary-foreground",
        ghost: "hover:bg-muted hover:text-foreground aria-expanded:bg-muted aria-expanded:text-foreground dark:hover:bg-muted/50",
        destructive: "bg-destructive/10 text-destructive hover:bg-destructive/20 focus-visible:border-destructive/40 focus-visible:ring-destructive/20 dark:bg-destructive/20 dark:hover:bg-destructive/30 dark:focus-visible:ring-destructive/40",
        link: "text-primary underline-offset-4 hover:underline"
      },
      size: {
        default: "h-8 gap-1.5 px-2.5 has-data-[icon=inline-end]:pr-2 has-data-[icon=inline-start]:pl-2",
        xs: "h-6 gap-1 rounded-none px-2 text-xs has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 [&_svg:not([class*='size-'])]:size-3",
        sm: "h-7 gap-1 rounded-none px-2.5 has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 [&_svg:not([class*='size-'])]:size-3.5",
        lg: "h-9 gap-1.5 px-2.5 has-data-[icon=inline-end]:pr-3 has-data-[icon=inline-start]:pl-3",
        icon: "size-8",
        "icon-xs": "size-6 rounded-none [&_svg:not([class*='size-'])]:size-3",
        "icon-sm": "size-7 rounded-none",
        "icon-lg": "size-9"
      }
    },
    defaultVariants: {
      variant: "default",
      size: "default"
    }
  }
);
function Button({
  className,
  variant = "default",
  size = "default",
  asChild = false,
  ...props
}) {
  const Comp = asChild ? Slot : "button";
  return /* @__PURE__ */ jsxRuntimeExports.jsx(
    Comp,
    {
      "data-slot": "button",
      "data-variant": variant,
      "data-size": size,
      className: cn(buttonVariants({ variant, size, className })),
      ...props
    }
  );
}
function AppShell({ children }) {
  const [collapsed, setCollapsed] = reactExports.useState(false);
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const navigate = useNavigate();
  const dashboards = useDashboardStore((s) => s.dashboards);
  const isDashRoot = pathname === "/dashboards" || pathname === "/dashboards/";
  const isDashAdd = pathname === "/dashboards/add";
  const isDashView = /^\/dashboards\/[^/]+$/.test(pathname) && !isDashAdd;
  const isDashManageOrEdit = /\/dashboards\/[^/]+\/(manage|edit)$/.test(pathname);
  const isDataRoot = pathname === "/data-management";
  const isDataImport = pathname === "/data-management/import";
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex min-h-[calc(100vh-0px)] w-full bg-[var(--bg-base)] text-[var(--sea-ink)]", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs(
      Sidebar,
      {
        collapsed,
        width: "260px",
        collapsedWidth: "72px",
        backgroundColor: "var(--surface-strong)",
        breakPoint: "md",
        className: "border-r border-[var(--line)] !static",
        rootStyles: {
          borderRight: "1px solid var(--line)"
        },
        children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex h-14 items-center border-b border-[var(--line)] px-3", children: !collapsed && /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "truncate text-sm font-bold tracking-tight text-[var(--sea-ink)]", children: "WPA Program" }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(
            Menu,
            {
              menuItemStyles: {
                button: ({ active }) => ({
                  backgroundColor: active ? "rgba(79, 184, 178, 0.2)" : void 0,
                  color: active ? "var(--lagoon-deep)" : "var(--sea-ink)",
                  fontWeight: active ? 600 : 500,
                  borderRadius: "8px",
                  margin: "2px 8px"
                })
              },
              children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  MenuItem,
                  {
                    icon: /* @__PURE__ */ jsxRuntimeExports.jsx(Map, { size: 18 }),
                    active: pathname === "/baseline-mapping",
                    onClick: () => navigate({ to: "/baseline-mapping" }),
                    children: "Baseline mapping"
                  }
                ),
                /* @__PURE__ */ jsxRuntimeExports.jsxs(
                  SubMenu,
                  {
                    label: "Indicator visualization",
                    icon: /* @__PURE__ */ jsxRuntimeExports.jsx(ChartLine, { size: 18 }),
                    defaultOpen: isDashRoot || isDashAdd || isDashView || isDashManageOrEdit,
                    children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsx(
                        MenuItem,
                        {
                          active: isDashRoot,
                          onClick: () => navigate({ to: "/dashboards" }),
                          children: "All dashboards"
                        }
                      ),
                      /* @__PURE__ */ jsxRuntimeExports.jsx(
                        MenuItem,
                        {
                          icon: /* @__PURE__ */ jsxRuntimeExports.jsx(Plus, { size: 16 }),
                          active: isDashAdd,
                          onClick: () => navigate({ to: "/dashboards/add" }),
                          children: "Add dashboard"
                        }
                      ),
                      dashboards.map((d) => /* @__PURE__ */ jsxRuntimeExports.jsx(
                        MenuItem,
                        {
                          active: pathname === `/dashboards/${d.id}`,
                          onClick: () => navigate({ to: "/dashboards/$dashboardId", params: { dashboardId: d.id } }),
                          children: d.name
                        },
                        d.id
                      )),
                      dashboards.length === 0 && !collapsed && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "px-4 py-2 text-xs text-[var(--sea-ink-soft)]", children: "No dashboards yet — use Add dashboard" })
                    ]
                  }
                ),
                /* @__PURE__ */ jsxRuntimeExports.jsxs(
                  SubMenu,
                  {
                    label: "Data management",
                    icon: /* @__PURE__ */ jsxRuntimeExports.jsx(Database, { size: 18 }),
                    defaultOpen: isDataRoot || isDataImport,
                    children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsx(
                        MenuItem,
                        {
                          active: isDataRoot,
                          onClick: () => navigate({ to: "/data-management" }),
                          children: "Query builder"
                        }
                      ),
                      /* @__PURE__ */ jsxRuntimeExports.jsx(
                        MenuItem,
                        {
                          active: isDataImport,
                          onClick: () => navigate({ to: "/data-management/import" }),
                          children: "Data import"
                        }
                      )
                    ]
                  }
                )
              ]
            }
          )
        ]
      }
    ),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex min-w-0 flex-1 flex-col", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("header", { className: "sticky top-0 z-40 flex h-14 items-center gap-2 border-b border-[var(--line)] bg-[var(--header-bg)] px-4 backdrop-blur-lg", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          Button,
          {
            type: "button",
            variant: "ghost",
            size: "icon",
            className: "shrink-0",
            onClick: () => setCollapsed((c) => !c),
            "aria-label": collapsed ? "Expand sidebar" : "Collapse sidebar",
            children: collapsed ? /* @__PURE__ */ jsxRuntimeExports.jsx(PanelLeft, { size: 20 }) : /* @__PURE__ */ jsxRuntimeExports.jsx(PanelLeftClose, { size: 20 })
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "min-w-0 flex-1 text-sm font-medium text-[var(--sea-ink)] truncate", children: "Meal / welfare program analytics" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(ThemeToggle, {})
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("main", { className: "flex-1 overflow-auto p-4 md:p-6", children })
    ] })
  ] });
}
const appCss = "/assets/styles-e-aaWDfO.css";
const THEME_INIT_SCRIPT = `(function(){try{var stored=window.localStorage.getItem('theme');var mode=(stored==='light'||stored==='dark'||stored==='auto')?stored:'auto';var prefersDark=window.matchMedia('(prefers-color-scheme: dark)').matches;var resolved=mode==='auto'?(prefersDark?'dark':'light'):mode;var root=document.documentElement;root.classList.remove('light','dark');root.classList.add(resolved);if(mode==='auto'){root.removeAttribute('data-theme')}else{root.setAttribute('data-theme',mode)}root.style.colorScheme=resolved;}catch(e){}})();`;
const Route$a = createRootRoute({
  head: () => ({
    meta: [
      {
        charSet: "utf-8"
      },
      {
        name: "viewport",
        content: "width=device-width, initial-scale=1"
      },
      {
        title: "WPA Program Dashboard"
      }
    ],
    links: [
      {
        rel: "stylesheet",
        href: appCss
      }
    ]
  }),
  shellComponent: RootDocument
});
function RootDocument({ children }) {
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("html", { lang: "en", suppressHydrationWarning: true, children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("head", { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("script", { dangerouslySetInnerHTML: { __html: THEME_INIT_SCRIPT } }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(HeadContent, {})
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("body", { className: "font-sans antialiased [overflow-wrap:anywhere] selection:bg-[rgba(79,184,178,0.24)]", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(AppProviders, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(AppShell, { children }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Scripts, {})
    ] })
  ] });
}
const $$splitComponentImporter$8 = () => import("./indicator-visualization-dUI17no-.mjs");
const Route$9 = createFileRoute("/indicator-visualization")({
  component: lazyRouteComponent($$splitComponentImporter$8, "component")
});
const $$splitComponentImporter$7 = () => import("./data-management-n1XkQJUz.mjs");
const Route$8 = createFileRoute("/data-management")({
  component: lazyRouteComponent($$splitComponentImporter$7, "component")
});
const $$splitComponentImporter$6 = () => import("./baseline-mapping-C-6F6M55.mjs");
const Route$7 = createFileRoute("/baseline-mapping")({
  component: lazyRouteComponent($$splitComponentImporter$6, "component")
});
const $$splitComponentImporter$5 = () => import("./index-CC_d9hjH.mjs");
const Route$6 = createFileRoute("/")({
  component: lazyRouteComponent($$splitComponentImporter$5, "component")
});
const $$splitComponentImporter$4 = () => import("./dashboards.index-Jbh_r4dN.mjs");
const Route$5 = createFileRoute("/dashboards/")({
  component: lazyRouteComponent($$splitComponentImporter$4, "component")
});
const $$splitComponentImporter$3 = () => import("./data-management.import-DKYvN04Z.mjs");
const Route$4 = createFileRoute("/data-management/import")({
  component: lazyRouteComponent($$splitComponentImporter$3, "component")
});
const $$splitComponentImporter$2 = () => import("./dashboards.add-BCM1C6bL.mjs");
const Route$3 = createFileRoute("/dashboards/add")({
  component: lazyRouteComponent($$splitComponentImporter$2, "component")
});
const $$splitComponentImporter$1 = () => import("./dashboards._dashboardId-1MNaL0ar.mjs");
const Route$2 = createFileRoute("/dashboards/$dashboardId")({
  component: lazyRouteComponent($$splitComponentImporter$1, "component")
});
const $$splitComponentImporter = () => import("./dashboards._dashboardId.manage-BWFxlgAF.mjs");
const Route$1 = createFileRoute("/dashboards/$dashboardId/manage")({
  validateSearch: (search) => {
    const raw = search.step;
    const n = typeof raw === "number" ? raw : typeof raw === "string" ? parseInt(raw, 10) : NaN;
    return {
      step: Number.isFinite(n) ? n : void 0
    };
  },
  component: lazyRouteComponent($$splitComponentImporter, "component")
});
const Route = createFileRoute("/dashboards/$dashboardId/edit")({
  beforeLoad: ({ params }) => {
    throw redirect({
      to: "/dashboards/$dashboardId/manage",
      params: { dashboardId: params.dashboardId }
    });
  }
});
const IndicatorVisualizationRoute = Route$9.update({
  id: "/indicator-visualization",
  path: "/indicator-visualization",
  getParentRoute: () => Route$a
});
const DataManagementRoute = Route$8.update({
  id: "/data-management",
  path: "/data-management",
  getParentRoute: () => Route$a
});
const BaselineMappingRoute = Route$7.update({
  id: "/baseline-mapping",
  path: "/baseline-mapping",
  getParentRoute: () => Route$a
});
const IndexRoute = Route$6.update({
  id: "/",
  path: "/",
  getParentRoute: () => Route$a
});
const DashboardsIndexRoute = Route$5.update({
  id: "/dashboards/",
  path: "/dashboards/",
  getParentRoute: () => Route$a
});
const DataManagementImportRoute = Route$4.update({
  id: "/import",
  path: "/import",
  getParentRoute: () => DataManagementRoute
});
const DashboardsAddRoute = Route$3.update({
  id: "/dashboards/add",
  path: "/dashboards/add",
  getParentRoute: () => Route$a
});
const DashboardsDashboardIdRoute = Route$2.update({
  id: "/dashboards/$dashboardId",
  path: "/dashboards/$dashboardId",
  getParentRoute: () => Route$a
});
const DashboardsDashboardIdManageRoute = Route$1.update({
  id: "/manage",
  path: "/manage",
  getParentRoute: () => DashboardsDashboardIdRoute
});
const DashboardsDashboardIdEditRoute = Route.update({
  id: "/edit",
  path: "/edit",
  getParentRoute: () => DashboardsDashboardIdRoute
});
const DataManagementRouteChildren = {
  DataManagementImportRoute
};
const DataManagementRouteWithChildren = DataManagementRoute._addFileChildren(
  DataManagementRouteChildren
);
const DashboardsDashboardIdRouteChildren = {
  DashboardsDashboardIdEditRoute,
  DashboardsDashboardIdManageRoute
};
const DashboardsDashboardIdRouteWithChildren = DashboardsDashboardIdRoute._addFileChildren(
  DashboardsDashboardIdRouteChildren
);
const rootRouteChildren = {
  IndexRoute,
  BaselineMappingRoute,
  DataManagementRoute: DataManagementRouteWithChildren,
  IndicatorVisualizationRoute,
  DashboardsDashboardIdRoute: DashboardsDashboardIdRouteWithChildren,
  DashboardsAddRoute,
  DashboardsIndexRoute
};
const routeTree = Route$a._addFileChildren(rootRouteChildren)._addFileTypes();
function getRouter() {
  const router2 = createRouter({
    routeTree,
    scrollRestoration: true,
    defaultPreload: "intent",
    defaultPreloadStaleTime: 0
  });
  return router2;
}
const router = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  getRouter
}, Symbol.toStringTag, { value: "Module" }));
export {
  Button as B,
  DASHBOARD_TEMPLATE_LIST as D,
  Route$2 as R,
  Route$1 as a,
  createNewDashboardDraft as c,
  getLayoutWidgetsForTemplate as g,
  router as r,
  useDashboardStore as u
};
