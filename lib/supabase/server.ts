import { clearAuthCookiesAtScopes, createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"

import { getPublicEnv } from "@/lib/env"
import type { Database } from "@/types/database"
import { getSupabaseAuthStorageKey } from "@/lib/supabase/utils"

type CookieStore = Awaited<ReturnType<typeof cookies>>

function createSupabaseCookieAdapter(cookieStore: CookieStore) {
  return {
    getAll() {
      return cookieStore.getAll()
    },
    setAll(
      cookiesToSet: {
        name: string
        value: string
        options?: Parameters<CookieStore["set"]>[2]
      }[]
    ) {
      cookiesToSet.forEach(({ name, value, options }) => {
        cookieStore.set(name, value, options)
      })
    },
  }
}

export async function createServerSupabaseClient() {
  const env = getPublicEnv()

  if (!env.NEXT_PUBLIC_SUPABASE_URL || !env.supabasePublicKey) {
    throw new Error("Supabase public environment variables are not configured.")
  }

  const cookieStore = await cookies()
  const cookieAdapter = createSupabaseCookieAdapter(cookieStore)

  return createServerClient<Database>(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.supabasePublicKey,
    {
      cookies: cookieAdapter,
    }
  )
}

export async function clearServerSupabaseAuthCookies() {
  const env = getPublicEnv()

  if (!env.NEXT_PUBLIC_SUPABASE_URL) {
    return
  }

  const cookieStore = await cookies()
  const cookieAdapter = createSupabaseCookieAdapter(cookieStore)

  await clearAuthCookiesAtScopes({
    ...cookieAdapter,
    storageKey: getSupabaseAuthStorageKey(env.NEXT_PUBLIC_SUPABASE_URL),
    scopes: [{}],
  })
}

export async function getAuthenticatedUser() {
  const supabase = await createServerSupabaseClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  return user
}
