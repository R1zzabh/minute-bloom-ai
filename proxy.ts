import { NextResponse, type NextRequest } from "next/server"

import { getCanonicalAppOrigin, isLocalAliasHostname } from "@/lib/http/app-url"
import { updateSession } from "@/lib/supabase/middleware"

const PUBLIC_ASSET_PATTERN =
  /\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js|map|woff|woff2|ttf|otf)$/i

function isBypassedPathname(pathname: string) {
  return (
    pathname.startsWith("/_next/") ||
    pathname.startsWith("/_nextjs_font/") ||
    pathname === "/favicon.ico" ||
    pathname === "/robots.txt" ||
    pathname === "/sitemap.xml" ||
    pathname === "/manifest.json" ||
    pathname === "/manifest.webmanifest" ||
    pathname === "/site.webmanifest" ||
    PUBLIC_ASSET_PATTERN.test(pathname)
  )
}

function getIncomingHostname(request: NextRequest) {
  const forwardedHost = request.headers.get("x-forwarded-host")
  const host = forwardedHost ?? request.headers.get("host")

  if (!host) {
    return request.nextUrl.hostname
  }

  return host.split(":")[0] ?? request.nextUrl.hostname
}

function isDocumentRequest(request: NextRequest) {
  const secFetchDest = request.headers.get("sec-fetch-dest")

  if (secFetchDest === "document") {
    return true
  }

  if (secFetchDest && secFetchDest !== "empty") {
    return false
  }

  const accept = request.headers.get("accept")?.toLowerCase() ?? ""
  return accept.includes("text/html")
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  if (isBypassedPathname(pathname)) {
    return NextResponse.next()
  }

  if (
    (request.method === "GET" || request.method === "HEAD") &&
    isDocumentRequest(request) &&
    isLocalAliasHostname(getIncomingHostname(request)) &&
    !pathname.startsWith("/api/") &&
    !pathname.startsWith("/auth/callback")
  ) {
    const redirectUrl = new URL(request.nextUrl.pathname + request.nextUrl.search, getCanonicalAppOrigin())
    return NextResponse.redirect(redirectUrl)
  }

  return updateSession(request)
}

export const config = {
  matcher: [
    "/((?!_next/|_nextjs_font/|favicon.ico|robots.txt|sitemap.xml|manifest.json|manifest.webmanifest|site.webmanifest|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js|map|woff|woff2|ttf|otf)$).*)",
  ],
}
