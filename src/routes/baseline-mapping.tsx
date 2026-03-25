import { createFileRoute } from '@tanstack/react-router'
import { getBaselineMapUrl } from '#/lib/env'

export const Route = createFileRoute('/baseline-mapping')({
  component: BaselineMappingPage,
})

/**
 * Full-bleed map: negative margins cancel main padding so the iframe uses the full content column.
 * Height = viewport minus sticky header (3.5rem) minus main vertical padding (2rem default, 3rem md).
 */
function BaselineMappingPage() {
  const src = getBaselineMapUrl()
  return (
    <div className="-mx-4 -mt-4 -mb-6 flex h-[calc(100dvh-3.5rem-2rem)] min-h-0 max-w-none flex-col md:-mx-6 md:-mt-6 md:-mb-6 md:h-[calc(100dvh-3.5rem-3rem)]">
      <div className="flex h-full min-h-0 min-w-0 flex-col overflow-hidden border border-[var(--line)] shadow-sm">
        <iframe
          title="Baseline map"
          src={src}
          className="h-full min-h-0 w-full border-0"
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
        />
      </div>
    </div>
  )
}
