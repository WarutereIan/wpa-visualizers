import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import { Button } from '#/components/ui/button'
import {
  useCreateValidationRule,
  useDataQualityIssues,
  useRunValidation,
  useUpdateIssueStatus,
  useValidationRules,
} from '#/lib/api/dataQuality'
import { useWorkspaceData } from '#/hooks/useWorkspaceData'
import { useOrgId, useWorkspaceReady } from '#/lib/api/workspace'

export const Route = createFileRoute('/data-quality')({
  component: DataQualityPage,
})

function DataQualityPage() {
  const workspaceReady = useWorkspaceReady()
  const orgId = useOrgId()
  const { tables } = useWorkspaceData()
  const { data: rules = [] } = useValidationRules(workspaceReady ? orgId : null)
  const { data: issues = [] } = useDataQualityIssues(workspaceReady ? orgId : null, 'open')
  const createRule = useCreateValidationRule(workspaceReady ? orgId : null)
  const runValidation = useRunValidation(workspaceReady ? orgId : null)
  const updateStatus = useUpdateIssueStatus(workspaceReady ? orgId : null)

  const [tableId, setTableId] = useState('')
  const [columnName, setColumnName] = useState('')
  const [minVal, setMinVal] = useState('0')
  const [maxVal, setMaxVal] = useState('100')
  const [formMsg, setFormMsg] = useState<string | null>(null)

  if (!workspaceReady) {
    return (
      <div className="rounded-xl border border-[var(--line)] bg-[var(--surface-strong)] p-6 text-sm text-[var(--sea-ink-soft)]">
        Sign in to manage data quality rules and triage issues.
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <header className="rounded-xl border border-[var(--line)] bg-[var(--surface-strong)] p-6 shadow-sm">
        <h1 className="text-2xl font-bold text-[var(--sea-ink)]">Data quality</h1>
        <p className="mt-2 text-sm text-[var(--sea-ink-soft)]">
          Validation rules run against imported tables; issues appear in the triage board below.
        </p>
      </header>

      <section className="rounded-xl border border-[var(--line)] bg-[var(--surface-strong)] p-4">
        <h2 className="mb-3 text-base font-semibold text-[var(--sea-ink)]">Add range rule</h2>
        <form
          className="flex flex-wrap items-end gap-2"
          onSubmit={(e) => {
            e.preventDefault()
            if (!tableId || !columnName) return
            setFormMsg(null)
            void createRule
              .mutateAsync({
                dataTableId: tableId,
                columnName,
                ruleType: 'range',
                expression: { min: Number(minVal), max: Number(maxVal) },
              })
              .then(() => setFormMsg('Rule added.'))
              .catch((err: unknown) =>
                setFormMsg(err instanceof Error ? err.message : 'Failed to add rule'),
              )
          }}
        >
          <label className="text-sm">
            Table
            <select
              className="mt-1 flex h-9 min-w-[160px] rounded-md border border-[var(--line)] bg-[var(--surface)] px-2 text-sm"
              value={tableId}
              onChange={(e) => setTableId(e.target.value)}
            >
              <option value="">Select…</option>
              {tables.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </label>
          <label className="text-sm">
            Column
            <input
              className="mt-1 flex h-9 w-32 rounded-md border border-[var(--line)] bg-[var(--surface)] px-2 text-sm"
              value={columnName}
              onChange={(e) => setColumnName(e.target.value)}
            />
          </label>
          <label className="text-sm">
            Min
            <input
              type="number"
              className="mt-1 flex h-9 w-20 rounded-md border border-[var(--line)] bg-[var(--surface)] px-2 text-sm"
              value={minVal}
              onChange={(e) => setMinVal(e.target.value)}
            />
          </label>
          <label className="text-sm">
            Max
            <input
              type="number"
              className="mt-1 flex h-9 w-20 rounded-md border border-[var(--line)] bg-[var(--surface)] px-2 text-sm"
              value={maxVal}
              onChange={(e) => setMaxVal(e.target.value)}
            />
          </label>
          <Button type="submit" size="sm" disabled={createRule.isPending}>
            Add rule
          </Button>
          {tableId && (
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={runValidation.isPending}
              onClick={() => {
                setFormMsg(null)
                void runValidation
                  .mutateAsync(tableId)
                  .then((r) => setFormMsg(`Validation ran — ${r.issuesCreated} new issue(s).`))
                  .catch((err: unknown) =>
                    setFormMsg(err instanceof Error ? err.message : 'Validation failed'),
                  )
              }}
            >
              Run validation
            </Button>
          )}
        </form>
        {formMsg && (
          <p className="mt-2 text-xs text-[var(--sea-ink-soft)]">{formMsg}</p>
        )}
        <p className="mt-2 text-xs text-[var(--sea-ink-soft)]">{rules.length} rule(s) configured</p>
      </section>

      <section className="rounded-xl border border-[var(--line)] bg-[var(--surface-strong)] p-4">
        <h2 className="mb-3 text-base font-semibold text-[var(--sea-ink)]">Issues triage</h2>
        {issues.length === 0 ? (
          <p className="text-sm text-[var(--sea-ink-soft)]">No open issues.</p>
        ) : (
          <ul className="space-y-2">
            {issues.map((issue) => (
              <li
                key={issue.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-[var(--line)] px-3 py-2 text-sm"
              >
                <span>
                  Row <code>{issue.rowId?.slice(0, 8)}</code> · status{' '}
                  <strong>{issue.status}</strong>
                </span>
                {issue.status === 'open' && (
                  <div className="flex gap-1">
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => void updateStatus.mutateAsync({ id: issue.id, status: 'resolved' })}
                    >
                      Resolve
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      onClick={() => void updateStatus.mutateAsync({ id: issue.id, status: 'accepted' })}
                    >
                      Accept
                    </Button>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}
