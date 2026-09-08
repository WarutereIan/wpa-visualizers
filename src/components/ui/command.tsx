import * as React from 'react'
import { MagnifyingGlass } from '@phosphor-icons/react'
import { cn } from '#/lib/utils'

function Command({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="command"
      className={cn(
        'flex flex-col overflow-hidden rounded-md border border-[var(--line)] bg-[var(--surface)] text-[var(--sea-ink)]',
        className,
      )}
      {...props}
    />
  )
}

function CommandInput({
  className,
  onValueChange,
  onChange,
  ...props
}: React.ComponentProps<'input'> & { onValueChange?: (value: string) => void }) {
  return (
    <div className="flex items-center gap-2 border-b border-[var(--line)] px-3" data-slot="command-input-wrap">
      <MagnifyingGlass className="size-4 shrink-0 opacity-50" />
      <input
        data-slot="command-input"
        className={cn(
          'flex h-9 w-full bg-transparent text-sm outline-none placeholder:text-[var(--sea-ink-soft)] disabled:cursor-not-allowed disabled:opacity-50',
          className,
        )}
        onChange={(event) => {
          onChange?.(event)
          onValueChange?.(event.target.value)
        }}
        {...props}
      />
    </div>
  )
}

function CommandList({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="command-list"
      className={cn('max-h-56 overflow-y-auto p-1', className)}
      {...props}
    />
  )
}

function CommandEmpty({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="command-empty"
      className={cn('py-6 text-center text-sm text-[var(--sea-ink-soft)]', className)}
      {...props}
    />
  )
}

function CommandItem({
  className,
  selected,
  onSelect,
  onClick,
  ...props
}: React.ComponentProps<'button'> & { selected?: boolean; onSelect?: () => void }) {
  return (
    <button
      type="button"
      data-slot="command-item"
      data-selected={selected ? '' : undefined}
      className={cn(
        'flex w-full cursor-default items-center rounded-sm px-2 py-1.5 text-left text-sm outline-none select-none hover:bg-[var(--surface-strong)] data-[selected]:bg-[var(--surface-strong)]',
        className,
      )}
      onClick={(event) => {
        onClick?.(event)
        onSelect?.()
      }}
      {...props}
    />
  )
}

export { Command, CommandEmpty, CommandInput, CommandItem, CommandList }
