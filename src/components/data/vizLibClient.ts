import { useEffect, useState, type ComponentType } from 'react'
import type { EditorProps, RendererProps } from '@redash/viz/lib'

type VizLibComponents = {
  Renderer: ComponentType<RendererProps>
  Editor: ComponentType<EditorProps>
}

/** Client-only viz-lib load. Never statically import `@redash/viz/lib` from route modules. */
export function useVizLib(): {
  Renderer: ComponentType<RendererProps> | null
  Editor: ComponentType<EditorProps> | null
  error: string | null
} {
  const [libs, setLibs] = useState<VizLibComponents | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    void Promise.all([import('@redash/viz/lib'), import('@redash/viz/lib/index.css')])
      .then(([mod]) => {
        if (!cancelled) setLibs({ Renderer: mod.Renderer, Editor: mod.Editor })
      })
      .catch((err: unknown) => {
        if (!cancelled) setError(err instanceof Error ? err.message : String(err))
      })
    return () => {
      cancelled = true
    }
  }, [])

  return {
    Renderer: libs?.Renderer ?? null,
    Editor: libs?.Editor ?? null,
    error,
  }
}
