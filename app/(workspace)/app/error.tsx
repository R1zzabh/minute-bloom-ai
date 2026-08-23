"use client"

import Link from "next/link"

import { Button, buttonVariants } from "@/components/ui/button"
import { Card } from "@/components/ui/card"

export default function WorkspaceError({
  error,
  reset,
}: {
  error: Error
  reset: () => void
}) {
  return (
    <Card className="content-width">
      <p className="mono-label">workspace error</p>
      <h1 className="mt-3 text-3xl font-semibold tracking-tight">
        The workspace could not be loaded
      </h1>
      <p className="mt-3 text-sm leading-7 text-muted-foreground">
        {error.message || "An unexpected workspace error occurred."}
      </p>
      <div className="mt-6 flex flex-wrap gap-3">
        <Button onClick={reset}>Try again</Button>
        <Link href="/demo" className={buttonVariants({ variant: "secondary" })}>
          Open fixture demo
        </Link>
      </div>
    </Card>
  )
}
