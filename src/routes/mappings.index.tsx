import { createFileRoute, Link } from '@tanstack/react-router'
import { useMappingStore } from '#/stores/mappingStore'
import { Button } from '#/components/ui/button'

export const Route = createFileRoute('/mappings/')({
  component: MappingsIndexPage,
})

function MappingsIndexPage() {
  const mappings = useMappingStore((s) => s.mappings)

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[var(--sea-ink)]">Mappings</h1>
          <p className="mt-1 text-sm text-[var(--sea-ink-soft)]">
            Create views from datasets.
          </p>
        </div>
        <Button asChild>
          <Link to="/mappings/add">Create with wizard</Link>
        </Button>
      </div>

      {mappings.length === 0 ? (
        <div className="rounded-xl border border-dashed border-[var(--line)] bg-[var(--surface-strong)] p-10 text-center">
          <p className="text-[var(--sea-ink-soft)]">No saved mappings yet.</p>
          <Button asChild className="mt-4">
            <Link to="/mappings/add">Create your first mapping</Link>
          </Button>
        </div>
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {mappings.map((m) => (
            <li key={m.id}>
              <div className="rounded-xl border border-[var(--line)] bg-[var(--surface-strong)] p-4 shadow-sm transition hover:border-[var(--lagoon)]">
                <Link to="/mappings/$mappingId" params={{ mappingId: m.id }} className="block">
                  <span className="font-semibold text-[var(--sea-ink)]">{m.name}</span>
                  {m.description && (
                    <p className="mt-1 line-clamp-2 text-sm text-[var(--sea-ink-soft)]">
                      {m.description}
                    </p>
                  )}
                  <p className="mt-2 text-xs text-[var(--sea-ink-soft)]">
                    Updated {new Date(m.updatedAt).toLocaleString()}
                  </p>
                </Link>
                <div className="mt-3 border-t border-[var(--line)] pt-3">
                  <Button variant="outline" size="sm" asChild>
                    <Link to="/mappings/$mappingId" params={{ mappingId: m.id }}>
                      Open
                    </Link>
                  </Button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
