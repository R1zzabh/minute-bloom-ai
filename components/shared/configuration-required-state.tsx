import Link from "next/link"

import { Card } from "@/components/ui/card"

export function ConfigurationRequiredState({
  title,
  message,
  missing,
}: {
  title: string
  message: string
  missing: string[]
}) {
  return (
    <Card className="content-width">
      <p className="mono-label">configuration required</p>
      <h1 className="mt-3 text-3xl font-semibold tracking-tight">{title}</h1>
      <p className="mt-3 max-w-2xl text-sm leading-7 text-muted-foreground">
        {message}
      </p>
      {missing.length > 0 ? (
        <div className="mt-4 rounded-lg border-2 border-border bg-background px-4 py-4">
          <p className="text-sm font-medium">Missing environment variables</p>
          <p className="mt-2 text-sm text-muted-foreground">
            {missing.join(", ")}
          </p>
        </div>
      ) : null}
      <div className="mt-6 flex flex-wrap gap-3">
        <Link
          href="/demo"
          className="pressable inline-flex min-h-11 items-center justify-center rounded-lg border-2 border-border bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-[var(--shadow)]"
        >
          Open fixture demo
        </Link>
        <Link
          href="/sign-in"
          className="pressable inline-flex min-h-11 items-center justify-center rounded-lg border-2 border-border bg-card px-4 py-2 text-sm font-semibold text-card-foreground shadow-[var(--shadow)]"
        >
          Go to sign-in
        </Link>
      </div>
    </Card>
  )
}
