import { beforeEach, describe, expect, it, vi } from "vitest"

const mocks = vi.hoisted(() => ({
  clearServerSupabaseAuthCookies: vi.fn(),
  createServerSupabaseClient: vi.fn(),
  redirect: vi.fn(),
  signOut: vi.fn(),
}))

vi.mock("next/navigation", () => ({
  redirect: mocks.redirect,
}))

vi.mock("@/lib/supabase/server", () => ({
  clearServerSupabaseAuthCookies: mocks.clearServerSupabaseAuthCookies,
  createServerSupabaseClient: mocks.createServerSupabaseClient,
}))

import { signOutAction } from "@/app/(workspace)/app/actions"

describe("sign out action", () => {
  beforeEach(() => {
    mocks.redirect.mockReset()
    mocks.clearServerSupabaseAuthCookies.mockReset()
    mocks.createServerSupabaseClient.mockReset()
    mocks.signOut.mockReset()

    mocks.clearServerSupabaseAuthCookies.mockResolvedValue(undefined)
    mocks.signOut.mockResolvedValue({ error: null })
    mocks.createServerSupabaseClient.mockResolvedValue({
      auth: {
        signOut: mocks.signOut,
      },
    })
  })

  it("signs out locally exactly once and redirects to /sign-in", async () => {
    await signOutAction()

    expect(mocks.signOut).toHaveBeenCalledTimes(1)
    expect(mocks.signOut).toHaveBeenCalledWith({ scope: "local" })
    expect(mocks.clearServerSupabaseAuthCookies).toHaveBeenCalledTimes(1)
    expect(mocks.redirect).toHaveBeenCalledWith("/sign-in?signed_out=1")
  })

  it("still redirects when the session is already missing", async () => {
    mocks.signOut.mockRejectedValue(new Error("Auth session missing."))

    await signOutAction()

    expect(mocks.signOut).toHaveBeenCalledTimes(1)
    expect(mocks.clearServerSupabaseAuthCookies).toHaveBeenCalledTimes(1)
    expect(mocks.redirect).toHaveBeenCalledWith("/sign-in?signed_out=1")
  })
})
