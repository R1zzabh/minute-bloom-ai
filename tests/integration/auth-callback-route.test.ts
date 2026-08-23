import { afterEach, describe, expect, it, vi } from "vitest"

vi.mock("@/lib/env", () => ({
  getRuntimeConfiguration: vi.fn(() => ({
    supabaseClientConfigured: true,
  })),
}))

const exchangeCodeForSession = vi.fn()

vi.mock("@/lib/supabase/server", () => ({
  createServerSupabaseClient: vi.fn(async () => ({
    auth: {
      exchangeCodeForSession,
    },
  })),
}))

import { GET } from "@/app/auth/callback/route"

describe("auth callback route", () => {
  afterEach(() => {
    vi.clearAllMocks()
  })

  it("preserves safe internal redirects", async () => {
    const response = await GET(
      new Request(
        `https://minute-bloom.example/auth/callback?code=123&next=${encodeURIComponent("/app/settings?tab=profile#security")}`
      )
    )

    expect(exchangeCodeForSession).toHaveBeenCalledWith("123")
    expect(response.headers.get("location")).toBe(
      "https://minute-bloom.example/app/settings?tab=profile#security"
    )
  })

  it("falls back to /app for unsafe redirects", async () => {
    const response = await GET(
      new Request(
        "https://minute-bloom.example/auth/callback?next=%2F%2Fevil.example"
      )
    )

    expect(response.headers.get("location")).toBe(
      "https://minute-bloom.example/app"
    )
  })
})
