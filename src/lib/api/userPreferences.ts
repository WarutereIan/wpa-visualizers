import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { getSupabase } from '#/lib/supabaseClient'
import { throwIfSupabaseError } from '#/lib/supabaseErrors'
import { workspaceKeys } from '#/lib/api/workspace'

export type ThemeMode = 'light' | 'dark' | 'auto'

export interface UserUiState {
  selectedProjectId?: string | null
  sidebarCollapsed?: boolean
}

export interface UserPreferences {
  userId: string
  organizationId: string | null
  theme: ThemeMode
  selectedProjectId: string | null
  sidebarCollapsed: boolean
  uiState: UserUiState
}

type DbUserPreferences = {
  user_id: string
  organization_id: string | null
  theme: ThemeMode
  selected_project_id: string | null
  sidebar_collapsed: boolean
  ui_state: UserUiState | null
}

function mapDbPrefs(row: DbUserPreferences): UserPreferences {
  const uiState = row.ui_state ?? {}
  const legacyKey = uiState.selectedProjectId ?? null
  return {
    userId: row.user_id,
    organizationId: row.organization_id,
    theme: row.theme,
    selectedProjectId: row.selected_project_id ?? legacyKey,
    sidebarCollapsed: row.sidebar_collapsed,
    uiState,
  }
}

async function fetchUserPreferences(
  userId: string,
  organizationId: string | null,
): Promise<UserPreferences> {
  const supabase = getSupabase()
  if (!supabase) throw new Error('Supabase is not configured')

  const { data, error } = await supabase
    .from('user_preferences')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle()

  throwIfSupabaseError(error, 'api.fetchUserPreferences', { userId })

  if (data) return mapDbPrefs(data as DbUserPreferences)

  const { data: created, error: insertError } = await supabase
    .from('user_preferences')
    .insert({
      user_id: userId,
      organization_id: organizationId,
      theme: 'auto',
      ui_state: {},
    })
    .select('*')
    .single()

  throwIfSupabaseError(insertError, 'api.createUserPreferences', { userId })
  return mapDbPrefs(created as DbUserPreferences)
}

export function useUserPreferences(userId: string | null, organizationId: string | null) {
  return useQuery({
    queryKey: userId ? workspaceKeys.userPreferences(userId) : ['workspace', 'prefs', 'none'],
    queryFn: () => fetchUserPreferences(userId!, organizationId),
    enabled: Boolean(userId),
  })
}

export function useUpdateUserPreferences(userId: string | null) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (patch: {
      theme?: ThemeMode
      selectedProjectId?: string | null
      sidebarCollapsed?: boolean
      uiState?: UserUiState
    }) => {
      if (!userId) throw new Error('Not signed in')
      const supabase = getSupabase()
      if (!supabase) throw new Error('Supabase is not configured')

      const { data: existing } = await supabase
        .from('user_preferences')
        .select('ui_state, selected_project_id')
        .eq('user_id', userId)
        .maybeSingle()

      const prevUi = (existing?.ui_state as UserUiState | null) ?? {}
      const nextUi: UserUiState = { ...prevUi, ...patch.uiState }

      if (patch.selectedProjectId !== undefined) {
        const id = patch.selectedProjectId
        const isUuid =
          id !== null && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id)
        if (isUuid) {
          nextUi.selectedProjectId = null
        } else {
          nextUi.selectedProjectId = id
        }
      }

      const update: Record<string, unknown> = {
        updated_at: new Date().toISOString(),
        ui_state: nextUi,
      }
      if (patch.theme !== undefined) update.theme = patch.theme
      if (patch.sidebarCollapsed !== undefined) update.sidebar_collapsed = patch.sidebarCollapsed
      if (patch.selectedProjectId !== undefined) {
        const id = patch.selectedProjectId
        const isUuid =
          id !== null && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id)
        update.selected_project_id = isUuid ? id : null
      }

      const { data, error } = await supabase
        .from('user_preferences')
        .upsert({ user_id: userId, ...update }, { onConflict: 'user_id' })
        .select('*')
        .single()

      throwIfSupabaseError(error, 'api.updateUserPreferences', { userId })
      return mapDbPrefs(data as DbUserPreferences)
    },
    onSuccess: () => {
      if (userId) {
        void queryClient.invalidateQueries({ queryKey: workspaceKeys.userPreferences(userId) })
      }
    },
  })
}
