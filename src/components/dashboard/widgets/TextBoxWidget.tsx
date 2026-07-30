type TextAlign = 'left' | 'center' | 'right'
type TextSize = 'sm' | 'md' | 'lg'

export function TextBoxWidget({
  title,
  body,
  align = 'left',
  size = 'md',
}: {
  title: string
  body?: string
  align?: TextAlign
  size?: TextSize
}) {
  const alignClass =
    align === 'center' ? 'text-center' : align === 'right' ? 'text-right' : 'text-left'
  const bodySize =
    size === 'sm' ? 'text-sm' : size === 'lg' ? 'text-base leading-relaxed' : 'text-sm leading-relaxed'
  const titleSize = size === 'lg' ? 'text-lg' : size === 'sm' ? 'text-sm' : 'text-base'

  const text = (body ?? '').trim()

  return (
    <div
      className={`flex h-full min-h-[80px] flex-col gap-2 overflow-auto rounded-lg border border-[var(--line)] bg-[var(--surface-strong)] p-3 ${alignClass}`}
    >
      {title.trim() ? (
        <h3 className={`font-semibold text-[var(--sea-ink)] ${titleSize}`}>{title}</h3>
      ) : null}
      {text ? (
        <p className={`whitespace-pre-wrap text-[var(--sea-ink)] ${bodySize}`}>{text}</p>
      ) : (
        <p className="text-sm text-[var(--sea-ink-soft)]">Add body text in widget config.</p>
      )}
    </div>
  )
}
