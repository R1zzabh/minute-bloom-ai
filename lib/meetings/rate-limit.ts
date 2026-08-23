import { hasConfiguredSupabaseAdmin } from "@/lib/env"
import { createAdminSupabaseClient } from "@/lib/supabase/admin"

export async function takeRateLimitToken(
  key: string,
  maxRequests: number,
  windowMs: number
) {
  if (!hasConfiguredSupabaseAdmin()) {
    return false
  }

  const admin = createAdminSupabaseClient()
  const { data, error } = await admin.rpc("consume_rate_limit_token", {
    p_scope: key,
    p_max_requests: maxRequests,
    p_window_seconds: Math.ceil(windowMs / 1000),
  })

  if (error) {
    throw new Error("Unable to check the shared rate limit.")
  }

  return Boolean(data)
}

export async function pruneExpiredRateLimits() {
  if (!hasConfiguredSupabaseAdmin()) {
    return
  }

  const admin = createAdminSupabaseClient()
  const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()

  await admin.from("shared_rate_limits").delete().lt("window_ends_at", cutoff)
}
