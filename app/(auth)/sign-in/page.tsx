import Link from "next/link"
import { redirect } from "next/navigation"

import { SignInForm } from "@/components/auth/sign-in-form"
import { Logo } from "@/components/shared/logo"
import { Card } from "@/components/ui/card"
import { hasConfiguredSupabase } from "@/lib/env"
import { getAuthenticatedUser } from "@/lib/supabase/server"

export default async function SignInPage() {
  if (hasConfiguredSupabase()) {
    const user = await getAuthenticatedUser()

    if (user) {
      redirect("/app")
    }
  }

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
              MinuteBloom uses Supabase email authentication to keep private
              uploads, transcripts, and action items scoped to your account.
            </p>
          </div>
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
