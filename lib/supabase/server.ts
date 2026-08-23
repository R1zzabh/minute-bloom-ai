import { clearAuthCookiesAtScopes, createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { NextRequest, NextResponse } from "next/server"

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

export type RouteHandlerSupabaseClient = ReturnType<
  typeof createServerClient<Database>
>

export function createRouteHandlerSupabaseClient(
  request: NextRequest,
  response: NextResponse
) {
  const env = getPublicEnv()

  if (!env.NEXT_PUBLIC_SUPABASE_URL || !env.supabasePublicKey) {
    throw new Error("Supabase public environment variables are not configured.")
  }

  return createServerClient<Database>(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.supabasePublicKey,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet, headers) {
          cookiesToSet.forEach(({ name, value }) => {
            request.cookies.set(name, value)
          })
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options)
          })
          Object.entries(headers).forEach(([key, value]) => {
            response.headers.set(key, value)
          })
        },
      },
    }
  )
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
