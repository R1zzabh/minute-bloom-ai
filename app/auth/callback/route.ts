import { hasConfiguredSupabase } from "@/lib/env"
import { createServerSupabaseClient } from "@/lib/supabase/server"

export async function GET(request: Request) {
  const url = new URL(request.url)
  const code = url.searchParams.get("code")
  const nextPath = url.searchParams.get("next") ?? "/app"

  if (!hasConfiguredSupabase()) {
    return Response.redirect(new URL("/sign-in", request.url))
  }

  if (code) {
    const supabase = await createServerSupabaseClient()
    await supabase.auth.exchangeCodeForSession(code)
  }

  return Response.redirect(new URL(nextPath, request.url))
}
