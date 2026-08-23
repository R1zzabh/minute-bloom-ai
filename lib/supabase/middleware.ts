import { clearAuthCookiesAtScopes, createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"

import { getPublicEnv, getRuntimeConfiguration } from "@/lib/env"
import type { Database } from "@/types/database"
import {
  getSupabaseAuthStorageKey,
  isSupabaseAuthCookieName,
} from "@/lib/supabase/utils"

const publicPaths = ["/", "/sign-in", "/demo", "/api/health"]

function isPublicPath(pathname: string) {
  if (publicPaths.includes(pathname)) {
    return true
  }

  return pathname.startsWith("/auth/")
}

function isWorkspacePath(pathname: string) {
  return pathname === "/app" || pathname.startsWith("/app/")
}

function applyResponseCookies(source: NextResponse, destination: NextResponse) {
  source.cookies.getAll().forEach(({ name, value, ...options }) => {
    destination.cookies.set(name, value, options)
  })

  return destination
}

export async function updateSession(request: NextRequest) {
  const runtime = getRuntimeConfiguration()

  if (!runtime.supabaseClientConfigured) {
    return NextResponse.next({ request })
  }

  const env = getPublicEnv()
  const storageKey = getSupabaseAuthStorageKey(env.NEXT_PUBLIC_SUPABASE_URL!)
  let response = NextResponse.next({ request })

  const supabase = createServerClient<Database>(
    env.NEXT_PUBLIC_SUPABASE_URL!,
    env.supabasePublicKey!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet, headers) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          response = NextResponse.next({ request })
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

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const pathname = request.nextUrl.pathname

  if (user && pathname === "/sign-in") {
    return applyResponseCookies(
      response,
      NextResponse.redirect(new URL("/app", request.url))
    )
  }

  if (!user && isWorkspacePath(pathname) && !isPublicPath(pathname)) {
    const hasSupabaseAuthCookies = request.cookies
      .getAll()
      .some(({ name }) => isSupabaseAuthCookieName(name, storageKey))

    if (hasSupabaseAuthCookies) {
      await clearAuthCookiesAtScopes({
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => {
            request.cookies.set(name, value)
          })
          response = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options)
          })
        },
        storageKey,
        scopes: [{}],
      })
    }

    return applyResponseCookies(
      response,
      NextResponse.redirect(new URL("/sign-in", request.url))
    )
  }

  return response
}
