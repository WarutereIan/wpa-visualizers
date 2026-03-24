import {
  flexRender,
  getCoreRowModel,
  type ColumnDef,
  useReactTable,
} from '@tanstack/react-table'
import { useMemo } from 'react'
import type { DataRow } from '#/types/data'

export function TableWidget({ title, rows }: { title: string; rows: DataRow[] }) {
  const columns = useMemo<ColumnDef<DataRow>[]>(() => {
    const keys = Object.keys(rows[0] ?? {})
    return keys.map((k) => ({
      accessorKey: k,
      header: k,
      cell: ({ getValue }) => String(getValue() ?? ''),
    }))
  }, [rows])

  const table = useReactTable({
    data: rows,
    columns,
    getCoreRowModel: getCoreRowModel(),
  })

  return (
    <div className="flex h-full min-h-[160px] flex-col overflow-hidden rounded-xl border border-[var(--line)] bg-[var(--surface-strong)] shadow-sm">
      <p className="border-b border-[var(--line)] px-3 py-2 text-sm font-semibold text-[var(--sea-ink)]">
        {title}
      </p>
      <div className="min-h-0 flex-1 overflow-auto">
        <table className="w-full text-left text-sm">
          <thead className="sticky top-0 bg-[var(--sand)] text-xs uppercase text-[var(--sea-ink-soft)]">
            {table.getHeaderGroups().map((hg) => (
              <tr key={hg.id}>
                {hg.headers.map((h) => (
                  <th key={h.id} className="px-3 py-2 font-medium">
                    {h.isPlaceholder
                      ? null
                      : flexRender(h.column.columnDef.header, h.getContext())}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.map((row) => (
              <tr
                key={row.id}
                className="border-t border-[var(--line)] hover:bg-[rgba(79,184,178,0.08)]"
              >
                {row.getVisibleCells().map((cell) => (
                  <td key={cell.id} className="px-3 py-2 tabular-nums">
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
