import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"

import { hasConfiguredSupabase, getPublicEnv } from "@/lib/env"
import type { Database } from "@/types/database"

const publicPaths = ["/", "/sign-in", "/demo", "/api/health"]

function isPublicPath(pathname: string) {
  if (publicPaths.includes(pathname)) {
    return true
  }

  return pathname.startsWith("/auth/")
}

export async function updateSession(request: NextRequest) {
  if (!hasConfiguredSupabase()) {
    return NextResponse.next({ request })
  }

  const env = getPublicEnv()
  let response = NextResponse.next({ request })

  const supabase = createServerClient<Database>(
    env.NEXT_PUBLIC_SUPABASE_URL!,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
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
    return NextResponse.redirect(new URL("/app", request.url))
  }

  if (!user && pathname.startsWith("/app") && !isPublicPath(pathname)) {
    return NextResponse.redirect(new URL("/sign-in", request.url))
  }

  return response
}
