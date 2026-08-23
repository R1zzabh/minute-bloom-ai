"use client"

import { useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"

import { createBrowserSupabaseClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const RESEND_COOLDOWN_SECONDS = 60

type FormStatus =
  | { type: "error"; message: string }
  | { type: "success"; message: string }
  | null

type Step = "email" | "otp"
type PendingAction = "send" | "verify" | "resend" | null

function normalizeOtpToken(value: string) {
  return value.replace(/\D+/g, "")
}

function getRequestErrorMessage(error: unknown) {
  if (
    typeof error === "object" &&
    error !== null &&
    "status" in error &&
    error.status === 429
  ) {
    return "Email sign-in is temporarily rate limited. Please wait before trying again."
  }

  if (
    error instanceof Error &&
    error.message.toLowerCase().includes("rate limit")
  ) {
    return "Email sign-in is temporarily rate limited. Please wait before trying again."
  }

  if (error instanceof Error && error.message.trim().length > 0) {
    return error.message.trim()
  }

  return "Unable to send a sign-in code right now."
}

function getVerificationErrorMessage(error: unknown) {
  const message =
    error instanceof Error ? error.message.trim().toLowerCase() : undefined

  if (message?.includes("expired")) {
    return "That code has expired. Request a new code and try again."
  }

  if (
    message?.includes("invalid") ||
    message?.includes("token") ||
    message?.includes("otp")
  ) {
    return "That code is invalid. Check it and try again."
  }

  if (
    typeof error === "object" &&
    error !== null &&
    "status" in error &&
    error.status === 429
  ) {
    return "Code verification is temporarily rate limited. Please wait before trying again."
  }

  if (error instanceof Error && error.message.trim().length > 0) {
    return error.message.trim()
  }

  return "Unable to verify that code right now."
}

export function SignInForm({ disabled }: { disabled: boolean }) {
  const router = useRouter()
  const [step, setStep] = useState<Step>("email")
  const [email, setEmail] = useState("")
  const [submittedEmail, setSubmittedEmail] = useState("")
  const [otpToken, setOtpToken] = useState("")
  const [pendingAction, setPendingAction] = useState<PendingAction>(null)
  const [resendCooldown, setResendCooldown] = useState(0)
  const [status, setStatus] = useState<FormStatus>(null)
  const activeActionRef = useRef<PendingAction>(null)

  useEffect(() => {
    if (step !== "otp" || resendCooldown <= 0) {
      return
    }

    const timeoutId = window.setTimeout(() => {
      setResendCooldown((current) => Math.max(0, current - 1))
    }, 1000)

    return () => window.clearTimeout(timeoutId)
  }, [resendCooldown, step])

  async function requestOtp(action: "send" | "resend") {
    if (activeActionRef.current) {
      return
    }

    if (disabled) {
      setStatus({
        type: "error",
        message: "Supabase credentials are required to enable sign-in.",
      })
      return
    }

    const normalizedEmail = email.trim().toLowerCase()
    setEmail(normalizedEmail)

    if (normalizedEmail.length === 0) {
      setStatus({
        type: "error",
        message: "Enter your work email to continue.",
      })
      return
    }

    if (!EMAIL_PATTERN.test(normalizedEmail)) {
      setStatus({
        type: "error",
        message: "Enter a valid email address.",
      })
      return
    }

    activeActionRef.current = action
    setPendingAction(action)
    setStatus(null)

    try {
      const supabase = createBrowserSupabaseClient()
      const { error } = await supabase.auth.signInWithOtp({
        email: normalizedEmail,
        options: {
          shouldCreateUser: true,
        },
      })

      if (error) {
        setStatus({
          type: "error",
          message: getRequestErrorMessage(error),
        })
        return
      }

      setSubmittedEmail(normalizedEmail)
      setStep("otp")
      setOtpToken("")
      setResendCooldown(RESEND_COOLDOWN_SECONDS)
      setStatus({
        type: "success",
        message:
          action === "resend"
            ? `A new sign-in code was sent to ${normalizedEmail}.`
            : `We sent a sign-in code to ${normalizedEmail}.`,
      })
    } catch (error) {
      setStatus({
        type: "error",
        message: getRequestErrorMessage(error),
      })
    } finally {
      activeActionRef.current = null
      setPendingAction(null)
    }
  }

  async function handleEmailSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    await requestOtp("send")
  }

  async function handleOtpSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (activeActionRef.current) {
      return
    }

    if (disabled) {
      setStatus({
        type: "error",
        message: "Supabase credentials are required to enable sign-in.",
      })
      return
    }

    const normalizedToken = normalizeOtpToken(otpToken)
    setOtpToken(normalizedToken)

    if (normalizedToken.length === 0) {
      setStatus({
        type: "error",
        message: "Enter the numeric sign-in code from your email.",
      })
      return
    }

    activeActionRef.current = "verify"
    setPendingAction("verify")
    setStatus(null)

    try {
      const supabase = createBrowserSupabaseClient()
      const {
        data: { session },
        error,
      } = await supabase.auth.verifyOtp({
        email: submittedEmail,
        token: normalizedToken,
        type: "email",
      })

      if (error) {
        setStatus({
          type: "error",
          message: getVerificationErrorMessage(error),
        })
        return
      }

      if (!session) {
        setStatus({
          type: "error",
          message:
            "Sign-in completed without a session. Request a new code and try again.",
        })
        return
      }

      router.replace("/app")
      router.refresh()
    } catch (error) {
      setStatus({
        type: "error",
        message: getVerificationErrorMessage(error),
      })
    } finally {
      activeActionRef.current = null
      setPendingAction(null)
    }
  }

  function handleOtpChange(event: React.ChangeEvent<HTMLInputElement>) {
    setOtpToken(normalizeOtpToken(event.target.value))
  }

  function handleChangeEmail() {
    if (activeActionRef.current) {
      return
    }

    setStep("email")
    setSubmittedEmail("")
    setOtpToken("")
    setResendCooldown(0)
    setStatus(null)
  }

  const emailStepDisabled = disabled || pendingAction !== null
  const otpStepDisabled = disabled || pendingAction !== null

  return (
    <form
      noValidate
      onSubmit={step === "email" ? handleEmailSubmit : handleOtpSubmit}
    >
      <div className="mt-8 space-y-4">
        {step === "email" ? (
          <>
            <div>
              <label className="mb-2 block text-sm font-medium" htmlFor="email">
                Work email
              </label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="name@company.com"
                disabled={emailStepDisabled}
                inputMode="email"
                required
              />
            </div>
            <Button
              className="w-full"
              type="submit"
              disabled={emailStepDisabled}
            >
              {pendingAction === "send"
                ? "Sending sign-in code..."
                : "Send sign-in code"}
            </Button>
          </>
        ) : (
          <>
            <div className="space-y-2">
              <p className="text-sm font-medium">Enter your sign-in code</p>
              <p className="text-sm text-muted-foreground">
                We sent a numeric code to{" "}
                <span className="font-medium text-foreground">
                  {submittedEmail}
                </span>
                .
              </p>
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium" htmlFor="otp">
                One-time code
              </label>
              <Input
                id="otp"
                type="text"
                autoComplete="one-time-code"
                inputMode="numeric"
                pattern="[0-9]*"
                value={otpToken}
                onChange={handleOtpChange}
                placeholder="Enter the code"
                disabled={otpStepDisabled}
                required
              />
            </div>
            <Button className="w-full" type="submit" disabled={otpStepDisabled}>
              {pendingAction === "verify"
                ? "Verifying sign-in code..."
                : "Verify and sign in"}
            </Button>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Button
                type="button"
                variant="secondary"
                className="flex-1"
                onClick={() => void requestOtp("resend")}
                disabled={
                  otpStepDisabled ||
                  resendCooldown > 0 ||
                  pendingAction === "resend"
                }
              >
                {pendingAction === "resend"
                  ? "Sending a new code..."
                  : resendCooldown > 0
                    ? `Resend code in ${resendCooldown}s`
                    : "Resend code"}
              </Button>
              <Button
                type="button"
                variant="ghost"
                className="flex-1"
                onClick={handleChangeEmail}
                disabled={otpStepDisabled}
              >
                Change email
              </Button>
            </div>
          </>
        )}
        <p
          aria-live={status?.type === "error" ? "assertive" : "polite"}
          className={
            status
              ? status.type === "error"
                ? "text-sm text-destructive"
                : "text-sm text-emerald-700"
              : "sr-only"
          }
          role="status"
        >
          {status?.message ?? " "}
        </p>
        <p className="text-xs text-muted-foreground">
          MinuteBloom emails a one-time code that you enter here directly. No
          sign-in link is required.
        </p>
      </div>
    </form>
  )
}
