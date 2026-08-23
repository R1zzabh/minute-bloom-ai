// @vitest-environment jsdom

import type { PropsWithChildren, ReactNode } from "react"
import { render, screen } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"

const mocks = vi.hoisted(() => ({
  SignInForm: vi.fn(({ disabled }: { disabled: boolean }) => (
    <div data-disabled={String(disabled)}>sign-in-form</div>
  )),
  getAuthenticatedUser: vi.fn(),
  hasConfiguredSupabase: vi.fn(),
  redirect: vi.fn(),
}))

vi.mock("next/link", () => ({
  default: ({ children, href }: { children: ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}))

vi.mock("next/navigation", () => ({
  redirect: mocks.redirect,
}))

vi.mock("@/components/auth/sign-in-form", () => ({
  SignInForm: mocks.SignInForm,
}))

vi.mock("@/components/shared/logo", () => ({
  Logo: () => <div>logo</div>,
}))

vi.mock("@/components/ui/card", () => ({
  Card: ({ children, className }: PropsWithChildren<{ className?: string }>) => (
    <div className={className}>{children}</div>
  ),
}))

vi.mock("@/lib/env", () => ({
  hasConfiguredSupabase: mocks.hasConfiguredSupabase,
}))

vi.mock("@/lib/supabase/server", () => ({
  getAuthenticatedUser: mocks.getAuthenticatedUser,
}))

import SignInPage from "@/app/(auth)/sign-in/page"

describe("sign in page", () => {
  beforeEach(() => {
    mocks.SignInForm.mockClear()
    mocks.getAuthenticatedUser.mockReset()
    mocks.hasConfiguredSupabase.mockReset()
    mocks.redirect.mockReset()

    mocks.hasConfiguredSupabase.mockReturnValue(true)
    mocks.getAuthenticatedUser.mockResolvedValue(null)
  })

  it("shows a visible callback failure message", async () => {
    const element = await SignInPage({
      searchParams: Promise.resolve({ error: "exchange_failed" }),
    })

    render(element)

    expect(
      screen.getByText(
        "The sign-in link could not be completed. Request a new link."
      )
    ).toBeVisible()
  })

  it("shows a visible signed-out confirmation", async () => {
    const element = await SignInPage({
      searchParams: Promise.resolve({ signed_out: "1" }),
    })

    render(element)

    expect(screen.getByText("You have been signed out.")).toBeVisible()
  })

  it("redirects authenticated users to /app", async () => {
    mocks.getAuthenticatedUser.mockResolvedValue({ id: "user-1" })

    await SignInPage({
      searchParams: Promise.resolve({}),
    })

    expect(mocks.redirect).toHaveBeenCalledWith("/app")
  })
})
