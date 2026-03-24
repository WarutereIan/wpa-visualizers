import { createFileRoute } from '@tanstack/react-router'
import { getBaselineMapUrl } from '#/lib/env'

export const Route = createFileRoute('/baseline-mapping')({
  component: BaselineMappingPage,
})

function BaselineMappingPage() {
  const src = getBaselineMapUrl()
  return (
    <div className="space-y-3">
      <div>
        <h1 className="text-2xl font-bold text-[var(--sea-ink)]">Baseline mapping</h1>
        <p className="mt-1 text-sm text-[var(--sea-ink-soft)]">
          Baseline map for the program. 
        
        </p>
      </div>
      <div className="overflow-hidden rounded-xl border border-[var(--line)] bg-[var(--surface-strong)] shadow-sm">
        <iframe
          title="Baseline map"
          src={src}
          className="h-[min(72vh,720px)] w-full border-0"
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
        />
      </div>
    </div>
  )
}
