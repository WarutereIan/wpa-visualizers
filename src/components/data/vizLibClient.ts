import { useEffect, useRef, useState, type ComponentType } from 'react'
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
  const mapsRef = useRef(maps)
  mapsRef.current = maps
  const vizModRef = useRef<typeof import('@redash/viz/lib') | null>(null)

  const [libs, setLibs] = useState<VizLibComponents | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [settingsReady, setSettingsReady] = useState(false)

  useEffect(() => {
    let cancelled = false
    void Promise.all([import('@redash/viz/lib'), import('@redash/viz/lib/index.css')])
      .then(([mod]) => {
        if (cancelled) return
        mod.updateVisualizationsSettings({ choroplethAvailableMaps: mapsRef.current })
        vizModRef.current = mod
        setLibs({ Renderer: mod.Renderer, Editor: mod.Editor })
        setSettingsReady(true)
      })
      .catch((err: unknown) => {
        if (!cancelled) setError(err instanceof Error ? err.message : String(err))
      })
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    if (!vizModRef.current) return
    vizModRef.current.updateVisualizationsSettings({ choroplethAvailableMaps: maps })
  }, [maps])

  return {
    Renderer: settingsReady ? (libs?.Renderer ?? null) : null,
    Editor: settingsReady ? (libs?.Editor ?? null) : null,
    error,
  }
}
