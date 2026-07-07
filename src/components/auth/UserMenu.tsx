import { LogOut, User } from 'lucide-react'
import { useNavigate } from '@tanstack/react-router'
import { Button } from '#/components/ui/button'
import { useAuthStore } from '#/stores/authStore'
import { isSupabaseConfigured } from '#/lib/env'

export function UserMenu() {
  const navigate = useNavigate()
  const user = useAuthStore((s) => s.user)
  const profile = useAuthStore((s) => s.profile)
  const organization = useAuthStore((s) => s.organization)
  const role = useAuthStore((s) => s.role)
  const signOut = useAuthStore((s) => s.signOut)

  if (!isSupabaseConfigured() || !user) return null

  const label =
    profile?.displayName?.trim() ||
    user.email?.split('@')[0] ||
    'Account'

  return (
    <div className="flex items-center gap-2">
      <div className="hidden max-w-[12rem] truncate text-right text-xs sm:block">
        <div className="font-medium text-[var(--sea-ink)]">{label}</div>
        {organization && (
          <div className="text-[var(--sea-ink-soft)]">
            {organization.name}
            {role ? ` · ${role}` : ''}
          </div>
        )}
      </div>
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="gap-1.5"
        onClick={() => void signOut().then(() => navigate({ to: '/login' }))}
      >
        <User size={14} className="sm:hidden" />
        <LogOut size={14} className="hidden sm:block" />
        <span className="hidden sm:inline">Sign out</span>
      </Button>
    </div>
  )
}
