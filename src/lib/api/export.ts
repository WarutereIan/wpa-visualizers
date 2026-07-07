import { invokeEdgeFunction } from '#/lib/api/invoke'

export interface ExportRowsResult {
  tableName: string
  columns: string[]
  csv?: string
  rows?: Record<string, unknown>[]
  offset: number
  limit: number
  hasMore: boolean
  total: number
}

export async function exportTableRows(
  orgId: string,
  tableId: string,
  opts?: { format?: 'csv' | 'json'; offset?: number; limit?: number },
): Promise<ExportRowsResult> {
  return invokeEdgeFunction<ExportRowsResult>('export-rows', {
    organizationId: orgId,
    tableId,
    format: opts?.format ?? 'csv',
    offset: opts?.offset ?? 0,
    limit: opts?.limit ?? 1000,
  })
}

/** Download full table as CSV via paginated export-rows calls. */
export async function downloadTableCsv(orgId: string, tableId: string, tableName: string): Promise<void> {
  const chunks: string[] = []
  let offset = 0
  let hasMore = true
  let headerWritten = false

  while (hasMore) {
    const page = await exportTableRows(orgId, tableId, { format: 'csv', offset, limit: 1000 })
    if (!page.csv) break

    if (!headerWritten) {
      chunks.push(page.csv)
      headerWritten = true
    } else {
      const lines = page.csv.split('\n')
      if (lines.length > 1) chunks.push(lines.slice(1).join('\n'))
    }

    hasMore = page.hasMore
    offset += page.limit
  }

  const blob = new Blob([chunks.join('\n')], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${tableName.replace(/[^\w.-]+/g, '_') || 'table'}.csv`
  a.click()
  URL.revokeObjectURL(url)
}
