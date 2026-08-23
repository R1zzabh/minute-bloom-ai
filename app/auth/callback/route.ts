import { NextRequest, NextResponse } from "next/server"

import { getSafePostAuthPath } from "@/lib/auth/redirect"
import { getRuntimeConfiguration } from "@/lib/env"
import {
  getCanonicalAppOrigin,
  getCanonicalAppUrl,
  isLocalAliasHostname,
} from "@/lib/http/app-url"
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

function getCallbackFailureRedirect(code: string) {
  return NextResponse.redirect(
    new URL(`/sign-in?error=${encodeURIComponent(code)}`, getCanonicalAppOrigin())
  )
}

function getRequestHostname(request: NextRequest, url: URL) {
  const forwardedHost = request.headers.get("x-forwarded-host")
  const host = forwardedHost ?? request.headers.get("host")

  if (!host) {
    return url.hostname
  }

  return host.split(":")[0] ?? url.hostname
}

export async function GET(request: NextRequest) {
  const url = new URL(request.url)

  if (isLocalAliasHostname(getRequestHostname(request, url))) {
    return NextResponse.redirect(
      new URL(`${url.pathname}${url.search}`, getCanonicalAppOrigin())
    )
  }

  const code = url.searchParams.get("code")
  const nextPath = getSafePostAuthPath(
    url.searchParams.get("next"),
    getCanonicalAppUrl("/auth/callback")
  )
  const runtime = getRuntimeConfiguration()

  if (!runtime.supabaseClientConfigured) {
    return getCallbackFailureRedirect("auth_unavailable")
  }

  if (!code) {
    return getCallbackFailureRedirect("missing_code")
  }

  const successResponse = NextResponse.redirect(
    new URL(nextPath, getCanonicalAppOrigin())
  )
  let supabase: RouteHandlerSupabaseClient

  try {
    supabase = createRouteHandlerSupabaseClient(request, successResponse)
  } catch (error) {
    console.error("Supabase auth callback client setup failed", {
      code: getSupabaseErrorCode(error),
      host: url.hostname,
      message: sanitizeErrorMessage(error),
    })
    return getCallbackFailureRedirect("callback_client_error")
  }

  const { error } = await supabase.auth.exchangeCodeForSession(code)

  if (error) {
    console.error("Supabase auth callback exchange failed", {
      code: getSupabaseErrorCode(error),
      host: url.hostname,
      message: sanitizeErrorMessage(error),
    })
    return getCallbackFailureRedirect("exchange_failed")
  }

  return successResponse
}
