import { NextResponse, type NextRequest } from "next/server"

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

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  if (isBypassedPathname(pathname)) {
    return NextResponse.next()
  }

  return updateSession(request)
}

export const config = {
  matcher: [
    "/((?!_next/|_nextjs_font/|favicon.ico|robots.txt|sitemap.xml|manifest.json|manifest.webmanifest|site.webmanifest|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js|map|woff|woff2|ttf|otf)$).*)",
  ],
}
