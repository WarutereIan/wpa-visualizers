import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { MappingViewer } from '#/components/mapping/MappingViewer'
import { useWorkspaceMappings } from '#/hooks/useWorkspaceMappings'
import { Button } from '#/components/ui/button'

export const Route = createFileRoute('/mappings/$mappingId')({
  component: MappingViewPage,
})

function MappingViewPage() {
  const { mappingId } = Route.useParams()
  const { getById, removeMapping } = useWorkspaceMappings()
  const mapping = getById(mappingId)
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
        void removeMapping(mappingId).then(() => navigate({ to: '/mappings' }))
      }}
    />
  )
}
