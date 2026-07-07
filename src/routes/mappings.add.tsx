import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useMemo, useRef } from 'react'
import { MappingWizard } from '#/components/mapping/MappingWizard'
import { createNewMappingDraft } from '#/stores/mappingStore'
import { useWorkspaceMappings } from '#/hooks/useWorkspaceMappings'
import type { MappingDefinition } from '#/types/mapping'

export const Route = createFileRoute('/mappings/add')({
  component: MappingsAddPage,
})

function MappingsAddPage() {
  const navigate = useNavigate()
  const { upsertMapping } = useWorkspaceMappings()
  const draftRef = useRef<MappingDefinition | null>(null)
  if (!draftRef.current) {
    draftRef.current = createNewMappingDraft()
  }
  const initialDraft = useMemo(() => draftRef.current!, [])

  return (
    <MappingWizard
      initialDraft={initialDraft}
      title="Create mapping"
      subtitle="Name it, choose a data source or embed, configure, then review."
      onCancel={() => navigate({ to: '/mappings' })}
      onComplete={(next) => {
        void upsertMapping(next).then(() =>
          navigate({
            to: '/mappings/$mappingId',
            params: { mappingId: next.id },
          }),
        )
      }}
    />
  )
}
