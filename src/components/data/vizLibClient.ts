import { useEffect, useState, type ComponentType } from 'react'
import type { EditorProps, RendererProps } from '@redash/viz/lib'
import { useChoroplethMaps } from '#/hooks/useChoroplethMaps'
import type { ChoroplethAvailableMaps } from '#/lib/geo/mapRegistry'

type VizLibComponents = {
  Renderer: ComponentType<RendererProps>
  Editor: ComponentType<EditorProps>
}

/** Client-only viz-lib load. Never statically import `@redash/viz/lib` from route modules. */
export function useVizLib(choroplethAvailableMaps?: ChoroplethAvailableMaps): {
  Renderer: ComponentType<RendererProps> | null
  Editor: ComponentType<EditorProps> | null
  error: string | null
} {
  const defaultMaps = useChoroplethMaps()
  const maps = choroplethAvailableMaps ?? defaultMaps

  const [libs, setLibs] = useState<VizLibComponents | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [vizMod, setVizMod] = useState<typeof import('@redash/viz/lib') | null>(null)

  useEffect(() => {
    let cancelled = false
    void Promise.all([import('@redash/viz/lib'), import('@redash/viz/lib/index.css')])
      .then(([mod]) => {
        if (!cancelled) {
          setLibs({ Renderer: mod.Renderer, Editor: mod.Editor })
          setVizMod(mod)
        }
      })
      .catch((err: unknown) => {
        if (!cancelled) setError(err instanceof Error ? err.message : String(err))
      })
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    if (!vizMod) return
    vizMod.updateVisualizationsSettings({ choroplethAvailableMaps: maps })
  }, [vizMod, maps])

  return {
    Renderer: libs?.Renderer ?? null,
    Editor: libs?.Editor ?? null,
    error,
  }
}
