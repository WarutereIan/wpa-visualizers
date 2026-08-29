import { createFileRoute } from '@tanstack/react-router'
import { useEffect, useState, type ComponentType } from 'react'
import type { RendererProps } from '@redash/viz/lib'

const data = {
  columns: [
    { name: 'month', type: 'string' as const, friendly_name: 'Month' },
    { name: 'total', type: 'integer' as const, friendly_name: 'Total' },
  ],
  rows: [
    { month: 'Jan', total: 10 },
    { month: 'Feb', total: 25 },
    { month: 'Mar', total: 17 },
  ],
}

const options = {
  globalSeriesType: 'column',
  columnMapping: { month: 'x', total: 'y' },
  legend: { enabled: true },
}

function VizSmokePage() {
  const [Renderer, setRenderer] = useState<ComponentType<RendererProps> | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    void Promise.all([import('@redash/viz/lib'), import('@redash/viz/lib/index.css')])
      .then(([mod]) => {
        if (!cancelled) setRenderer(() => mod.Renderer)
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          const message = err instanceof Error ? `${err.message}\n${err.stack ?? ''}` : String(err)
          setError(message)
        }
      })
    return () => {
      cancelled = true
    }
  }, [])

  if (error) {
    return (
      <pre style={{ padding: 24, color: 'crimson', whiteSpace: 'pre-wrap' }}>{error}</pre>
    )
  }

  if (!Renderer) {
    return <div style={{ padding: 24 }}>Loading viz-lib…</div>
  }

  return (
    <div style={{ padding: 24 }}>
      <h1>viz-lib smoke test</h1>
      <div style={{ height: 400 }}>
        <Renderer type="CHART" visualizationName="smoke" options={options} data={data} />
      </div>
      <div style={{ height: 300 }}>
        <Renderer type="TABLE" visualizationName="smoke-table" options={{}} data={data} />
      </div>
    </div>
  )
}

export const Route = createFileRoute('/dev/viz-smoke')({
  ssr: false,
  component: VizSmokePage,
})
