import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { useState } from 'react'
import { DimesBiLogo } from '#/components/brand/DimesBiLogo'
import ThemeToggle from '#/components/ThemeToggle'
import { PasswordInput } from '#/components/auth/PasswordInput'
import { Button } from '#/components/ui/button'
import { isSupabaseConfigured } from '#/lib/env'
import { formatSupabaseError } from '#/lib/supabaseErrors'
import { useAuthStore } from '#/stores/authStore'

export const Route = createFileRoute('/signup')({
  component: SignupPage,
})

function SignupPage() {
  const navigate = useNavigate()
  const signUp = useAuthStore((s) => s.signUp)
  const loading = useAuthStore((s) => s.loading)
  const storeError = useAuthStore((s) => s.error)
  const clearError = useAuthStore((s) => s.clearError)

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [workspaceName, setWorkspaceName] = useState('My workspace')
  const [localError, setLocalError] = useState<string | null>(null)

  if (!isSupabaseConfigured()) {
    return (
      <AuthShell title="Sign up unavailable">
        <p className="text-sm text-[var(--sea-ink-soft)]">
          Configure Supabase env vars to enable accounts. The app still works in demo mode without
          sign-in.
        </p>
        <Link to="/" className="mt-4 inline-block text-sm text-[var(--lagoon-deep)] underline">
          Back to home
        </Link>
      </AuthShell>
    )
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLocalError(null)
    clearError()

    if (password !== confirmPassword) {
      setLocalError('Passwords do not match.')
      return
    }

    try {
      await signUp(email.trim(), password, workspaceName.trim(), displayName.trim() || undefined)
      void navigate({ to: '/data-management' })
    } catch (err) {
      setLocalError(formatSupabaseError(err, 'signup.onSubmit'))
    }
  }

  const error = localError || storeError

  return (
    <AuthShell title="Create your workspace">
      <form onSubmit={(e) => void onSubmit(e)} className="flex flex-col gap-4">
        {error && (
          <div className="border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {error}
          </div>
        )}
        <label className="flex flex-col gap-1.5 text-sm">
          <span className="font-medium text-[var(--sea-ink)]">Your name <span className="font-normal text-[var(--sea-ink-soft)]">(optional)</span></span>
          <input
            type="text"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            className="h-9 border border-[var(--line)] bg-[var(--surface-strong)] px-3 text-sm outline-none focus:border-[var(--lagoon)]"
            placeholder="Jane Doe"
          />
        </label>
        <label className="flex flex-col gap-1.5 text-sm">
          <span className="font-medium text-[var(--sea-ink)]">Workspace name</span>
          <input
            type="text"
            required
            value={workspaceName}
            onChange={(e) => setWorkspaceName(e.target.value)}
            className="h-9 border border-[var(--line)] bg-[var(--surface-strong)] px-3 text-sm outline-none focus:border-[var(--lagoon)]"
          />
        </label>
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
          id="signup-password"
          label="Password"
          value={password}
          onChange={setPassword}
          autoComplete="new-password"
          minLength={8}
          hint="At least 8 characters"
        />
        <PasswordInput
          id="signup-confirm-password"
          label="Confirm password"
          value={confirmPassword}
          onChange={setConfirmPassword}
          autoComplete="new-password"
          minLength={8}
        />
        <Button type="submit" disabled={loading} className="w-full">
          {loading ? 'Creating account…' : 'Create account'}
        </Button>
      </form>
      <p className="mt-6 text-center text-sm text-[var(--sea-ink-soft)]">
        Already have an account?{' '}
        <Link to="/login" className="font-medium text-[var(--lagoon-deep)] hover:underline">
          Sign in
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
