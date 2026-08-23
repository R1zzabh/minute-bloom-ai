import Link from "next/link"

import { Card } from "@/components/ui/card"

export default function NotFound() {
  return (
    <main className="section-padding min-h-screen">
      <div className="content-width flex justify-center">
        <Card className="w-full max-w-2xl">
          <p className="mono-label">not found</p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight">
            The requested page could not be found
          </h1>
          <p className="mt-3 text-sm leading-7 text-muted-foreground">
            Use the live workspace for your own meetings or open the
            deterministic demo to inspect the product safely.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href="/app"
              className="pressable inline-flex min-h-11 items-center justify-center rounded-lg border-2 border-border bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-[var(--shadow)]"
            >
              Go to workspace
            </Link>
            <Link
              href="/demo"
              className="pressable inline-flex min-h-11 items-center justify-center rounded-lg border-2 border-border bg-card px-4 py-2 text-sm font-semibold text-card-foreground shadow-[var(--shadow)]"
            >
              Open fixture demo
            </Link>
          </div>
        </Card>
      </div>
    </main>
  )
}
