// @vitest-environment jsdom
// @vitest-environment-options {"url":"http://127.0.0.1:3000/sign-in"}

import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { beforeEach, describe, expect, it, vi } from "vitest"

const mocks = vi.hoisted(() => ({
  createBrowserSupabaseClient: vi.fn(),
  signInWithOtp: vi.fn(),
}))

vi.mock("@/lib/supabase/client", () => ({
  createBrowserSupabaseClient: mocks.createBrowserSupabaseClient,
}))

import { SignInForm } from "@/components/auth/sign-in-form"

function setBrowserLocation(path = "/sign-in") {
  window.history.replaceState({}, "", path)
}

function createDeferred<T>() {
  let resolve!: (value: T) => void
  let reject!: (reason?: unknown) => void

  const promise = new Promise<T>((res, rej) => {
    resolve = res
    reject = rej
  })

  return { promise, resolve, reject }
}

describe("sign in form", () => {
  beforeEach(() => {
    setBrowserLocation()
    mocks.signInWithOtp.mockReset()
    mocks.createBrowserSupabaseClient.mockReset()
    mocks.createBrowserSupabaseClient.mockReturnValue({
      auth: {
        signInWithOtp: mocks.signInWithOtp,
      },
    })
  })

  it("prevents native GET submission and keeps the sign-in URL clean", async () => {
    mocks.signInWithOtp.mockResolvedValue({ error: null })

    const user = userEvent.setup()
    const { container } = render(<SignInForm disabled={false} />)

    await user.type(screen.getByLabelText("Work email"), "Agent@Example.com ")

    const form = container.querySelector("form")
    expect(form).not.toBeNull()

    const submitEvent = new Event("submit", {
      bubbles: true,
      cancelable: true,
    })

    form!.dispatchEvent(submitEvent)

    expect(submitEvent.defaultPrevented).toBe(true)

    await waitFor(() => {
      expect(mocks.signInWithOtp).toHaveBeenCalledTimes(1)
    })

    expect(window.location.pathname + window.location.search).toBe("/sign-in")
  })

  it("normalizes the email and sends the correct callback origin", async () => {
    mocks.signInWithOtp.mockResolvedValue({ error: null })

    const user = userEvent.setup()
    render(<SignInForm disabled={false} />)

    await user.type(screen.getByLabelText("Work email"), "Agent@Example.com ")
    await user.click(
      screen.getByRole("button", { name: "Continue with email" })
    )

    await waitFor(() => {
      expect(mocks.signInWithOtp).toHaveBeenCalledWith({
        email: "agent@example.com",
        options: {
          emailRedirectTo: "http://127.0.0.1:3000/auth/callback?next=/app",
        },
      })
    })
  })

  it("renders a success state after Supabase accepts the request", async () => {
    mocks.signInWithOtp.mockResolvedValue({ error: null })

    const user = userEvent.setup()
    render(<SignInForm disabled={false} />)

    await user.type(screen.getByLabelText("Work email"), "agent@example.com")
    await user.click(
      screen.getByRole("button", { name: "Continue with email" })
    )

    expect(
      await screen.findByText(
        /check your email for the sign-in link, then open it in this same browser on 127\.0\.0\.1:3000\./i
      )
    ).toBeVisible()
  })

  it("renders provider errors without claiming an email was sent", async () => {
    mocks.signInWithOtp.mockResolvedValue({
      error: new Error("SMTP temporarily unavailable."),
    })

    const user = userEvent.setup()
    render(<SignInForm disabled={false} />)

    await user.type(screen.getByLabelText("Work email"), "agent@example.com")
    await user.click(
      screen.getByRole("button", { name: "Continue with email" })
    )

    expect(
      await screen.findByText("SMTP temporarily unavailable.")
    ).toBeVisible()
    expect(
      screen.queryByText(/check your email for the sign-in link/i)
    ).not.toBeInTheDocument()
  })

  it("renders rate-limit errors without retrying automatically", async () => {
    mocks.signInWithOtp.mockResolvedValue({
      error: {
        message: "rate limit exceeded",
        status: 429,
      },
    })

    const user = userEvent.setup()
    render(<SignInForm disabled={false} />)

    await user.type(screen.getByLabelText("Work email"), "agent@example.com")
    await user.click(
      screen.getByRole("button", { name: "Continue with email" })
    )

    expect(
      await screen.findByText(
        "Email sign-in is temporarily rate limited. Please wait before trying again."
      )
    ).toBeVisible()
    expect(mocks.signInWithOtp).toHaveBeenCalledTimes(1)
  })

  it("blocks duplicate submissions while the first request is pending", async () => {
    const deferred = createDeferred<{ error: null }>()
    mocks.signInWithOtp.mockReturnValue(deferred.promise)

    const user = userEvent.setup()
    render(<SignInForm disabled={false} />)

    await user.type(screen.getByLabelText("Work email"), "agent@example.com")

    const button = screen.getByRole("button", { name: "Continue with email" })
    await user.dblClick(button)

    expect(mocks.signInWithOtp).toHaveBeenCalledTimes(1)
    expect(
      screen.getByRole("button", { name: "Sending sign-in link..." })
    ).toBeDisabled()
    expect(screen.getByLabelText("Work email")).toBeDisabled()

    deferred.resolve({ error: null })

    expect(
      await screen.findByText(/check your email for the sign-in link/i)
    ).toBeVisible()
  })
})
