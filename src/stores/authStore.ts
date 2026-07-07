import { create } from 'zustand'
import type { Session, User } from '@supabase/supabase-js'
import { getSupabase } from '#/lib/supabaseClient'
import { isSupabaseConfigured } from '#/lib/env'
import {
  formatSupabaseError,
  logSupabaseError,
  throwIfSupabaseError,
} from '#/lib/supabaseErrors'
import type { OrganizationRole, OrganizationSummary, UserProfile } from '#/types/auth'

interface AuthState {
  session: Session | null
  user: User | null
  profile: UserProfile | null
  organization: OrganizationSummary | null
  role: OrganizationRole | null
  loading: boolean
  initialized: boolean
  error: string | null

  initialize: () => Promise<void>
  refreshMembership: () => Promise<void>
  signIn: (email: string, password: string) => Promise<void>
  signUp: (email: string, password: string, workspaceName?: string) => Promise<void>
  signOut: () => Promise<void>
  clearError: () => void
}

function mapProfile(row: {
  id: string
  display_name: string | null
  avatar_url: string | null
  default_organization_id: string | null
}): UserProfile {
  return {
    id: row.id,
    displayName: row.display_name,
    avatarUrl: row.avatar_url,
    defaultOrganizationId: row.default_organization_id,
  }
}

async function ensureDefaultOrganization(workspaceName?: string): Promise<string | null> {
  const supabase = getSupabase()
  if (!supabase) return null

  const { data, error } = await supabase.rpc('create_default_organization', {
    org_name: workspaceName?.trim() || 'My workspace',
    org_slug: null,
  })

  if (error) {
    // Concurrent signup paths can race; recover if the profile already has an org.
    if (error.code === '23505') {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('default_organization_id')
          .eq('id', user.id)
          .maybeSingle()
        if (profile?.default_organization_id) {
          return profile.default_organization_id
        }
      }
    }
    throwIfSupabaseError(error, 'auth.ensureDefaultOrganization', {
      workspaceName: workspaceName?.trim() || 'My workspace',
    })
  }

  return data as string | null
}

async function loadProfileAndOrg(userId: string): Promise<{
  profile: UserProfile | null
  organization: OrganizationSummary | null
  role: OrganizationRole | null
}> {
  const supabase = getSupabase()
  if (!supabase) return { profile: null, organization: null, role: null }

  const { data: profileRow, error: profileError } = await supabase
    .from('profiles')
    .select('id, display_name, avatar_url, default_organization_id')
    .eq('id', userId)
    .maybeSingle()

  throwIfSupabaseError(profileError, 'auth.loadProfile', { userId })
  if (!profileRow) {
    logSupabaseError('auth.loadProfile', new Error('Profile row missing after signup'), { userId })
    return { profile: null, organization: null, role: null }
  }

  const profile = mapProfile(profileRow)
  if (!profile.defaultOrganizationId) {
    return { profile, organization: null, role: null }
  }

  const orgId = profile.defaultOrganizationId

  const [{ data: orgRow, error: orgError }, { data: roleData, error: roleError }] =
    await Promise.all([
      supabase.from('organizations').select('id, name, slug, plan').eq('id', orgId).maybeSingle(),
      // Use RPC (security definer) instead of direct organization_members SELECT
      // to avoid RLS edge cases while policies are being tightened.
      supabase.rpc('current_org_role', { org_id: orgId }),
    ])

  throwIfSupabaseError(orgError, 'auth.loadOrganization', { userId, orgId })
  throwIfSupabaseError(roleError, 'auth.loadRole', { userId, orgId })

  return {
    profile,
    organization: orgRow
      ? { id: orgRow.id, name: orgRow.name, slug: orgRow.slug, plan: orgRow.plan }
      : null,
    role: (roleData as OrganizationRole | null) ?? null,
  }
}

function setAuthError(error: unknown, context: string): string {
  return formatSupabaseError(error, context)
}

export const useAuthStore = create<AuthState>((set, get) => ({
  session: null,
  user: null,
  profile: null,
  organization: null,
  role: null,
  loading: false,
  initialized: false,
  error: null,

  clearError: () => set({ error: null }),

  initialize: async () => {
    if (get().initialized) return

    if (!isSupabaseConfigured()) {
      set({ initialized: true, loading: false })
      return
    }

    const supabase = getSupabase()
    if (!supabase) {
      set({ initialized: true, loading: false })
      return
    }

    set({ loading: true })

    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (session?.user) {
      try {
        await ensureDefaultOrganization()
        const { profile, organization, role } = await loadProfileAndOrg(session.user.id)
        set({
          session,
          user: session.user,
          profile,
          organization,
          role,
          loading: false,
          initialized: true,
          error: null,
        })
      } catch (e) {
        set({
          session,
          user: session.user,
          loading: false,
          initialized: true,
          error: setAuthError(e, 'auth.initialize'),
        })
      }
    } else {
      set({
        session: null,
        user: null,
        profile: null,
        organization: null,
        role: null,
        loading: false,
        initialized: true,
        error: null,
      })
    }

    supabase.auth.onAuthStateChange(async (_event, nextSession) => {
      if (nextSession?.user) {
        try {
          await ensureDefaultOrganization()
          const { profile, organization, role } = await loadProfileAndOrg(nextSession.user.id)
          set({
            session: nextSession,
            user: nextSession.user,
            profile,
            organization,
            role,
            loading: false,
            error: null,
          })
        } catch (e) {
          set({
            loading: false,
            error: setAuthError(e, 'auth.onAuthStateChange'),
          })
        }
      } else {
        set({
          session: null,
          user: null,
          profile: null,
          organization: null,
          role: null,
          error: null,
        })
      }
    })
  },

  refreshMembership: async () => {
    const user = get().user
    if (!user) return
    try {
      const { profile, organization, role } = await loadProfileAndOrg(user.id)
      set({ profile, organization, role, error: null })
    } catch (e) {
      set({ error: setAuthError(e, 'auth.refreshMembership') })
    }
  },

  signIn: async (email, password) => {
    const supabase = getSupabase()
    if (!supabase) throw new Error('Supabase is not configured')

    set({ loading: true, error: null })
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password })
      throwIfSupabaseError(error, 'auth.signIn', { email })
      if (!data.session?.user) {
        const err = new Error('Sign in failed: no session returned')
        logSupabaseError('auth.signIn', err, { email })
        throw err
      }

      await ensureDefaultOrganization()
      const { profile, organization, role } = await loadProfileAndOrg(data.session.user.id)
      set({
        session: data.session,
        user: data.session.user,
        profile,
        organization,
        role,
        loading: false,
        error: null,
      })
    } catch (e) {
      const message = setAuthError(e, 'auth.signIn')
      set({ loading: false, error: message })
      throw e
    }
  },

  signUp: async (email, password, workspaceName) => {
    const supabase = getSupabase()
    if (!supabase) throw new Error('Supabase is not configured')

    set({ loading: true, error: null })
    try {
      const { data, error } = await supabase.auth.signUp({ email, password })
      throwIfSupabaseError(error, 'auth.signUp', { email })
      if (!data.session?.user) {
        const err = Object.assign(
          new Error('Account created. Check your email to confirm, then sign in.'),
          { code: 'email_not_confirmed' },
        )
        logSupabaseError('auth.signUp', err, {
          email,
          userId: data.user?.id,
          identities: data.user?.identities?.length,
        })
        throw err
      }

      await ensureDefaultOrganization(workspaceName)
      const { profile, organization, role } = await loadProfileAndOrg(data.session.user.id)
      set({
        session: data.session,
        user: data.session.user,
        profile,
        organization,
        role,
        loading: false,
        error: null,
      })
    } catch (e) {
      const message = setAuthError(e, 'auth.signUp')
      set({ loading: false, error: message })
      throw e
    }
  },

  signOut: async () => {
    const supabase = getSupabase()
    if (supabase) {
      const { error } = await supabase.auth.signOut()
      if (error) logSupabaseError('auth.signOut', error)
    }
    set({
      session: null,
      user: null,
      profile: null,
      organization: null,
      role: null,
      error: null,
    })
  },
}))
