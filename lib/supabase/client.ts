import { createBrowserClient } from "@supabase/ssr"

import { getPublicEnv } from "@/lib/env"
import type { Database } from "@/types/database"

let browserClient: ReturnType<typeof createBrowserClient<Database>> | null =
  null

export function createBrowserSupabaseClient() {
  if (browserClient) {
    return browserClient
  }

  const env = getPublicEnv()

  if (!env.NEXT_PUBLIC_SUPABASE_URL || !env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    throw new Error("Supabase public environment variables are not configured.")
  }

  browserClient = createBrowserClient<Database>(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  )

  return browserClient
}
