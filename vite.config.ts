import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig, type Plugin } from 'vite'
import { devtools } from '@tanstack/devtools-vite'
import tsconfigPaths from 'vite-tsconfig-paths'

import { tanstackStart } from '@tanstack/react-start/plugin/vite'
import { nitro } from 'nitro/vite'

import viteReact from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

const vizLibSrc = path
  .resolve(path.dirname(fileURLToPath(import.meta.url)), 'packages/redash-viz/src')
  .replaceAll('\\', '/')

const plotlyShim = path
  .resolve(path.dirname(fileURLToPath(import.meta.url)), 'src/shims/plotly-default.ts')
  .replaceAll('\\', '/')

const plotlyCleanNumber = path
  .resolve(path.dirname(fileURLToPath(import.meta.url)), 'src/shims/plotly-clean-number.ts')
  .replaceAll('\\', '/')

const plotlyColorscale = path
  .resolve(path.dirname(fileURLToPath(import.meta.url)), 'src/shims/plotly-colorscale.ts')
  .replaceAll('\\', '/')

/** Rewrite viz-lib's `@/` imports to its own src, not the app's `@/*` alias. */
function vizLibInternalAlias(): Plugin {
  return {
    name: 'viz-lib-internal-alias',
    enforce: 'pre',
    resolveId(id, importer) {
      if (!id.startsWith('@/') || !importer) return
      const fromViz = importer.replaceAll('\\', '/').includes('/packages/redash-viz/')
      if (!fromViz) return
      const resolved = path.resolve(vizLibSrc, id.slice(2)).replaceAll('\\', '/')
      return this.resolve(resolved, importer, { skipSelf: true })
    },
  }
}

/** d3@3 is an IIFE UMD that reads `this.document`. ESM wraps make `this` undefined. */
function d3v3WindowThis(): Plugin {
  const isD3Bundle = (id: string) => {
    const n = id.split('?')[0].replaceAll('\\', '/')
    return n.endsWith('/node_modules/d3/d3.js') || n.endsWith('/node_modules/d3/d3.min.js')
  }
  return {
    name: 'd3-v3-window-this',
    enforce: 'pre',
    transform(code, id) {
      if (!isD3Bundle(id)) return
      let wrapped = code
      if (wrapped.startsWith('!function()')) {
        wrapped = wrapped.replace(/^!function\(\)/, '(function()')
        wrapped = wrapped.replace(/\}\(\);\s*$/, '}).call(globalThis);\n')
      }
      return {
        code: `const module = { exports: {} };\nconst exports = module.exports;\nconst define = undefined;\n${wrapped}\nconst d3 = (module.exports && module.exports.version) ? module.exports : globalThis.d3;\nexport default d3;\n`,
        map: null,
      }
    },
  }
}

/** Plotly locale/src files are CJS (`module.exports`); ESM default imports need a wrap. */
function plotlyCjsDefault(): Plugin {
  return {
    name: 'plotly-cjs-default',
    enforce: 'pre',
    transform(code, id) {
      const n = id.split('?')[0].replaceAll('\\', '/')
      if (!n.includes('/node_modules/plotly.js/')) return
      if (n.includes('/plotly.js/dist/')) return
      if (/\bexport\s+(default|const|function|class|\{)/.test(code)) return
      if (!/\bmodule\.exports\b/.test(code) && !/\bexports\./.test(code)) return
      return {
        code: `const module = { exports: {} };\nconst exports = module.exports;\n${code}\nexport default module.exports;\n`,
        map: null,
      }
    },
  }
}

function stubPlotlyLocales(): Plugin {
  const stub = path
    .resolve(path.dirname(fileURLToPath(import.meta.url)), 'src/shims/plotly-locales-stub.ts')
    .replaceAll('\\', '/')
  const isLocalesFile = (id: string) =>
    id.split('?')[0].replaceAll('\\', '/').endsWith('/visualizations/chart/plotly/locales.ts')
  return {
    name: 'stub-plotly-locales',
    enforce: 'pre',
    resolveId(id, importer) {
      const spec = id.replaceAll('\\', '/').split('?')[0]
      if (isLocalesFile(spec)) return stub
      if (!importer) return
      const fromPlotly = importer.replaceAll('\\', '/').includes('/visualizations/chart/plotly/')
      if (fromPlotly && (spec === './locales' || spec === './locales.ts')) return stub
    },
    transform(_code, id) {
      if (!isLocalesFile(id)) return
      return { code: 'export {}\n', map: null }
    },
  }
}

/** viz-lib uses `import * as Plotly from "plotly.js"`; the dist bundle is a default export. */
function plotlyNamespaceToDefault(): Plugin {
  return {
    name: 'plotly-namespace-to-default',
    enforce: 'pre',
    transform(code, id) {
      const n = id.split('?')[0].replaceAll('\\', '/')
      if (!n.includes('/packages/redash-viz/')) return
      if (
        !code.includes('import * as Plotly from "plotly.js"') &&
        !code.includes('import * as d3 from "d3"')
      ) {
        return
      }
      return {
        code: code.replace(
          /import \* as Plotly from ["']plotly\.js["']/g,
          'import Plotly from "plotly.js"',
        ).replace(
          /import \* as d3 from ["']d3["']/g,
          'import d3 from "d3"',
        ),
        map: null,
      }
    },
  }
}

function plotlyDistDefault(): Plugin {
  const prefix = '\0plotly-dist:'
  const rootDir = path.dirname(fileURLToPath(import.meta.url))
  return {
    name: 'plotly-dist-default',
    enforce: 'pre',
    resolveId(id) {
      const spec = id.split('?')[0].replaceAll('\\', '/')
      if (spec === 'plotly.js/dist/plotly.min.js' || spec.endsWith('/plotly.js/dist/plotly.min.js')) {
        return prefix + 'min'
      }
      if (spec === 'plotly.js/dist/plotly.js' || spec.endsWith('/plotly.js/dist/plotly.js')) {
        return prefix + 'full'
      }
    },
    async load(id) {
      if (!id.startsWith(prefix)) return
      const fs = await import('node:fs/promises')
      const file = path.resolve(
        rootDir,
        id.endsWith('min')
          ? 'node_modules/plotly.js/dist/plotly.min.js'
          : 'node_modules/plotly.js/dist/plotly.js',
      )
      const code = await fs.readFile(file, 'utf8')
      return `const module = { exports: {} };\nconst exports = module.exports;\n${code}\nexport default module.exports;\n`
    },
  }
}

const vizLibAlias = [
  { find: /^@redash\/viz\/lib$/, replacement: vizLibSrc },
  { find: /^@redash\/viz\/lib\/(.*)$/, replacement: `${vizLibSrc}/$1` },
  { find: /^plotly\.js$/, replacement: plotlyShim },
  { find: /^plotly\.js\/src\/lib\/clean_number$/, replacement: plotlyCleanNumber },
  { find: /^plotly\.js\/src\/components\/colorscale$/, replacement: plotlyColorscale },
]

export default defineConfig(({ mode }) => ({
  plugins:
    mode === 'test'
      ? [tsconfigPaths({ projects: ['./tsconfig.json'] })]
      : [
          d3v3WindowThis(),
          plotlyCjsDefault(),
          plotlyDistDefault(),
          stubPlotlyLocales(),
          plotlyNamespaceToDefault(),
          vizLibInternalAlias(),
          devtools(),
          tsconfigPaths({
            projects: ['./tsconfig.json', './packages/redash-viz/tsconfig.json'],
          }),
          tailwindcss(),
          tanstackStart(),
          nitro({ preset: 'vercel' }),
          viteReact(),
        ],
  resolve: {
    alias: vizLibAlias,
    dedupe: ['react', 'react-dom'],
  },
  define: {
    global: 'globalThis',
  },
  optimizeDeps: {
    include: ['lodash', 'moment'],
    exclude: ['d3', 'plotly.js', 'plotly.js/dist/plotly.min.js', 'plotly.js/dist/plotly.js'],
    esbuildOptions: {
      define: {
        global: 'globalThis',
      },
    },
  },
  css: {
    preprocessorOptions: {
      less: {
        javascriptEnabled: true,
      },
    },
  },
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
}))
