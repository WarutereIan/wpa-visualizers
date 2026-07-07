import type { AuthError, PostgrestError } from '@supabase/supabase-js'

type SupabaseLikeError = Partial<AuthError & PostgrestError> & {
  message?: string
  code?: string
  status?: number
  details?: string
  hint?: string
}

const AUTH_CODE_MESSAGES: Record<string, string> = {
  user_already_exists: 'An account with this email already exists. Try signing in instead.',
  weak_password: 'Password is too weak. Use at least 8 characters with mixed characters.',
  email_address_invalid: 'That email address looks invalid.',
  invalid_credentials: 'Invalid email or password.',
  email_not_confirmed: 'Please confirm your email before signing in.',
  signup_disabled: 'Sign up is currently disabled on this project.',
  over_request_rate_limit: 'Too many attempts. Please wait a moment and try again.',
  validation_failed: 'The sign-up details were rejected. Check your email and password.',
}

export function normalizeSupabaseError(error: unknown): SupabaseLikeError {
  if (error && typeof error === 'object') {
    const e = error as SupabaseLikeError
    return {
      message: e.message,
      code: e.code,
      status: e.status,
      details: e.details,
      hint: e.hint,
    }
  }
  return { message: error == null ? undefined : String(error) }
}

/** Structured console logging for Supabase failures. Safe to call from any layer. */
export function logSupabaseError(
  context: string,
  error: unknown,
  meta?: Record<string, unknown>,
): void {
  const e = normalizeSupabaseError(error)
  const payload = {
    context,
    ...meta,
    message: e.message,
    code: e.code,
    status: e.status,
    details: e.details,
    hint: e.hint,
  }

  if (import.meta.env.DEV) {
    console.error(`[supabase:${context}]`, payload, error)
    return
  }

  console.error(`[supabase:${context}]`, payload)
}

/** Log full Supabase error details in dev; return a user-friendly message. */
export function formatSupabaseError(error: unknown, context: string): string {
  const e = normalizeSupabaseError(error)
  logSupabaseError(context, error)

  if (e.code && AUTH_CODE_MESSAGES[e.code]) {
    return AUTH_CODE_MESSAGES[e.code]
  }

  if (e.message) {
    if (e.message.includes('infinite recursion')) {
      return 'A server permissions error occurred. Please contact support if this persists.'
    }
    if (/already registered/i.test(e.message)) {
      return AUTH_CODE_MESSAGES.user_already_exists
    }
    if (e.status === 500 && !e.message) {
      return 'A server error occurred. Please try again in a moment.'
    }
    return e.message
  }

  return 'Something went wrong. Please try again.'
}

/** Throw after logging if a Supabase client returned `{ error }`. */
export function throwIfSupabaseError(
  error: PostgrestError | AuthError | null,
  context: string,
  meta?: Record<string, unknown>,
): void {
  if (error) {
    logSupabaseError(context, error, meta)
    throw error
  }
}
