import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useMemo, useRef } from 'react'
import { MappingWizard } from '#/components/mapping/MappingWizard'
import { createNewMappingDraft, useMappingStore } from '#/stores/mappingStore'
import type { MappingDefinition } from '#/types/mapping'

export const Route = createFileRoute('/mappings/add')({
  component: MappingsAddPage,
})

function MappingsAddPage() {
  const navigate = useNavigate()
  const upsertMapping = useMappingStore((s) => s.upsertMapping)
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
        upsertMapping(next)
        navigate({
          to: '/mappings/$mappingId',
          params: { mappingId: next.id },
        })
      }}
    />
  )
}
