import Link from "next/link"
import { redirect } from "next/navigation"

import { SignInForm } from "@/components/auth/sign-in-form"
import { Logo } from "@/components/shared/logo"
import { Card } from "@/components/ui/card"
import { hasConfiguredSupabase } from "@/lib/env"
import { getAuthenticatedUser } from "@/lib/supabase/server"

type SignInPageProps = {
  searchParams: Promise<{
    error?: string
    signed_out?: string
  }>
}

const SIGN_IN_ERROR_MESSAGES: Record<string, string> = {
  auth_unavailable: "Authentication is temporarily unavailable.",
  callback_client_error: "Authentication could not start on this device.",
  exchange_failed:
    "Authentication could not be completed. Try signing in again.",
  missing_code: "Authentication was incomplete. Try signing in again.",
}

function getSignInStatusMessage(params: {
  error?: string
  signed_out?: string
}) {
  if (params.signed_out === "1") {
    return {
      tone: "success" as const,
      message: "You have been signed out.",
    }
  }

  const errorCode = params.error?.trim()

  if (!errorCode) {
    return null
  }

  return {
    tone: "error" as const,
    message:
      SIGN_IN_ERROR_MESSAGES[errorCode] ??
      "Authentication could not be completed. Try signing in again.",
  }
}

export default async function SignInPage({ searchParams }: SignInPageProps) {
  const params = await searchParams

  if (hasConfiguredSupabase()) {
    const user = await getAuthenticatedUser()

    if (user) {
      redirect("/app")
    }
  }

  const status = getSignInStatusMessage(params)

  return (
    <main className="section-padding min-h-screen">
      <div className="content-width flex justify-center">
        <Card className="w-full max-w-xl">
          <Logo />
          <div className="mt-6 space-y-2">
            <p className="mono-label">private workspace access</p>
            <h1 className="text-3xl font-semibold tracking-tight">
              Sign in to store meeting notes privately
            </h1>
            <p className="text-sm leading-7 text-muted-foreground">
              MinuteBloom uses Supabase email OTP authentication to keep private
              uploads, transcripts, and action items scoped to your account.
            </p>
          </div>
          {status ? (
            <p
              className={
                status.tone === "error"
                  ? "mt-6 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive"
                  : "mt-6 rounded-lg border border-emerald-600/30 bg-emerald-600/10 px-4 py-3 text-sm text-emerald-700"
              }
              role="status"
            >
              {status.message}
            </p>
          ) : null}
          <SignInForm disabled={!hasConfiguredSupabase()} />
          <p className="mt-6 text-sm text-muted-foreground">
            Want to inspect the UI first?{" "}
            <Link href="/demo" className="font-medium text-primary">
              Open the sample workspace
            </Link>
            .
          </p>
        </Card>
      </div>
    </main>
  )
}
