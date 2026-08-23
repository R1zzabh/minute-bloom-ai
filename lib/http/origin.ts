import { getPublicEnv, getServerEnv } from "@/lib/env"

function getExpectedOrigins(request: Request) {
  const requestUrl = new URL(request.url)
  const origins = new Set<string>([requestUrl.origin])
  const appUrl = getPublicEnv().NEXT_PUBLIC_APP_URL

  if (appUrl) {
    origins.add(new URL(appUrl).origin)
  }

  return origins
}

export function assertSameOriginMutation(request: Request) {
  const origin = request.headers.get("origin")

  if (!origin) {
    return {
      ok: false as const,
      response: Response.json(
        { error: "Missing origin header." },
        { status: 403 }
      ),
    }
  }

  if (!getExpectedOrigins(request).has(origin)) {
    return {
      ok: false as const,
      response: Response.json(
        { error: "Cross-origin request blocked." },
        { status: 403 }
      ),
    }
  }

  return { ok: true as const }
}

export function hasWorkerAuthorization(request: Request) {
  const secret = getServerEnv().CRON_SECRET

  if (!secret) {
    return false
  }

  const authorization = request.headers.get("authorization")
  return authorization === `Bearer ${secret}`
}
