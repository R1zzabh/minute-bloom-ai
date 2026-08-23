import { NextRequest } from "next/server"
import { beforeEach, describe, expect, it, vi } from "vitest"

const authCookieName = "sb-knlounxdcfqbbpflaivj-auth-token"

const mocks = vi.hoisted(() => ({
  clearAuthCookiesAtScopes: vi.fn(),
  createServerClient: vi.fn(),
  getPublicEnv: vi.fn(),
  getRuntimeConfiguration: vi.fn(),
  getUser: vi.fn(),
  lastCookieAdapter: null as null | {
    getAll: () => { name: string; value: string }[]
    setAll: (
      cookiesToSet: {
        name: string
        value: string
        options?: Record<string, unknown>
      }[],
      headers?: Record<string, string>
    ) => void
  },
}))

vi.mock("@supabase/ssr", () => ({
  clearAuthCookiesAtScopes: mocks.clearAuthCookiesAtScopes,
  createServerClient: mocks.createServerClient,
}))

vi.mock("@/lib/env", () => ({
  getPublicEnv: mocks.getPublicEnv,
  getRuntimeConfiguration: mocks.getRuntimeConfiguration,
}))

import { updateSession } from "@/lib/supabase/middleware"

function getLocationPath(response: Response) {
  const location = response.headers.get("location")
  return location ? new URL(location).pathname : null
}

describe("supabase middleware", () => {
  beforeEach(() => {
    mocks.clearAuthCookiesAtScopes.mockReset()
    mocks.createServerClient.mockReset()
    mocks.getPublicEnv.mockReset()
    mocks.getRuntimeConfiguration.mockReset()
    mocks.getUser.mockReset()
    mocks.lastCookieAdapter = null

    mocks.getPublicEnv.mockReturnValue({
      NEXT_PUBLIC_SUPABASE_URL: "https://knlounxdcfqbbpflaivj.supabase.co",
      supabasePublicKey: "sb_publishable_test",
    })
    mocks.getRuntimeConfiguration.mockReturnValue({
      supabaseClientConfigured: true,
    })
    mocks.createServerClient.mockImplementation((_url, _key, options) => {
      mocks.lastCookieAdapter = options.cookies

      return {
        auth: {
          getUser: mocks.getUser,
        },
      }
    })
    mocks.clearAuthCookiesAtScopes.mockResolvedValue(undefined)
  })

  it("redirects unauthenticated workspace requests to /sign-in", async () => {
    mocks.getUser.mockResolvedValue({
      data: {
        user: null,
      },
    })

    const response = await updateSession(
      new NextRequest("http://127.0.0.1:3000/app")
    )

    expect(getLocationPath(response)).toBe("/sign-in")
  })

  it("redirects authenticated users away from /sign-in and preserves refreshed cookies", async () => {
    mocks.getUser.mockImplementation(async () => {
      mocks.lastCookieAdapter?.setAll(
        [
          {
            name: authCookieName,
            value: "fresh-session",
            options: { path: "/" },
          },
        ],
        {}
      )

      return {
        data: {
          user: {
            id: "user-1",
          },
        },
      }
    })

    const response = await updateSession(
      new NextRequest("http://127.0.0.1:3000/sign-in")
    )

    expect(getLocationPath(response)).toBe("/app")
    expect(response.headers.get("set-cookie")).toContain(
      `${authCookieName}=fresh-session`
    )
  })

  it("clears stale auth cookies before redirecting a signed-out refresh", async () => {
    mocks.getUser.mockResolvedValue({
      data: {
        user: null,
      },
    })
    mocks.clearAuthCookiesAtScopes.mockImplementation(
      async ({ setAll, storageKey }) => {
        setAll(
          [
            {
              name: storageKey,
              value: "",
              options: { maxAge: 0, path: "/" },
            },
          ],
          {}
        )
      }
    )

    const response = await updateSession(
      new NextRequest("http://127.0.0.1:3000/app", {
        headers: {
          cookie: `${authCookieName}=stale-session`,
        },
      })
    )

    expect(mocks.clearAuthCookiesAtScopes).toHaveBeenCalledTimes(1)
    expect(getLocationPath(response)).toBe("/sign-in")
    expect(response.headers.get("set-cookie")).toContain(`${authCookieName}=`)
  })

  it("keeps /demo public and fixture-only", async () => {
    mocks.getUser.mockResolvedValue({
      data: {
        user: null,
      },
    })

    const response = await updateSession(
      new NextRequest("http://127.0.0.1:3000/demo")
    )

    expect(response.headers.get("location")).toBeNull()
  })
})
