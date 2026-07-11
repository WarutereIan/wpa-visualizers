import { useEffect, useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { Settings as SettingsIcon, User as UserIcon } from 'lucide-react'
import { useAuthStore } from '#/stores/authStore'
import { useUserPreferences, type ThemeMode } from '#/lib/api/userPreferences'
import { usePersistedTheme } from '#/hooks/usePersistedTheme'
import { usePersistedSidebarCollapsed } from '#/hooks/usePersistedSidebarCollapsed'
import { Button } from '#/components/ui/button'
import { formatSupabaseError } from '#/lib/supabaseErrors'

export const Route = createFileRoute('/settings')({
  component: SettingsPage,
})

const THEME_OPTIONS: { value: ThemeMode; label: string; hint: string }[] = [
  { value: 'light', label: 'Light', hint: 'Always light.' },
  { value: 'dark', label: 'Dark', hint: 'Always dark.' },
  { value: 'auto', label: 'Auto', hint: 'Follow system preference.' },
]

function fieldClass() {
  return 'mt-1 flex h-9 w-full rounded-md border border-[var(--line)] bg-[var(--surface)] px-3 text-sm'
}

function SettingsPage() {
  const user = useAuthStore((s) => s.user)
  const profile = useAuthStore((s) => s.profile)
  const organization = useAuthStore((s) => s.organization)
  const role = useAuthStore((s) => s.role)
  const updateProfile = useAuthStore((s) => s.updateProfile)
  const workspaceReady = useAuthStore((s) => s.initialized) && Boolean(user && organization?.id)

  const { data: prefs } = useUserPreferences(user?.id ?? null, organization?.id ?? null)
  const { mode: themeMode, setMode: setThemeMode } = usePersistedTheme()
  const { collapsed: sidebarCollapsed, setCollapsed: setSidebarCollapsed } =
    usePersistedSidebarCollapsed()

  const [displayName, setDisplayName] = useState(profile?.displayName ?? '')
  const [avatarUrl, setAvatarUrl] = useState(profile?.avatarUrl ?? '')
  const [savingProfile, setSavingProfile] = useState(false)
  const [profileMsg, setProfileMsg] = useState<{ kind: 'ok' | 'err'; text: string } | null>(null)

  // Re-seed local form state when the store profile loads/changes.
  useEffect(() => {
    setDisplayName(profile?.displayName ?? '')
    setAvatarUrl(profile?.avatarUrl ?? '')
  }, [profile?.id, profile?.displayName, profile?.avatarUrl])

  if (!user) {
    return (
      <div className="rounded-xl border border-[var(--line)] bg-[var(--surface-strong)] p-6 text-sm text-[var(--sea-ink-soft)]">
        Sign in to manage your settings.
      </div>
    )
  }

  async function saveProfile(e: React.FormEvent) {
    e.preventDefault()
    setSavingProfile(true)
    setProfileMsg(null)
    try {
      await updateProfile({
        displayName: displayName.trim() || null,
        avatarUrl: avatarUrl.trim() || null,
      })
      setProfileMsg({ kind: 'ok', text: 'Profile saved.' })
    } catch (err) {
      setProfileMsg({ kind: 'err', text: formatSupabaseError(err, 'settings.saveProfile') })
    } finally {
      setSavingProfile(false)
    }
  }

  return (
    <div className="space-y-6">
      <header className="flex items-center gap-2">
        <SettingsIcon size={22} className="text-[var(--lagoon-deep)]" />
        <div>
          <h1 className="text-2xl font-bold text-[var(--sea-ink)]">Settings</h1>
          <p className="text-sm text-[var(--sea-ink-soft)]">
            Manage your profile and workspace preferences.
          </p>
        </div>
      </header>

      {/* Profile */}
      <section className="rounded-xl border border-[var(--line)] bg-[var(--surface-strong)] p-5 shadow-sm">
        <h2 className="flex items-center gap-2 text-sm font-semibold text-[var(--sea-ink)]">
          <UserIcon size={16} /> Profile
        </h2>
        <p className="mt-1 text-xs text-[var(--sea-ink-soft)]">
          Your name and avatar are shown in the account menu and across the workspace.
        </p>

        <form className="mt-4 grid gap-3 sm:grid-cols-2" onSubmit={saveProfile}>
          <label className="text-sm">
            Display name
            <input
              className={fieldClass()}
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Jane Doe"
            />
          </label>
          <label className="text-sm">
            Avatar URL <span className="text-[var(--sea-ink-soft)]">(optional)</span>
            <input
              className={fieldClass()}
              value={avatarUrl}
              onChange={(e) => setAvatarUrl(e.target.value)}
              placeholder="https://…/avatar.png"
            />
          </label>
          <label className="text-sm sm:col-span-2">
            Email
            <input
              className={fieldClass()}
              value={user.email ?? ''}
              disabled
              readOnly
            />
          </label>
          <div className="flex items-center gap-3 sm:col-span-2">
            <Button type="submit" size="sm" disabled={savingProfile}>
              {savingProfile ? 'Saving…' : 'Save profile'}
            </Button>
            {profileMsg && (
              <p
                className={`text-sm ${
                  profileMsg.kind === 'ok'
                    ? 'text-emerald-700 dark:text-emerald-300'
                    : 'text-red-600 dark:text-red-400'
                }`}
              >
                {profileMsg.text}
              </p>
            )}
          </div>
        </form>
      </section>

      {/* Workspace */}
      <section className="rounded-xl border border-[var(--line)] bg-[var(--surface-strong)] p-5 shadow-sm">
        <h2 className="text-sm font-semibold text-[var(--sea-ink)]">Workspace</h2>
        <dl className="mt-3 grid gap-3 text-sm sm:grid-cols-3">
          <div>
            <dt className="text-xs text-[var(--sea-ink-soft)]">Organization</dt>
            <dd className="font-medium text-[var(--sea-ink)]">
              {organization?.name ?? '—'}
            </dd>
          </div>
          <div>
            <dt className="text-xs text-[var(--sea-ink-soft)]">Role</dt>
            <dd className="font-medium text-[var(--sea-ink)]">{role ?? '—'}</dd>
          </div>
          <div>
            <dt className="text-xs text-[var(--sea-ink-soft)]">Plan</dt>
            <dd className="font-medium text-[var(--sea-ink)]">
              {organization?.plan ?? '—'}
            </dd>
          </div>
        </dl>
        {!workspaceReady && (
          <p className="mt-3 rounded-md border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-900 dark:text-amber-200">
            Your workspace isn&apos;t fully provisioned. Some preference changes may not persist until
            it&apos;s ready.
          </p>
        )}
      </section>

      {/* Appearance */}
      <section className="rounded-xl border border-[var(--line)] bg-[var(--surface-strong)] p-5 shadow-sm">
        <h2 className="text-sm font-semibold text-[var(--sea-ink)]">Appearance</h2>
        <p className="mt-1 text-xs text-[var(--sea-ink-soft)]">
          Theme and sidebar preferences are saved to your account and sync across devices when signed
          in.
        </p>

        <div className="mt-4 space-y-4">
          <div>
            <span className="text-sm font-medium text-[var(--sea-ink)]">Theme</span>
            <div className="mt-2 grid gap-2 sm:grid-cols-3">
              {THEME_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setThemeMode(opt.value)}
                  className={`rounded-lg border px-3 py-2 text-left text-sm transition ${
                    themeMode === opt.value
                      ? 'border-[var(--lagoon-deep)] bg-[rgba(79,184,178,0.15)] text-[var(--lagoon-deep)]'
                      : 'border-[var(--line)] bg-[var(--surface)] text-[var(--sea-ink)] hover:bg-[var(--bg-base)]'
                  }`}
                >
                  <div className="font-medium">{opt.label}</div>
                  <div className="text-xs text-[var(--sea-ink-soft)]">{opt.hint}</div>
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between gap-3 rounded-lg border border-[var(--line)] bg-[var(--surface)] px-3 py-2">
            <div>
              <div className="text-sm font-medium text-[var(--sea-ink)]">Collapse sidebar by default</div>
              <div className="text-xs text-[var(--sea-ink-soft)]">
                Remember the sidebar state across sessions.
              </div>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={sidebarCollapsed}
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${
                sidebarCollapsed ? 'bg-[var(--lagoon-deep)]' : 'bg-[var(--line)]'
              }`}
            >
              <span
                className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
                  sidebarCollapsed ? 'translate-x-5' : 'translate-x-0.5'
                }`}
              />
            </button>
          </div>

          {prefs && (
            <p className="text-xs text-[var(--sea-ink-soft)]">
              Preferences last synced from server. Stored on{' '}
              <code className="font-mono">user_preferences</code>.
            </p>
          )}
        </div>
      </section>
    </div>
  )
}
