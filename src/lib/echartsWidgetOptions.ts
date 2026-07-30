import type { EChartsOption } from 'echarts'
import type { DemoRow } from '#/hooks/useDemoDataset'
import { chartPaletteById, DEFAULT_CHART_PALETTE_ID } from '#/lib/chartPalettes'

/* ── palette helpers ─────────────────────────────────────── */
function resolveColors(paletteId?: string) {
  const colors = chartPaletteById(paletteId ?? DEFAULT_CHART_PALETTE_ID).colors
  return {
    primary: colors[0] ?? '#4fb8b2',
    secondary: colors[1] ?? '#6b9f7a',
    accent: colors[2] ?? '#c4a574',
    warn: colors[3] ?? '#e07b63',
    series: colors,
  }
}

function baseTitle(title: string) {
  return { text: title, left: 'center' as const, top: 4, textStyle: { fontSize: 13, color: '#1e3a3a' } }
}
const cartGrid = { left: '8%', right: '4%', bottom: '8%', top: 44, containLabel: true }

function names(rows: DemoRow[]) { return rows.map((r) => r.name) }
function vals(rows: DemoRow[])  { return rows.map((r) => r.value) }
function peak(rows: DemoRow[])  { return Math.max(1, ...rows.map((r) => r.value)) }

/* ── every chart type the widget palette can reference ── */
export type EChartsWidgetKind =
  | 'bar' | 'stacked_bar' | 'horizontal_bar'
  | 'line' | 'area' | 'stacked_area'
  | 'pie' | 'donut' | 'radar'
  | 'scatter' | 'bubble' | 'heatmap'
  | 'gauge' | 'funnel'
  | 'treemap' | 'sunburst'
  | 'sankey' | 'graph'
  | 'boxplot' | 'candlestick' | 'histogram'
  | 'waterfall'

export function buildEChartsOption(
  kind: EChartsWidgetKind,
  title: string,
  rows: DemoRow[],
  paletteId?: string,
): EChartsOption {
  const ns = names(rows)
  const vs = vals(rows)
  const { primary, secondary, accent, warn, series } = resolveColors(paletteId)
  const LAGOON = primary
  const PALM = secondary
  const SAND = accent
  const CORAL = warn
  const LAGOON_D = series[5] ?? primary
  const SERIES_COLORS = series
  const mx = peak(rows)

  switch (kind) {
    /* ── Comparison ────────────────────────────────── */
    case 'bar':
      return {
        title: baseTitle(title), tooltip: { trigger: 'axis' },
        grid: cartGrid,
        xAxis: { type: 'category', data: ns },
        yAxis: { type: 'value' },
        series: [{ type: 'bar', data: vs, itemStyle: { color: LAGOON }, barMaxWidth: 40 }],
      }
    case 'stacked_bar':
      return {
        title: baseTitle(title), tooltip: { trigger: 'axis' }, legend: { bottom: 0, textStyle: { fontSize: 10 } },
        grid: { ...cartGrid, bottom: '14%' },
        xAxis: { type: 'category', data: ns },
        yAxis: { type: 'value' },
        series: [
          { name: 'Series A', type: 'bar', stack: 's', data: vs, itemStyle: { color: LAGOON }, barMaxWidth: 40 },
          { name: 'Series B', type: 'bar', stack: 's', data: vs.map((v) => Math.round(v * 0.6)), itemStyle: { color: PALM }, barMaxWidth: 40 },
        ],
      }
    case 'horizontal_bar':
      return {
        title: baseTitle(title), tooltip: { trigger: 'axis' },
        grid: cartGrid,
        yAxis: { type: 'category', data: ns, inverse: true },
        xAxis: { type: 'value' },
        series: [{ type: 'bar', data: vs, itemStyle: { color: LAGOON }, barMaxWidth: 28 }],
      }
    case 'radar':
      return {
        title: baseTitle(title), tooltip: {},
        radar: { indicator: rows.map((r) => ({ name: r.name, max: mx })) },
        series: [{ type: 'radar', data: [{ value: vs, name: title }], areaStyle: { opacity: 0.2 }, lineStyle: { color: LAGOON } }],
      }

    /* ── Trend ─────────────────────────────────────── */
    case 'line':
      return {
        title: baseTitle(title), tooltip: { trigger: 'axis' },
        grid: cartGrid,
        xAxis: { type: 'category', data: ns },
        yAxis: { type: 'value' },
        series: [{ type: 'line', smooth: true, data: vs, lineStyle: { color: PALM }, itemStyle: { color: PALM } }],
      }
    case 'area':
      return {
        title: baseTitle(title), tooltip: { trigger: 'axis' },
        grid: cartGrid,
        xAxis: { type: 'category', boundaryGap: false, data: ns },
        yAxis: { type: 'value' },
        series: [{ type: 'line', smooth: true, data: vs, areaStyle: { opacity: 0.25, color: LAGOON }, lineStyle: { color: LAGOON } }],
      }
    case 'stacked_area':
      return {
        title: baseTitle(title), tooltip: { trigger: 'axis' }, legend: { bottom: 0, textStyle: { fontSize: 10 } },
        grid: { ...cartGrid, bottom: '14%' },
        xAxis: { type: 'category', boundaryGap: false, data: ns },
        yAxis: { type: 'value' },
        series: [
          { name: 'Set A', type: 'line', stack: 'total', areaStyle: { opacity: 0.3 }, data: vs, lineStyle: { color: LAGOON }, itemStyle: { color: LAGOON } },
          { name: 'Set B', type: 'line', stack: 'total', areaStyle: { opacity: 0.3 }, data: vs.map((v) => Math.round(v * 0.5)), lineStyle: { color: PALM }, itemStyle: { color: PALM } },
        ],
      }

    /* ── Part-to-whole ─────────────────────────────── */
    case 'pie':
      return {
        title: baseTitle(title), tooltip: { trigger: 'item' },
        series: [{ type: 'pie', radius: '65%', data: rows.map((r, i) => ({ name: r.name, value: r.value, itemStyle: { color: SERIES_COLORS[i % SERIES_COLORS.length] } })), label: { fontSize: 10 } }],
      }
    case 'donut':
      return {
        title: baseTitle(title), tooltip: { trigger: 'item' },
        series: [{ type: 'pie', radius: ['40%', '70%'], data: rows.map((r, i) => ({ name: r.name, value: r.value, itemStyle: { color: SERIES_COLORS[i % SERIES_COLORS.length] } })), label: { fontSize: 10 } }],
      }
    case 'sunburst':
      return {
        title: baseTitle(title), tooltip: { trigger: 'item' },
        series: [{ type: 'sunburst', radius: ['15%', '90%'], data: [{ name: 'root', children: rows.map((r) => ({ name: r.name, value: r.value })) }], label: { fontSize: 9 } }],
      }
    case 'treemap':
      return {
        title: baseTitle(title), tooltip: { trigger: 'item' },
        series: [{ type: 'treemap', roam: false, data: rows.map((r) => ({ name: r.name, value: r.value })), label: { fontSize: 10 }, upperLabel: { show: true } }],
      }
    case 'funnel':
      return {
        title: baseTitle(title), tooltip: { trigger: 'item' },
        series: [{ type: 'funnel', sort: 'descending', data: rows.map((r) => ({ name: r.name, value: r.value })) }],
      }

    /* ── Correlation ───────────────────────────────── */
    case 'scatter':
      return {
        title: baseTitle(title), tooltip: { trigger: 'item' },
        grid: cartGrid,
        xAxis: { type: 'value', name: 'Index' },
        yAxis: { type: 'value', name: 'Value' },
        series: [{ type: 'scatter', data: rows.map((r, i) => [i, r.value]), symbolSize: 14, itemStyle: { color: LAGOON } }],
      }
    case 'bubble':
      return {
        title: baseTitle(title), tooltip: { trigger: 'item' },
        grid: cartGrid,
        xAxis: { type: 'value', name: 'Index' },
        yAxis: { type: 'value', name: 'Value' },
        series: [{ type: 'scatter', data: rows.map((r, i) => [i, r.value, r.value]), symbolSize: (d: number[]) => 8 + (d[2] ?? 10) / 5, itemStyle: { color: LAGOON, opacity: 0.7 } }],
      }
    case 'heatmap': {
      const data: [number, number, number][] = []
      const ySeries = ['Set A', 'Set B']
      rows.forEach((r, xi) => { data.push([xi, 0, r.value]); data.push([xi, 1, Math.round(r.value * 0.7)]) })
      return {
        title: baseTitle(title), tooltip: { position: 'top' },
        grid: { left: '12%', right: '8%', bottom: '18%', top: 40 },
        xAxis: { type: 'category', data: ns, splitArea: { show: true } },
        yAxis: { type: 'category', data: ySeries, splitArea: { show: true } },
        visualMap: { min: 0, max: mx, calculable: true, orient: 'horizontal' as const, left: 'center', bottom: 0, inRange: { color: ['#e8f4f3', LAGOON] } },
        series: [{ type: 'heatmap', data, label: { show: true, fontSize: 10 }, emphasis: { itemStyle: { shadowBlur: 10 } } }],
      }
    }

    /* ── Flow & relationship ───────────────────────── */
    case 'sankey': {
      const nodes = rows.length >= 2
        ? rows.map((r) => ({ name: r.name }))
        : [{ name: rows[0]?.name ?? 'A' }, { name: 'B' }]
      const links = rows.length >= 2
        ? rows.slice(0, -1).map((_, i) => ({ source: i, target: i + 1, value: Math.max(1, rows[i].value) }))
        : [{ source: 0, target: 1, value: Math.max(1, rows[0]?.value ?? 1) }]
      return {
        title: baseTitle(title), tooltip: {},
        series: [{ type: 'sankey', data: nodes, links, emphasis: { focus: 'adjacency' as const }, lineStyle: { color: 'source' as const, curveness: 0.5 } }],
      }
    }
    case 'graph': {
      const nodeData = rows.map((r, i) => ({ id: String(i), name: r.name, value: r.value, symbolSize: 14 + r.value / 4 }))
      const linkData = rows.slice(0, -1).map((_, i) => ({ source: String(i), target: String(i + 1), value: rows[i].value }))
      return {
        title: baseTitle(title), tooltip: {},
        series: [{ type: 'graph', layout: 'force', roam: true, label: { show: true, fontSize: 9 }, force: { repulsion: 200, edgeLength: 80 }, data: nodeData, links: linkData, lineStyle: { color: SAND, curveness: 0.2 } }],
      }
    }

    /* ── Statistical ───────────────────────────────── */
    case 'boxplot': {
      const sorted = [...vs].sort((a, b) => a - b)
      const q1 = sorted[Math.floor(sorted.length * 0.25)] ?? 0
      const med = sorted[Math.floor(sorted.length * 0.5)] ?? 0
      const q3 = sorted[Math.floor(sorted.length * 0.75)] ?? 0
      const lo = sorted[0] ?? 0
      const hi = sorted[sorted.length - 1] ?? 0
      return {
        title: baseTitle(title), tooltip: { trigger: 'item' },
        grid: cartGrid,
        xAxis: { type: 'category', data: [title] },
        yAxis: { type: 'value' },
        series: [{ type: 'boxplot', data: [[lo, q1, med, q3, hi]], itemStyle: { color: LAGOON, borderColor: LAGOON_D } }],
      }
    }
    case 'candlestick': {
      const ohlc = rows.map((r) => {
        const o = r.value
        const c = Math.round(o * (0.85 + Math.random() * 0.3))
        const h = Math.max(o, c) + Math.round(Math.random() * 10)
        const l = Math.min(o, c) - Math.round(Math.random() * 10)
        return [o, c, l, h]
      })
      return {
        title: baseTitle(title), tooltip: { trigger: 'axis' },
        grid: cartGrid,
        xAxis: { type: 'category', data: ns },
        yAxis: { type: 'value', scale: true },
        series: [{ type: 'candlestick', data: ohlc }],
      }
    }
    case 'histogram':
      return {
        title: baseTitle(title), tooltip: { trigger: 'axis' },
        grid: cartGrid,
        xAxis: { type: 'category', data: ns },
        yAxis: { type: 'value' },
        series: [{ type: 'bar', data: vs, itemStyle: { color: LAGOON }, barCategoryGap: '5%' }],
      }

    /* ── Indicator ─────────────────────────────────── */
    case 'gauge': {
      const avg = vs.length ? Math.round(vs.reduce((a, b) => a + b, 0) / vs.length) : 0
      return {
        title: baseTitle(title),
        series: [{ type: 'gauge', min: 0, max: mx, detail: { fontSize: 14 }, data: [{ value: avg, name: 'Avg' }], axisLine: { lineStyle: { color: [[1, LAGOON]] } } }],
      }
    }
    case 'waterfall': {
      const base: number[] = []
      const plus: (number | '-')[] = []
      const minus: (number | '-')[] = []
      let running = 0
      for (const r of rows) {
        const delta = r.value - (running || 0)
        if (delta >= 0) {
          base.push(running)
          plus.push(delta)
          minus.push('-')
        } else {
          base.push(running + delta)
          plus.push('-')
          minus.push(-delta)
        }
        running = r.value
      }
      return {
        title: baseTitle(title), tooltip: { trigger: 'axis' },
        grid: cartGrid,
        xAxis: { type: 'category', data: ns },
        yAxis: { type: 'value' },
        series: [
          { name: 'Base', type: 'bar', stack: 'w', data: base, itemStyle: { color: 'transparent' }, emphasis: { itemStyle: { color: 'transparent' } } },
          { name: 'Increase', type: 'bar', stack: 'w', data: plus, itemStyle: { color: LAGOON }, barMaxWidth: 32 },
          { name: 'Decrease', type: 'bar', stack: 'w', data: minus, itemStyle: { color: CORAL }, barMaxWidth: 32 },
        ],
      }
    }

    default:
      return buildEChartsOption('bar', title, rows)
  }
}
