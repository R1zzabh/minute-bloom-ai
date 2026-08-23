import { getRuntimeConfiguration } from "@/lib/env"
import { getSafePostAuthPath } from "@/lib/auth/redirect"
import { createServerSupabaseClient } from "@/lib/supabase/server"

export async function GET(request: Request) {
  const url = new URL(request.url)
  const code = url.searchParams.get("code")
  const nextPath = getSafePostAuthPath(
    url.searchParams.get("next"),
    request.url
  )
  const runtime = getRuntimeConfiguration()

  if (!runtime.supabaseClientConfigured) {
    return Response.redirect(new URL("/sign-in", request.url))
  }

  if (code) {
    const supabase = await createServerSupabaseClient()
    await supabase.auth.exchangeCodeForSession(code)
  }

  return Response.redirect(new URL(nextPath, request.url))
}
