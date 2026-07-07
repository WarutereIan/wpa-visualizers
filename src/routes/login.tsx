import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { useState } from 'react'
import { DimesBiLogo } from '#/components/brand/DimesBiLogo'
import ThemeToggle from '#/components/ThemeToggle'
import { PasswordInput } from '#/components/auth/PasswordInput'
import { Button } from '#/components/ui/button'
import { isSupabaseConfigured } from '#/lib/env'
import { formatSupabaseError } from '#/lib/supabaseErrors'
import { useAuthStore } from '#/stores/authStore'

type LoginSearch = {
  redirect?: string
}

export const Route = createFileRoute('/login')({
  validateSearch: (search: Record<string, unknown>): LoginSearch => ({
    redirect: typeof search.redirect === 'string' ? search.redirect : undefined,
  }),
  component: LoginPage,
})

function LoginPage() {
  const navigate = useNavigate()
  const { redirect } = Route.useSearch()
  const signIn = useAuthStore((s) => s.signIn)
  const loading = useAuthStore((s) => s.loading)
  const storeError = useAuthStore((s) => s.error)
  const clearError = useAuthStore((s) => s.clearError)

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [localError, setLocalError] = useState<string | null>(null)

  if (!isSupabaseConfigured()) {
    return (
      <AuthShell title="Sign in unavailable">
        <p className="text-sm text-[var(--sea-ink-soft)]">
          Supabase is not configured. Add <code className="text-xs">VITE_SUPABASE_URL</code> and{' '}
          <code className="text-xs">VITE_SUPABASE_ANON_KEY</code> to your environment, or continue in
          demo mode from the{' '}
          <Link to="/" className="text-[var(--lagoon-deep)] underline">
            home page
          </Link>
          .
        </p>
      </AuthShell>
    )
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLocalError(null)
    clearError()
    try {
      await signIn(email.trim(), password)
      const target =
        redirect && redirect !== '/login' && redirect !== '/signup' && redirect.startsWith('/')
          ? redirect
          : '/data-management'
      void navigate({ href: target })
    } catch (err) {
      setLocalError(formatSupabaseError(err, 'login.onSubmit'))
    }
  }

  const error = localError || storeError

  return (
    <AuthShell title="Sign in to DIMES-BI">
      <form onSubmit={(e) => void onSubmit(e)} className="flex flex-col gap-4">
        {error && (
          <div className="border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {error}
          </div>
        )}
        <label className="flex flex-col gap-1.5 text-sm">
          <span className="font-medium text-[var(--sea-ink)]">Email</span>
          <input
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="h-9 border border-[var(--line)] bg-[var(--surface-strong)] px-3 text-sm outline-none focus:border-[var(--lagoon)]"
          />
        </label>
        <PasswordInput
          id="login-password"
          label="Password"
          value={password}
          onChange={setPassword}
          autoComplete="current-password"
        />
        <Button type="submit" disabled={loading} className="w-full">
          {loading ? 'Signing in…' : 'Sign in'}
        </Button>
      </form>
      <p className="mt-6 text-center text-sm text-[var(--sea-ink-soft)]">
        No account?{' '}
        <Link to="/signup" className="font-medium text-[var(--lagoon-deep)] hover:underline">
          Create one
        </Link>
      </p>
    </AuthShell>
  )
}

function AuthShell({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-[var(--bg-base)]">
      <header className="flex h-14 items-center justify-between border-b border-[var(--line)] px-4">
        <DimesBiLogo size="sm" variant="lockup" />
        <ThemeToggle />
      </header>
      <main className="flex flex-1 items-center justify-center p-6">
        <div className="w-full max-w-md border border-[var(--line)] bg-[var(--surface-strong)] p-8 shadow-sm">
          <h1 className="mb-6 text-xl font-semibold text-[var(--sea-ink)]">{title}</h1>
          {children}
        </div>
      </main>
    </div>
  )
}
