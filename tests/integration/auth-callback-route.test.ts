import { NextRequest } from "next/server"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

vi.mock("@/lib/env", () => ({
  getRuntimeConfiguration: vi.fn(() => ({
    supabaseClientConfigured: true,
  })),
}))

const mocks = vi.hoisted(() => ({
  createRouteHandlerSupabaseClient: vi.fn(),
  exchangeCodeForSession: vi.fn(),
}))

vi.mock("@/lib/supabase/server", () => ({
  createRouteHandlerSupabaseClient: mocks.createRouteHandlerSupabaseClient,
}))

import { GET } from "@/app/auth/callback/route"

describe("auth callback route", () => {
  beforeEach(() => {
    mocks.createRouteHandlerSupabaseClient.mockReset()
    mocks.exchangeCodeForSession.mockReset()
    mocks.exchangeCodeForSession.mockResolvedValue({ error: null })
    mocks.createRouteHandlerSupabaseClient.mockImplementation(
      (_request, response) => {
        response.cookies.set("sb-test-auth-token", "session", { path: "/" })

        return {
          auth: {
            exchangeCodeForSession: mocks.exchangeCodeForSession,
          },
        }
      }
    )
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it("preserves safe internal redirects and response cookies", async () => {
    const response = await GET(
      new NextRequest(
        `http://localhost:3000/auth/callback?code=123&next=${encodeURIComponent("/app/settings?tab=profile#security")}`
      )
    )

    expect(mocks.exchangeCodeForSession).toHaveBeenCalledWith("123")
    expect(response.headers.get("location")).toBe(
      "http://localhost:3000/app/settings?tab=profile#security"
    )
    expect(response.headers.get("set-cookie")).toContain(
      "sb-test-auth-token=session"
    )
  })

  it("does not redirect between localhost aliases before exchanging the code", async () => {
    const response = await GET(
      new NextRequest(
        "http://127.0.0.1:3000/auth/callback?code=123&next=%2Fapp",
        {
          headers: {
            host: "127.0.0.1:3000",
          },
        }
      )
    )

    expect(mocks.createRouteHandlerSupabaseClient).toHaveBeenCalledTimes(1)
    expect(mocks.exchangeCodeForSession).toHaveBeenCalledWith("123")
    expect(response.headers.get("location")).toBe("http://localhost:3000/app")
  })

  it("falls back to /app for unsafe redirects", async () => {
    const response = await GET(
      new NextRequest(
        "http://localhost:3000/auth/callback?code=123&next=%2F%2Fevil.example"
      )
    )

    expect(response.headers.get("location")).toBe("http://localhost:3000/app")
  })

  it("returns a safe visible error when the exchange fails", async () => {
    mocks.exchangeCodeForSession.mockResolvedValue({
      error: new Error("PKCE verifier missing"),
    })

    const response = await GET(
      new NextRequest(
        "http://localhost:3000/auth/callback?code=123&next=%2Fapp"
      )
    )

    expect(response.headers.get("location")).toBe(
      "http://localhost:3000/sign-in?error=exchange_failed"
    )
  })

  it("returns a safe visible error when the callback code is missing", async () => {
    const response = await GET(
      new NextRequest("http://localhost:3000/auth/callback?next=%2Fapp")
    )

    expect(mocks.createRouteHandlerSupabaseClient).not.toHaveBeenCalled()
    expect(response.headers.get("location")).toBe(
      "http://localhost:3000/sign-in?error=missing_code"
    )
  })
})
