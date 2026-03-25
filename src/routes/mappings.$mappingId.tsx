import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { MappingViewer } from '#/components/mapping/MappingViewer'
import { useMappingStore } from '#/stores/mappingStore'
import { Button } from '#/components/ui/button'

export const Route = createFileRoute('/mappings/$mappingId')({
  component: MappingViewPage,
})

function MappingViewPage() {
  const { mappingId } = Route.useParams()
  const mapping = useMappingStore((s) => s.getById(mappingId))
  const removeMapping = useMappingStore((s) => s.removeMapping)
  const navigate = useNavigate()

  if (!mapping) {
    return (
      <div className="rounded-xl border border-[var(--line)] bg-[var(--surface-strong)] p-8 text-center">
        <p className="text-[var(--sea-ink)]">This mapping does not exist (or was removed).</p>
        <Button asChild className="mt-4">
          <Link to="/mappings">Back to mappings</Link>
        </Button>
      </div>
    )
  }

  return (
    <MappingViewer
      mapping={mapping}
      onDelete={() => {
        removeMapping(mappingId)
        navigate({ to: '/mappings' })
      }}
    />
  )
}
