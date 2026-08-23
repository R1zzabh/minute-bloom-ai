// @vitest-environment jsdom
// @vitest-environment-options {"url":"http://127.0.0.1:3000/sign-in"}

import { fireEvent, render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { act } from "react"
import { beforeEach, describe, expect, it, vi } from "vitest"

const mocks = vi.hoisted(() => ({
  createBrowserSupabaseClient: vi.fn(),
  refresh: vi.fn(),
  replace: vi.fn(),
  signInWithOtp: vi.fn(),
  verifyOtp: vi.fn(),
}))

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    replace: mocks.replace,
    refresh: mocks.refresh,
  }),
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
    vi.useRealTimers()
    setBrowserLocation()
    mocks.replace.mockReset()
    mocks.refresh.mockReset()
    mocks.signInWithOtp.mockReset()
    mocks.verifyOtp.mockReset()
    mocks.createBrowserSupabaseClient.mockReset()
    mocks.createBrowserSupabaseClient.mockReturnValue({
      auth: {
        signInWithOtp: mocks.signInWithOtp,
        verifyOtp: mocks.verifyOtp,
      },
    })
    mocks.signInWithOtp.mockResolvedValue({ error: null })
    mocks.verifyOtp.mockResolvedValue({
      data: {
        session: {
          access_token: "session",
        },
      },
      error: null,
    })
  })

  it("prevents native GET submission and keeps the sign-in URL clean", async () => {
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

  it("requests an OTP for a normalized email and enables user creation", async () => {
    const user = userEvent.setup()
    render(<SignInForm disabled={false} />)

    await user.type(screen.getByLabelText("Work email"), "Agent@Example.com ")
    await user.click(screen.getByRole("button", { name: "Send sign-in code" }))

    await waitFor(() => {
      expect(mocks.signInWithOtp).toHaveBeenCalledWith({
        email: "agent@example.com",
        options: {
          shouldCreateUser: true,
        },
      })
    })

    expect(
      await screen.findByText(/we sent a sign-in code to agent@example\.com\./i)
    ).toBeVisible()
    expect(screen.getByText("agent@example.com")).toBeVisible()
  })

  it("validates email input before requesting an OTP", async () => {
    const user = userEvent.setup()
    render(<SignInForm disabled={false} />)

    await user.type(screen.getByLabelText("Work email"), "not-an-email")
    await user.click(screen.getByRole("button", { name: "Send sign-in code" }))

    expect(
      await screen.findByText("Enter a valid email address.")
    ).toBeVisible()
    expect(mocks.signInWithOtp).not.toHaveBeenCalled()
  })

  it("blocks duplicate OTP requests while the first send is pending", async () => {
    const deferred = createDeferred<{ error: null }>()
    mocks.signInWithOtp.mockReturnValue(deferred.promise)

    const user = userEvent.setup()
    render(<SignInForm disabled={false} />)

    await user.type(screen.getByLabelText("Work email"), "agent@example.com")

    const button = screen.getByRole("button", { name: "Send sign-in code" })
    await user.dblClick(button)

    expect(mocks.signInWithOtp).toHaveBeenCalledTimes(1)
    expect(
      screen.getByRole("button", { name: "Sending sign-in code..." })
    ).toBeDisabled()
    expect(screen.getByLabelText("Work email")).toBeDisabled()

    deferred.resolve({ error: null })

    expect(await screen.findByText("Enter your sign-in code")).toBeVisible()
  })

  it("normalizes the OTP input before verification", async () => {
    const user = userEvent.setup()
    render(<SignInForm disabled={false} />)

    await user.type(screen.getByLabelText("Work email"), "agent@example.com")
    await user.click(screen.getByRole("button", { name: "Send sign-in code" }))

    const otpInput = await screen.findByLabelText("One-time code")
    await user.type(otpInput, "12 3-4a56")
    expect(otpInput).toHaveValue("123456")

    await user.click(screen.getByRole("button", { name: "Verify and sign in" }))

    await waitFor(() => {
      expect(mocks.verifyOtp).toHaveBeenCalledWith({
        email: "agent@example.com",
        token: "123456",
        type: "email",
      })
    })
  })

  it("redirects to /app after successful OTP verification", async () => {
    const user = userEvent.setup()
    render(<SignInForm disabled={false} />)

    await user.type(screen.getByLabelText("Work email"), "agent@example.com")
    await user.click(screen.getByRole("button", { name: "Send sign-in code" }))
    await user.type(await screen.findByLabelText("One-time code"), "123456")
    await user.click(screen.getByRole("button", { name: "Verify and sign in" }))

    await waitFor(() => {
      expect(mocks.replace).toHaveBeenCalledWith("/app")
      expect(mocks.refresh).toHaveBeenCalledTimes(1)
    })
  })

  it("shows a useful invalid-code error", async () => {
    mocks.verifyOtp.mockResolvedValue({
      data: {
        session: null,
      },
      error: new Error("Token provided is invalid or incorrect."),
    })

    const user = userEvent.setup()
    render(<SignInForm disabled={false} />)

    await user.type(screen.getByLabelText("Work email"), "agent@example.com")
    await user.click(screen.getByRole("button", { name: "Send sign-in code" }))
    await user.type(await screen.findByLabelText("One-time code"), "123456")
    await user.click(screen.getByRole("button", { name: "Verify and sign in" }))

    expect(
      await screen.findByText("That code is invalid. Check it and try again.")
    ).toBeVisible()
    expect(mocks.replace).not.toHaveBeenCalled()
  })

  it("shows a useful expired-code error", async () => {
    mocks.verifyOtp.mockResolvedValue({
      data: {
        session: null,
      },
      error: new Error("OTP has expired"),
    })

    const user = userEvent.setup()
    render(<SignInForm disabled={false} />)

    await user.type(screen.getByLabelText("Work email"), "agent@example.com")
    await user.click(screen.getByRole("button", { name: "Send sign-in code" }))
    await user.type(await screen.findByLabelText("One-time code"), "123456")
    await user.click(screen.getByRole("button", { name: "Verify and sign in" }))

    expect(
      await screen.findByText(
        "That code has expired. Request a new code and try again."
      )
    ).toBeVisible()
    expect(mocks.replace).not.toHaveBeenCalled()
  })

  it("enforces a resend cooldown and sends a fresh OTP after it expires", async () => {
    vi.useFakeTimers()

    render(<SignInForm disabled={false} />)

    fireEvent.change(screen.getByLabelText("Work email"), {
      target: { value: "agent@example.com" },
    })
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Send sign-in code" }))
    })
    await act(async () => {
      await Promise.resolve()
    })

    expect(screen.getByText("Enter your sign-in code")).toBeVisible()

    expect(
      screen.getByRole("button", { name: "Resend code in 60s" })
    ).toBeDisabled()

    for (let index = 0; index < 60; index += 1) {
      await act(async () => {
        await vi.advanceTimersByTimeAsync(1000)
      })
    }

    const resendButton = screen.getByRole("button", { name: "Resend code" })
    expect(resendButton).toBeEnabled()

    await act(async () => {
      fireEvent.click(resendButton)
    })
    await act(async () => {
      await Promise.resolve()
    })

    expect(mocks.signInWithOtp).toHaveBeenCalledTimes(2)

    expect(
      screen.getByText("A new sign-in code was sent to agent@example.com.")
    ).toBeVisible()
  }, 10_000)

  it("lets the user change the email after requesting an OTP", async () => {
    const user = userEvent.setup()
    render(<SignInForm disabled={false} />)

    await user.type(screen.getByLabelText("Work email"), "agent@example.com")
    await user.click(screen.getByRole("button", { name: "Send sign-in code" }))
    await user.click(
      await screen.findByRole("button", { name: "Change email" })
    )

    expect(screen.getByLabelText("Work email")).toBeVisible()
    expect(screen.queryByLabelText("One-time code")).not.toBeInTheDocument()
    expect(screen.queryByText("agent@example.com")).not.toBeInTheDocument()
  })
})
