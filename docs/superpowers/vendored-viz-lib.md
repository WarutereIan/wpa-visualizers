# Vendored `@redash/viz` (viz-lib)

DIMES-BI vendors Redash's visualization library as an npm workspace package at `packages/redash-viz`. Do **not** `npm install @redash/viz` from the public registry — `@redash/viz@0.1.1` is stale (React 16 era).

## Provenance

| Field | Value |
| --- | --- |
| Upstream repo | https://github.com/getredash/redash |
| Source path | `viz-lib/` |
| Pinned commit | `b95ff0cab70c30b83a4a92722b38e91cad5dd1c8` |
| Source ref | GitHub PR [#7669](https://github.com/getredash/redash/pull/7669) (`refs/pull/7669/head`) |
| Vendored on | 2026-08-29 |

**Why not `master`?** As of 2026-08-29, `getredash/redash` master (`ca79fe988d81cdac9675b412f3dfcab107bc1fbc`) still has React 16 / antd 4 peers. PR #7669 (React 19 / antd 6) is **open and unmerged**. The plan assumed it had landed on master; we vendored the PR head instead so the app can stay on React `^19.2.0` and `antd@^6`.

Peer deps of this copy:

- `react` / `react-dom` `>=19.0.0`
- `antd` `>=6.0.0`
- `@ant-design/icons` `>=6.0.0`

## How it is consumed

`import { Renderer, Editor } from '@redash/viz/lib'` and `import '@redash/viz/lib/index.css'`.

**Resolution path: Vite source alias (not a babel `lib/` build).**

viz-lib's `npm run build` is Unix-only (`NODE_ENV=production …`, `rm -rf`) and failed on Windows. Fallback allowed by the plan:

- `vite.config.ts` aliases `@redash/viz/lib` → `packages/redash-viz/src`
- A `viz-lib-internal-alias` plugin rewrites viz-lib's `@/` imports to `packages/redash-viz/src`, so they do not collide with the app's `@/*` → `./src/*`
- Vite transpiles TSX and compiles `.less` (`javascriptEnabled: true`)
- `packages/redash-viz/src/index.css` is a local stub: viz-lib has no root stylesheet; styles come from component-level `.less` files

Root `tsconfig.json` excludes `packages/**` so tsc does not type-check viz-lib internals. App-facing types live in `src/types/redash-viz.d.ts`.

## Vite browser shims

viz-lib was written for webpack + CJS. These `vite.config.ts` plugins/aliases are required for the Vite/TanStack Start app:

| Shim | Why |
| --- | --- |
| `d3v3WindowThis` | d3@3 is an IIFE that reads `this.document` |
| `plotlyDistDefault` | serve `plotly.js/dist/plotly.min.js` as `export default` (not the Node `lib/` entry, which pulls `probe-image-size`) |
| `src/shims/plotly-default.ts` | alias package `plotly.js` → that dist bundle |
| `src/shims/plotly-clean-number.ts` / `plotly-colorscale.ts` | viz-lib deep-imports CJS `plotly.js/src/...` files that use `require()` |
| `stubPlotlyLocales` | skip CJS locale registration (English Plotly strings still work) |
| `plotlyNamespaceToDefault` | rewrite `import * as Plotly from "plotly.js"` and `import * as d3 from "d3"` to default imports |
| `define.global = globalThis` | plotly/has-hover expect Node `global` |
| `resolve.dedupe` react/react-dom | workspace must not duplicate React |

The smoke route (`src/routes/dev.viz-smoke.tsx`) loads `Renderer` in `useEffect` with `ssr: false`. Statically importing viz-lib from a file in the route tree evaluates plotly/d3/classnames during SSR (`window is not defined`). Later tasks that render viz-lib in dashboard widgets should keep the same client-only boundary.

`/dev/viz-smoke` is in `PUBLIC_PATHS` so the smoke page is reachable while signed out.

antd 6 logs Table deprecation warnings (`pagination.position` → `placement`, `columns.render` cell props → `onCell`). Harmless for the smoke test; viz-lib still uses antd 4-era Table APIs.

## Re-sync instructions

PowerShell:

```powershell
$tmp = "C:\Users\nmwan\projects\.tmp-redash-viz-sync"
if (Test-Path $tmp) { Remove-Item -Recurse -Force $tmp }
git clone --depth 1 https://github.com/getredash/redash.git $tmp
Set-Location $tmp
git fetch --depth 1 origin pull/7669/head
git checkout FETCH_HEAD
git rev-parse HEAD   # record the new SHA in this file
$dest = "C:\Users\nmwan\projects\ics-dashboard\bi-dimes\packages\redash-viz"
Copy-Item "$dest\src\index.css" "$env:TEMP\redash-viz-index.css" -ErrorAction SilentlyContinue
Remove-Item $dest -Recurse -Force
Copy-Item "$tmp\viz-lib" $dest -Recurse
if (Test-Path "$env:TEMP\redash-viz-index.css") {
  Copy-Item "$env:TEMP\redash-viz-index.css" "$dest\src\index.css"
}
Set-Location C:\Users\nmwan\projects\ics-dashboard\bi-dimes
npm install --include=dev
```

Local patches applied on top of the vendored copy (re-apply after a re-sync):

- `package.json`: added `moment` (used by viz-lib but only provided by the Redash client app, not listed in viz-lib deps)
- `src/index.css`: stub for `@redash/viz/lib/index.css`

When PR #7669 merges, switch the fetch to `origin/master` (or a tagged release) and update the pinned SHA above. After copy, restore the local patches above.

Re-verify: `npm run dev` and open `/dev/viz-smoke` (removed in a later task once production widgets use viz-lib).
