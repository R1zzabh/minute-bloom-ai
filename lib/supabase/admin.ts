import { createClient } from "@supabase/supabase-js"

import { getServerEnv } from "@/lib/env"
import type { Database } from "@/types/database"

let adminClient: ReturnType<typeof createClient<Database>> | null = null

export function createAdminSupabaseClient() {
  if (adminClient) {
    return adminClient
  }

  const env = getServerEnv()

  if (!env.NEXT_PUBLIC_SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error("Supabase admin environment variables are not configured.")
  }

  adminClient = createClient<Database>(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.SUPABASE_SERVICE_ROLE_KEY,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  )

  return adminClient
}
