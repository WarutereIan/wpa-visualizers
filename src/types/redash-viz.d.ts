declare module '@redash/viz/lib' {
  import type { ComponentType, ReactNode } from 'react'

  export type RedashVisualizationType =
    | 'CHART'
    | 'TABLE'
    | 'COUNTER'
    | 'PIVOT'
    | 'FUNNEL'
    | 'SANKEY'
    | 'SUNBURST_SEQUENCE'
    | 'MAP'
    | 'CHOROPLETH'
    | 'COHORT'
    | 'WORD_CLOUD'
    | 'DETAILS'

  export type RedashColumnType = 'integer' | 'float' | 'boolean' | 'string' | 'datetime' | 'date'

  export interface RedashQueryResult {
    columns: { name: string; type: RedashColumnType; friendly_name: string }[]
    rows: Record<string, unknown>[]
  }

  export interface RendererProps {
    type: RedashVisualizationType
    options: object
    data: RedashQueryResult
    visualizationName: string
    addonBefore?: ReactNode
    addonAfter?: ReactNode
  }

  export interface EditorProps {
    type: RedashVisualizationType
    options: object
    data: RedashQueryResult
    visualizationName?: string
    onOptionsChange: (opts: object) => void
  }

  export const Renderer: ComponentType<RendererProps>
  export const Editor: ComponentType<EditorProps>
}

declare module '@redash/viz/lib/index.css'

declare module 'plotly.js/dist/plotly.min.js' {
  const Plotly: unknown
  export default Plotly
}
