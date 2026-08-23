import { NextRequest, NextResponse } from "next/server"

import { getSafePostAuthPath } from "@/lib/auth/redirect"
import { getRuntimeConfiguration } from "@/lib/env"
import {
  createRouteHandlerSupabaseClient,
  type RouteHandlerSupabaseClient,
} from "@/lib/supabase/server"
import { sanitizeErrorMessage } from "@/lib/supabase/utils"

function getSupabaseErrorCode(error: unknown) {
  if (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    typeof error.code === "string"
  ) {
    return error.code
  }

  return "unknown"
}

function getCallbackFailureRedirect(origin: string, code: string) {
  return NextResponse.redirect(
    new URL(`/sign-in?error=${encodeURIComponent(code)}`, origin)
  )
}

export async function GET(request: NextRequest) {
  const url = new URL(request.url)
  const code = url.searchParams.get("code")
  const nextPath = getSafePostAuthPath(
    url.searchParams.get("next"),
    request.url
  )
  const runtime = getRuntimeConfiguration()

  if (!runtime.supabaseClientConfigured) {
    return getCallbackFailureRedirect(url.origin, "auth_unavailable")
  }

  if (!code) {
    return getCallbackFailureRedirect(url.origin, "missing_code")
  }

  const successResponse = NextResponse.redirect(new URL(nextPath, url.origin))
  let supabase: RouteHandlerSupabaseClient

  try {
    supabase = createRouteHandlerSupabaseClient(request, successResponse)
  } catch (error) {
    console.error("Supabase auth callback client setup failed", {
      code: getSupabaseErrorCode(error),
      host: url.hostname,
      message: sanitizeErrorMessage(error),
    })
    return getCallbackFailureRedirect(url.origin, "callback_client_error")
  }

  const { error } = await supabase.auth.exchangeCodeForSession(code)

  if (error) {
    console.error("Supabase auth callback exchange failed", {
      code: getSupabaseErrorCode(error),
      host: url.hostname,
      message: sanitizeErrorMessage(error),
    })
    return getCallbackFailureRedirect(url.origin, "exchange_failed")
  }

  return successResponse
}
