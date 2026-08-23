"use client"

import { useRef, useState } from "react"

import { createBrowserSupabaseClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { appConfig } from "@/lib/config"

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

type FormStatus =
  | { type: "error"; message: string }
  | { type: "success"; message: string }
  | null

function getSignInErrorMessage(error: unknown) {
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

  return "Unable to start sign-in."
}

export function SignInForm({ disabled }: { disabled: boolean }) {
  const [email, setEmail] = useState("")
  const [pending, setPending] = useState(false)
  const [status, setStatus] = useState<FormStatus>(null)
  const submittingRef = useRef(false)

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (submittingRef.current) {
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

    submittingRef.current = true
    setPending(true)
    setStatus(null)

    try {
      const supabase = createBrowserSupabaseClient()
      const { error } = await supabase.auth.signInWithOtp({
        email: normalizedEmail,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback?next=/app`,
        },
      })

      if (error) {
        setStatus({
          type: "error",
          message: getSignInErrorMessage(error),
        })
        return
      }

      setStatus({
        type: "success",
        message:
          "Check your email for the sign-in link, then open it in this same browser on 127.0.0.1:3000.",
      })
    } catch (error) {
      setStatus({
        type: "error",
        message: getSignInErrorMessage(error),
      })
    } finally {
      submittingRef.current = false
      setPending(false)
    }
  }

  const isInteractionDisabled = disabled || pending

  return (
    <form className="mt-8 space-y-4" noValidate onSubmit={handleSubmit}>
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
          placeholder={`team@${appConfig.name.toLowerCase()}.ai`}
          disabled={isInteractionDisabled}
          inputMode="email"
          required
        />
      </div>
      <Button className="w-full" type="submit" disabled={isInteractionDisabled}>
        {pending ? "Sending sign-in link..." : "Continue with email"}
      </Button>
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
        Supabase email sign-in sends a magic link to your inbox. Open the link
        in this same browser on 127.0.0.1:3000.
      </p>
    </form>
  )
}
