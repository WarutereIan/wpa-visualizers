import { useState } from 'react'
import { Eye, EyeOff } from 'lucide-react'

interface PasswordInputProps {
  id: string
  label: string
  value: string
  onChange: (value: string) => void
  autoComplete?: 'current-password' | 'new-password'
  required?: boolean
  minLength?: number
  hint?: string
}

export function PasswordInput({
  id,
  label,
  value,
  onChange,
  autoComplete = 'current-password',
  required = true,
  minLength,
  hint,
}: PasswordInputProps) {
  const [visible, setVisible] = useState(false)

  return (
    <label htmlFor={id} className="flex flex-col gap-1.5 text-sm">
      <span className="font-medium text-[var(--sea-ink)]">{label}</span>
      <div className="relative">
        <input
          id={id}
          type={visible ? 'text' : 'password'}
          autoComplete={autoComplete}
          required={required}
          minLength={minLength}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="h-9 w-full border border-[var(--line)] bg-[var(--surface-strong)] py-0 pr-10 pl-3 text-sm outline-none focus:border-[var(--lagoon)]"
        />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          className="absolute top-1/2 right-2 -translate-y-1/2 rounded p-1 text-[var(--sea-ink-soft)] transition hover:text-[var(--sea-ink)]"
          aria-label={visible ? 'Hide password' : 'Show password'}
        >
          {visible ? <EyeOff size={16} /> : <Eye size={16} />}
        </button>
      </div>
      {hint && <span className="text-xs text-[var(--sea-ink-soft)]">{hint}</span>}
    </label>
  )
}
