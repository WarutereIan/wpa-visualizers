import { r as reactExports, j as jsxRuntimeExports } from "../_libs/react.mjs";
import { r as readSync, u as utils } from "../_libs/xlsx.mjs";
import { B as Button } from "./router-Q-XFCkFr.mjs";
import { u as useDataStore } from "./dataStore-De8QcqQ-.mjs";
import "../_libs/tanstack__react-router.mjs";
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
function DataImportPage() {
  const importTable = useDataStore((s) => s.importTable);
  const [activeTab, setActiveTab] = reactExports.useState("kobo");
  const [koboUrl, setKoboUrl] = reactExports.useState("");
  const [koboToken, setKoboToken] = reactExports.useState("");
  const [koboTableName, setKoboTableName] = reactExports.useState("Kobo Import");
  const [koboBusy, setKoboBusy] = reactExports.useState(false);
  const [koboMsg, setKoboMsg] = reactExports.useState(null);
  const [excelTableName, setExcelTableName] = reactExports.useState("Excel Import");
  const [excelBusy, setExcelBusy] = reactExports.useState(false);
  const [excelMsg, setExcelMsg] = reactExports.useState(null);
  const [excelFile, setExcelFile] = reactExports.useState(null);
  const importFromKobo = async () => {
    setKoboMsg(null);
    if (!koboUrl.trim()) {
      setKoboMsg("Please provide a Kobo JSON endpoint URL.");
      return;
    }
    try {
      setKoboBusy(true);
      const headers = {};
      if (koboToken.trim()) headers.Authorization = `Bearer ${koboToken.trim()}`;
      const rows = await fetchAllKoboPages(koboUrl.trim(), headers);
      if (rows.length === 0) throw new Error("No rows found in response.");
      const table = importTable({
        name: koboTableName.trim() || "Kobo Import",
        rows
      });
      setKoboMsg(`Imported ${rows.length} rows into "${table.name}" (${table.id}).`);
    } catch (err) {
      setKoboMsg(err instanceof Error ? err.message : "Failed to import Kobo data.");
    } finally {
      setKoboBusy(false);
    }
  };
  const importExcel = async (file) => {
    setExcelMsg(null);
    try {
      setExcelBusy(true);
      const buf = await file.arrayBuffer();
      const wb = readSync(buf, {
        type: "array"
      });
      const firstSheet = wb.SheetNames[0];
      if (!firstSheet) throw new Error("Workbook has no sheets.");
      const ws = wb.Sheets[firstSheet];
      const rows = utils.sheet_to_json(ws, {
        defval: null
      }).map((r) => normalizeRow(r));
      if (rows.length === 0) throw new Error("No rows found in sheet.");
      const table = importTable({
        name: excelTableName.trim() || file.name.replace(/\.[^.]+$/, ""),
        rows
      });
      setExcelMsg(`Imported ${rows.length} rows into "${table.name}" (${table.id}).`);
    } catch (err) {
      setExcelMsg(err instanceof Error ? err.message : "Failed to import Excel file.");
    } finally {
      setExcelBusy(false);
    }
  };
  const runExcelImport = () => {
    if (excelFile) void importExcel(excelFile);
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-6", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-xl border border-[var(--line)] bg-[var(--surface-strong)] p-6 shadow-sm", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "text-2xl font-bold text-[var(--sea-ink)]", children: "Data import" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-2 max-w-3xl text-sm text-[var(--sea-ink-soft)]", children: "Import Kobo and Excel datasets into Data Management tables for use in queries and widget bindings." })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-xl border border-[var(--line)] bg-[var(--surface-strong)] p-4", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mb-4 flex gap-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { type: "button", size: "sm", variant: activeTab === "kobo" ? "default" : "outline", onClick: () => setActiveTab("kobo"), children: "Kobo" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { type: "button", size: "sm", variant: activeTab === "excel" ? "default" : "outline", onClick: () => setActiveTab("excel"), children: "Excel" })
      ] }),
      activeTab === "kobo" ? /* @__PURE__ */ jsxRuntimeExports.jsxs("section", { className: "space-y-3", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "text-lg font-semibold text-[var(--sea-ink)]", children: "Kobo import" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-[var(--sea-ink-soft)]", children: "Similar to the Kobo table flow: provide source endpoint + auth, fetch records, and register as a local data table." }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid gap-3 md:grid-cols-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "md:col-span-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "text-sm font-medium text-[var(--sea-ink)]", children: "Kobo JSON endpoint URL" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("input", { value: koboUrl, onChange: (e) => setKoboUrl(e.target.value), placeholder: "https://kf.kobotoolbox.org/api/v2/assets/.../data/?format=json", className: "mt-1 flex h-9 w-full rounded-md border border-[var(--line)] bg-[var(--surface)] px-3 text-sm" })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "text-sm font-medium text-[var(--sea-ink)]", children: "Bearer token (optional)" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("input", { value: koboToken, onChange: (e) => setKoboToken(e.target.value), placeholder: "Token", className: "mt-1 flex h-9 w-full rounded-md border border-[var(--line)] bg-[var(--surface)] px-3 text-sm" })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "text-sm font-medium text-[var(--sea-ink)]", children: "Destination table name" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("input", { value: koboTableName, onChange: (e) => setKoboTableName(e.target.value), className: "mt-1 flex h-9 w-full rounded-md border border-[var(--line)] bg-[var(--surface)] px-3 text-sm" })
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { type: "button", onClick: importFromKobo, disabled: koboBusy, children: koboBusy ? "Importing..." : "Import Kobo data" }),
        koboMsg && /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: `text-sm ${koboMsg.startsWith("Imported") ? "text-emerald-700 dark:text-emerald-400" : "text-red-600 dark:text-red-400"}`, children: koboMsg })
      ] }) : /* @__PURE__ */ jsxRuntimeExports.jsxs("section", { className: "space-y-3", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "text-lg font-semibold text-[var(--sea-ink)]", children: "Excel import" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-[var(--sea-ink-soft)]", children: "Upload `.xlsx`, `.xls`, or `.csv`. The first sheet is imported." }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid gap-3 md:grid-cols-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "text-sm font-medium text-[var(--sea-ink)]", children: "Destination table name" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("input", { value: excelTableName, onChange: (e) => setExcelTableName(e.target.value), className: "mt-1 flex h-9 w-full rounded-md border border-[var(--line)] bg-[var(--surface)] px-3 text-sm" })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "text-sm font-medium text-[var(--sea-ink)]", children: "Excel file" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("input", { type: "file", accept: ".xlsx,.xls,.csv", onChange: (e) => {
              const file = e.target.files?.[0] ?? null;
              setExcelFile(file);
              setExcelMsg(null);
            }, disabled: excelBusy, className: "mt-1 block w-full text-sm" })
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { type: "button", onClick: runExcelImport, disabled: excelBusy || !excelFile, children: excelBusy ? "Importing..." : "Import file" }),
        excelMsg && /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: `text-sm ${excelMsg.startsWith("Imported") ? "text-emerald-700 dark:text-emerald-400" : "text-red-600 dark:text-red-400"}`, children: excelMsg })
      ] })
    ] })
  ] });
}
async function fetchAllKoboPages(startUrl, headers, maxPages = 500) {
  const out = [];
  let url = startUrl;
  for (let page = 0; page < maxPages && url; page++) {
    const res = await fetch(url, {
      headers
    });
    if (!res.ok) throw new Error(`Request failed (${res.status})`);
    const json = await res.json();
    out.push(...normalizeToRows(json));
    let next = null;
    if (json && typeof json === "object" && "next" in json) {
      const n = json.next;
      next = typeof n === "string" && n.length > 0 ? n : null;
    }
    url = next;
  }
  return out;
}
function normalizeToRows(payload) {
  if (Array.isArray(payload)) {
    return payload.map((x) => normalizeRow(asRecord(x)));
  }
  if (payload && typeof payload === "object") {
    const rec = payload;
    if (Array.isArray(rec.results)) {
      return rec.results.map((x) => normalizeRow(asRecord(x)));
    }
    if (Array.isArray(rec.data)) {
      return rec.data.map((x) => normalizeRow(asRecord(x)));
    }
  }
  return [];
}
function asRecord(v) {
  return v && typeof v === "object" ? v : {};
}
function normalizeRow(input) {
  const out = {};
  Object.entries(input).forEach(([k, v]) => {
    if (v === null || typeof v === "string" || typeof v === "number" || typeof v === "boolean") {
      out[k] = v;
    } else {
      out[k] = JSON.stringify(v);
    }
  });
  return out;
}
export {
  DataImportPage as component
};
