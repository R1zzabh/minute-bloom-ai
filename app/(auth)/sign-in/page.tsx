import Link from "next/link"

import { Logo } from "@/components/shared/logo"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"

export default function SignInPage() {
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
              Email authentication, workspace redirects, and Supabase session
              refresh are wired in the data layer milestone. This screen is the
              final product shell for that flow.
            </p>
          </div>
          <form className="mt-8 space-y-4">
            <div>
              <label className="mb-2 block text-sm font-medium" htmlFor="email">
                Work email
              </label>
              <Input
                id="email"
                type="email"
                placeholder="team@minutebloom.ai"
              />
            </div>
            <div>
              <label
                className="mb-2 block text-sm font-medium"
                htmlFor="context"
              >
                Meeting context preview
              </label>
              <Textarea
                id="context"
                placeholder="Optional context helps the summary stay grounded once processing begins."
              />
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Button className="sm:flex-1">Continue with email</Button>
              <Button variant="secondary" className="sm:flex-1">
                Create account
              </Button>
            </div>
          </form>
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
