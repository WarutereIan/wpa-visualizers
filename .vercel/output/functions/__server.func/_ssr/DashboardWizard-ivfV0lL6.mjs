import { r as reactExports, j as jsxRuntimeExports } from "../_libs/react.mjs";
import { g as getLayoutWidgetsForTemplate, D as DASHBOARD_TEMPLATE_LIST, B as Button } from "./router-Q-XFCkFr.mjs";
import { W as WidthProvider, R as ReactGridLayout_default } from "../_libs/react-grid-layout.mjs";
import { W as WidgetRenderer } from "./WidgetRenderer-DMGfeqlx.mjs";
import { u as useDataStore } from "./dataStore-De8QcqQ-.mjs";
const PALETTE_GROUPS = [
  "General",
  "Comparison",
  "Trend",
  "Part-to-whole",
  "Correlation",
  "Flow & relationship",
  "Statistical",
  "Indicator",
  "Mixed"
];
const c = (type, label, group, defaultW = 6, defaultH = 6, minW = 3, minH = 3) => ({ type, label, group, defaultW, defaultH, minW, minH });
const WIDGET_PALETTE = [
  /* General */
  c("kpi", "KPI card", "General", 3, 3, 2, 2),
  c("table", "Data table", "General", 8, 6, 4, 3),
  /* Comparison */
  c("bar", "Bar chart", "Comparison"),
  c("stacked_bar", "Stacked bar", "Comparison"),
  c("horizontal_bar", "Horizontal bar", "Comparison"),
  c("radar", "Radar / spider", "Comparison"),
  /* Trend */
  c("line", "Line chart", "Trend"),
  c("area", "Area chart", "Trend"),
  c("stacked_area", "Stacked area", "Trend"),
  /* Part-to-whole */
  c("pie", "Pie chart", "Part-to-whole"),
  c("donut", "Donut", "Part-to-whole"),
  c("sunburst", "Sunburst", "Part-to-whole"),
  c("treemap", "Treemap", "Part-to-whole"),
  c("funnel", "Funnel", "Part-to-whole"),
  /* Correlation */
  c("scatter", "Scatter plot", "Correlation"),
  c("bubble", "Bubble chart", "Correlation"),
  c("heatmap", "Heatmap", "Correlation", 8, 5, 4, 3),
  /* Flow & relationship */
  c("sankey", "Sankey diagram", "Flow & relationship", 8, 7, 5, 4),
  c("graph", "Network graph", "Flow & relationship"),
  /* Statistical */
  c("boxplot", "Box plot", "Statistical"),
  c("candlestick", "Candlestick", "Statistical"),
  c("histogram", "Histogram", "Statistical"),
  /* Indicator */
  c("gauge", "Gauge", "Indicator", 4, 5, 3, 3),
  c("waterfall", "Waterfall", "Indicator"),
  /* Mixed (Recharts) */
  c("composed", "Composed (bar + line)", "Mixed")
];
function paletteEntryFor(type) {
  return WIDGET_PALETTE.find((p) => p.type === type);
}
const GridWithWidth = WidthProvider(ReactGridLayout_default);
function newWidgetId() {
  return `w-${crypto.randomUUID().slice(0, 8)}`;
}
function DashboardCanvas({
  layout,
  widgets,
  onChange,
  layoutKey = "default"
}) {
  const [selectedId, setSelectedId] = reactExports.useState(null);
  const [expandedGroups, setExpandedGroups] = reactExports.useState(
    () => /* @__PURE__ */ new Set(["General", "Comparison", "Trend"])
  );
  const selected = selectedId ? widgets[selectedId] : null;
  const queries = useDataStore((s) => s.queries);
  const getQueryById = useDataStore((s) => s.getQueryById);
  const toggleGroup = (g) => setExpandedGroups((prev) => {
    const next = new Set(prev);
    next.has(g) ? next.delete(g) : next.add(g);
    return next;
  });
  const onLayoutChange = reactExports.useCallback(
    (next) => onChange({ layout: next, widgets }),
    [onChange, widgets]
  );
  const addWidget = reactExports.useCallback(
    (type) => {
      const id = newWidgetId();
      const entry = paletteEntryFor(type);
      const title = entry?.label ?? type;
      const maxY = layout.reduce((m, l) => Math.max(m, l.y + l.h), 0);
      const defaultQueryId = queries[0]?.id;
      const w = { id, type, title, dataSourceId: defaultQueryId };
      const nextWidgets = { ...widgets, [id]: w };
      const nextLayout = [
        ...layout,
        {
          i: id,
          x: 0,
          y: maxY,
          w: entry?.defaultW ?? 6,
          h: entry?.defaultH ?? 6,
          minW: entry?.minW ?? 3,
          minH: entry?.minH ?? 3
        }
      ];
      onChange({ layout: nextLayout, widgets: nextWidgets });
      setSelectedId(id);
    },
    [layout, widgets, onChange, queries]
  );
  const removeWidget = reactExports.useCallback(
    (wid) => {
      const nextW = { ...widgets };
      delete nextW[wid];
      onChange({ layout: layout.filter((l) => l.i !== wid), widgets: nextW });
      setSelectedId((s) => s === wid ? null : s);
    },
    [layout, widgets, onChange]
  );
  const updateSelectedField = reactExports.useCallback(
    (field, value) => {
      if (!selectedId) return;
      onChange({
        layout,
        widgets: { ...widgets, [selectedId]: { ...widgets[selectedId], [field]: value } }
      });
    },
    [selectedId, layout, widgets, onChange]
  );
  const updateBinding = reactExports.useCallback(
    (field, value) => {
      if (!selectedId) return;
      const current = widgets[selectedId];
      onChange({
        layout,
        widgets: {
          ...widgets,
          [selectedId]: {
            ...current,
            bindings: {
              ...current.bindings ?? {},
              [field]: value
            }
          }
        }
      });
    },
    [selectedId, layout, widgets, onChange]
  );
  const gridChildren = reactExports.useMemo(
    () => layout.map((item) => {
      const cfg = widgets[item.i];
      if (!cfg) return null;
      return /* @__PURE__ */ jsxRuntimeExports.jsxs(
        "div",
        {
          className: `rounded-lg border-2 bg-[var(--surface)] p-1 ${selectedId === item.i ? "border-[var(--lagoon)]" : "border-transparent"}`,
          onClick: () => setSelectedId(item.i),
          onKeyDown: (e) => {
            if (e.key === "Enter" || e.key === " ") setSelectedId(item.i);
          },
          role: "button",
          tabIndex: 0,
          children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "drag-handle mb-1 flex cursor-grab items-center gap-1 rounded bg-[var(--sand)] px-2 py-0.5 text-[10px] font-medium text-[var(--sea-ink-soft)] active:cursor-grabbing", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { "aria-hidden": true, children: "⠿" }),
              " Drag"
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(WidgetRenderer, { config: cfg })
          ]
        },
        item.i
      );
    }),
    [layout, widgets, selectedId]
  );
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col gap-4 lg:flex-row", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("aside", { className: "w-full shrink-0 lg:w-56 lg:max-h-[80vh] lg:overflow-y-auto lg:pr-1", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mb-3 text-xs font-semibold uppercase tracking-wide text-[var(--sea-ink-soft)]", children: "Add widgets" }),
      PALETTE_GROUPS.map((group) => {
        const items = WIDGET_PALETTE.filter((p) => p.group === group);
        if (items.length === 0) return null;
        const open = expandedGroups.has(group);
        return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mb-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs(
            "button",
            {
              type: "button",
              className: "flex w-full items-center gap-1.5 rounded-md px-1.5 py-1 text-left text-[11px] font-bold uppercase tracking-wider text-[var(--sea-ink-soft)] hover:bg-[var(--sand)] transition",
              onClick: () => toggleGroup(group),
              children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-[9px]", children: open ? "▾" : "▸" }),
                group,
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "ml-auto tabular-nums text-[10px] font-normal", children: items.length })
              ]
            }
          ),
          open && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-1 flex flex-col gap-1 pl-2", children: items.map((p) => /* @__PURE__ */ jsxRuntimeExports.jsxs(
            Button,
            {
              type: "button",
              variant: "outline",
              size: "sm",
              className: "h-auto min-h-7 justify-start whitespace-normal py-1 text-left text-[11px]",
              onClick: () => addWidget(p.type),
              children: [
                "+ ",
                p.label
              ]
            },
            p.type
          )) })
        ] }, group);
      })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "min-w-0 flex-1", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-xl border border-[var(--line)] bg-[var(--surface-strong)] p-2", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mb-2 text-xs text-[var(--sea-ink-soft)]", children: "Drag and resize widgets. Click a widget to configure it." }),
      layout.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex min-h-[240px] items-center justify-center rounded-lg border border-dashed border-[var(--line)] text-sm text-[var(--sea-ink-soft)]", children: "No widgets yet — pick one from the palette." }) : /* @__PURE__ */ jsxRuntimeExports.jsx(
        GridWithWidth,
        {
          className: "min-h-[320px]",
          cols: 12,
          rowHeight: 36,
          margin: [8, 8],
          containerPadding: [8, 8],
          layout,
          onLayoutChange,
          draggableHandle: ".drag-handle",
          compactType: "vertical",
          children: gridChildren
        },
        layoutKey
      )
    ] }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("aside", { className: "w-full shrink-0 space-y-3 lg:w-60", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs font-semibold uppercase tracking-wide text-[var(--sea-ink-soft)]", children: "Widget config" }),
      selected ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-3 rounded-xl border border-[var(--line)] bg-[var(--surface-strong)] p-3", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "text-sm font-medium text-[var(--sea-ink)]", children: "Title" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "input",
            {
              value: selected.title,
              onChange: (e) => updateSelectedField("title", e.target.value),
              className: "mt-1 flex h-9 w-full rounded-md border border-[var(--line)] bg-[var(--surface)] px-3 text-sm"
            }
          )
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("dl", { className: "space-y-1 text-xs", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex justify-between", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("dt", { className: "text-[var(--sea-ink-soft)]", children: "Type" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("dd", { className: "font-mono text-[var(--sea-ink)]", children: selected.type })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex justify-between", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("dt", { className: "text-[var(--sea-ink-soft)]", children: "Source" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("dd", { className: "text-[var(--sea-ink)]", children: selected.dataSourceId ?? "—" })
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "text-sm font-medium text-[var(--sea-ink)]", children: "Data query" }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(
            "select",
            {
              value: selected.dataSourceId ?? "",
              onChange: (e) => updateSelectedField("dataSourceId", e.target.value),
              className: "mt-1 flex h-9 w-full rounded-md border border-[var(--line)] bg-[var(--surface)] px-2 text-sm",
              children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "", children: "Select query…" }),
                queries.map((q) => /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: q.id, children: q.name }, q.id))
              ]
            }
          )
        ] }),
        (() => {
          const q = selected.dataSourceId ? getQueryById(selected.dataSourceId) : void 0;
          const cols = q?.selectedColumns ?? [];
          if (cols.length === 0 || selected.type === "kpi") return null;
          return /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "text-sm font-medium text-[var(--sea-ink)]", children: "X field" }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs(
                "select",
                {
                  value: selected.bindings?.xKey ?? "",
                  onChange: (e) => updateBinding("xKey", e.target.value),
                  className: "mt-1 flex h-9 w-full rounded-md border border-[var(--line)] bg-[var(--surface)] px-2 text-sm",
                  children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "", children: "Auto" }),
                    cols.map((c2) => /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: c2, children: c2 }, c2))
                  ]
                }
              )
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "text-sm font-medium text-[var(--sea-ink)]", children: "Y field" }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs(
                "select",
                {
                  value: selected.bindings?.yKey ?? "",
                  onChange: (e) => updateBinding("yKey", e.target.value),
                  className: "mt-1 flex h-9 w-full rounded-md border border-[var(--line)] bg-[var(--surface)] px-2 text-sm",
                  children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "", children: "Auto" }),
                    cols.map((c2) => /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: c2, children: c2 }, c2))
                  ]
                }
              )
            ] })
          ] });
        })(),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          Button,
          {
            type: "button",
            variant: "destructive",
            size: "sm",
            className: "w-full",
            onClick: () => removeWidget(selected.id),
            children: "Remove widget"
          }
        )
      ] }) : /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-[var(--sea-ink-soft)]", children: "Select a widget on the canvas." })
    ] })
  ] });
}
const CREATE_LABELS = ["Basics", "Template", "Build", "Review"];
const MANAGE_LABELS = ["Basics", "Build", "Review"];
function DashboardWizard({
  mode,
  initialDraft,
  initialStepIndex = 0,
  onComplete,
  onCancel,
  title,
  subtitle
}) {
  const labels = mode === "create" ? CREATE_LABELS : MANAGE_LABELS;
  const maxStep = labels.length - 1;
  const [stepIndex, setStepIndex] = reactExports.useState(
    () => Math.min(Math.max(0, initialStepIndex), maxStep)
  );
  const [draft, setDraft] = reactExports.useState(initialDraft);
  const [selectedTemplateId, setSelectedTemplateId] = reactExports.useState(
    () => initialDraft.layout.length === 0 ? "blank" : "sample"
  );
  const [canvasKey, setCanvasKey] = reactExports.useState(0);
  const applyTemplate = reactExports.useCallback((id) => {
    setSelectedTemplateId(id);
    const { layout, widgets } = getLayoutWidgetsForTemplate(id);
    setDraft((d) => ({ ...d, layout, widgets }));
    setCanvasKey((k) => k + 1);
  }, []);
  const mapStepToKind = reactExports.useCallback(
    (idx) => {
      if (mode === "create") {
        return ["basics", "template", "build", "review"][idx];
      }
      return ["basics", "build", "review"][idx];
    },
    [mode]
  );
  const currentKind = mapStepToKind(stepIndex);
  const canGoNext = reactExports.useMemo(() => {
    if (currentKind === "basics") {
      return draft.name.trim().length > 0;
    }
    return true;
  }, [currentKind, draft.name]);
  const goNext = () => {
    if (!canGoNext) return;
    if (stepIndex < maxStep) setStepIndex((s) => s + 1);
  };
  const goBack = () => {
    if (stepIndex > 0) setStepIndex((s) => s - 1);
  };
  const finish = () => {
    onComplete({
      ...draft,
      updatedAt: (/* @__PURE__ */ new Date()).toISOString()
    });
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-6", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "text-2xl font-bold text-[var(--sea-ink)]", children: title }),
      subtitle && /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-1 text-sm text-[var(--sea-ink-soft)]", children: subtitle })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("nav", { "aria-label": "Wizard progress", className: "flex flex-wrap gap-2", children: labels.map((label, i) => {
      const done = i < stepIndex;
      const active = i === stepIndex;
      return /* @__PURE__ */ jsxRuntimeExports.jsxs(
        "div",
        {
          className: `flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium ${active ? "border-[var(--lagoon)] bg-[rgba(79,184,178,0.15)] text-[var(--lagoon-deep)]" : done ? "border-[var(--line)] bg-[var(--surface-strong)] text-[var(--sea-ink)]" : "border-[var(--line)] text-[var(--sea-ink-soft)]"}`,
          children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              "span",
              {
                className: `flex h-5 w-5 items-center justify-center rounded-full text-[10px] ${active || done ? "bg-[var(--lagoon)] text-white" : "bg-[var(--sand)]"}`,
                children: done ? "✓" : i + 1
              }
            ),
            label
          ]
        },
        label
      );
    }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-xl border border-[var(--line)] bg-[var(--surface-strong)] p-4 sm:p-6", children: [
      currentKind === "basics" && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mx-auto max-w-lg space-y-4", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "text-lg font-semibold text-[var(--sea-ink)]", children: "Dashboard details" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-[var(--sea-ink-soft)]", children: "Name and describe this dashboard. You can change these later from the management wizard." }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { htmlFor: "wiz-name", className: "text-sm font-medium text-[var(--sea-ink)]", children: [
            "Name ",
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-red-600", children: "*" })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "input",
            {
              id: "wiz-name",
              value: draft.name,
              onChange: (e) => setDraft((d) => ({ ...d, name: e.target.value })),
              className: "mt-1 flex h-10 w-full rounded-md border border-[var(--line)] bg-[var(--surface)] px-3 text-sm",
              placeholder: "e.g. Country program overview"
            }
          )
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("label", { htmlFor: "wiz-desc", className: "text-sm font-medium text-[var(--sea-ink)]", children: "Description" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "textarea",
            {
              id: "wiz-desc",
              value: draft.description ?? "",
              onChange: (e) => setDraft((d) => ({ ...d, description: e.target.value })),
              rows: 3,
              className: "mt-1 w-full rounded-md border border-[var(--line)] bg-[var(--surface)] px-3 py-2 text-sm",
              placeholder: "Optional context for your team"
            }
          )
        ] })
      ] }),
      currentKind === "template" && mode === "create" && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-4", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "text-lg font-semibold text-[var(--sea-ink)]", children: "Choose a starting template" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-[var(--sea-ink-soft)]", children: "Pick a layout preset. You can add, remove, and resize widgets on the next step." }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("ul", { className: "grid gap-3 sm:grid-cols-2", children: DASHBOARD_TEMPLATE_LIST.map((t) => {
          const selected = selectedTemplateId === t.id;
          return /* @__PURE__ */ jsxRuntimeExports.jsx("li", { children: /* @__PURE__ */ jsxRuntimeExports.jsxs(
            "button",
            {
              type: "button",
              onClick: () => applyTemplate(t.id),
              className: `w-full rounded-xl border-2 p-4 text-left transition ${selected ? "border-[var(--lagoon)] bg-[rgba(79,184,178,0.08)]" : "border-[var(--line)] bg-[var(--surface)] hover:border-[var(--lagoon)]/50"}`,
              children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-semibold text-[var(--sea-ink)]", children: t.name }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-1 text-sm text-[var(--sea-ink-soft)]", children: t.description })
              ]
            }
          ) }, t.id);
        }) })
      ] }),
      currentKind === "build" && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-3", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "text-lg font-semibold text-[var(--sea-ink)]", children: "Build the layout" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-[var(--sea-ink-soft)]", children: "Drag widgets, resize, and configure titles. Changes apply to your draft until you finish." }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          DashboardCanvas,
          {
            layout: draft.layout,
            widgets: draft.widgets,
            onChange: ({ layout, widgets }) => setDraft((d) => ({ ...d, layout, widgets })),
            layoutKey: `${draft.id}-${canvasKey}`
          }
        )
      ] }),
      currentKind === "review" && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mx-auto max-w-xl space-y-4", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "text-lg font-semibold text-[var(--sea-ink)]", children: "Review" }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("dl", { className: "space-y-2 rounded-lg border border-[var(--line)] bg-[var(--surface)] p-4 text-sm", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("dt", { className: "font-medium text-[var(--sea-ink-soft)]", children: "Name" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("dd", { className: "text-[var(--sea-ink)]", children: draft.name })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("dt", { className: "font-medium text-[var(--sea-ink-soft)]", children: "Description" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("dd", { className: "text-[var(--sea-ink)]", children: draft.description?.trim() ? draft.description : "—" })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("dt", { className: "font-medium text-[var(--sea-ink-soft)]", children: "Widgets" }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("dd", { className: "text-[var(--sea-ink)]", children: [
              draft.layout.length,
              " on canvas"
            ] })
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-[var(--sea-ink-soft)]", children: mode === "create" ? "Saving will add this dashboard to your list (browser storage until an API is connected)." : "Saving will update this dashboard in your list." })
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-wrap items-center justify-between gap-3 border-t border-[var(--line)] pt-4", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { type: "button", variant: "ghost", onClick: onCancel, children: "Cancel" }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex gap-2", children: [
        stepIndex > 0 && /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { type: "button", variant: "outline", onClick: goBack, children: "Back" }),
        stepIndex < maxStep ? /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { type: "button", onClick: goNext, disabled: !canGoNext, children: "Next" }) : /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { type: "button", onClick: finish, children: mode === "create" ? "Create dashboard" : "Save changes" })
      ] })
    ] })
  ] });
}
export {
  DashboardWizard as D
};
