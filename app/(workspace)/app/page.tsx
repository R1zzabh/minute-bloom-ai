import Link from "next/link"
import { AlertTriangle, ArrowUpRight, Search } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { buttonVariants } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { demoMeeting } from "@/fixtures/demo-meeting"
import { formatDateLabel, formatDuration } from "@/lib/utils"

export default function DashboardPage() {
  return (
    <div className="content-width space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="mono-label">dashboard</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight">
            Review meetings, active processing, and action-ready notes
          </h1>
        </div>
        <Link href="/app/meetings/new" className={buttonVariants({})}>
          New meeting
        </Link>
      </div>
      <div className="grid gap-4 md:grid-cols-[1fr_220px]">
        <Input
          aria-label="Search meetings"
          placeholder="Search by title or context"
        />
        <div className="flex gap-2 overflow-x-auto">
          {["All", "Processing", "Completed", "Failed"].map((label) => (
            <Badge
              key={label}
              variant={label === "Completed" ? "primary" : "default"}
            >
              {label}
            </Badge>
          ))}
        </div>
      </div>
      <div className="grid gap-4 xl:grid-cols-[1.3fr_0.7fr]">
        <Card>
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="mono-label">latest meeting</p>
              <h2 className="mt-2 text-xl font-semibold">
                {demoMeeting.title}
              </h2>
            </div>
            <Badge variant="secondary">Completed</Badge>
          </div>
          <div className="mt-4 grid gap-4 sm:grid-cols-3">
            <div className="rounded-lg border-2 border-border bg-background p-4">
              <p className="text-sm text-muted-foreground">Captured</p>
              <p className="mt-1 font-medium">
                {formatDateLabel(demoMeeting.createdAt)}
              </p>
            </div>
            <div className="rounded-lg border-2 border-border bg-background p-4">
              <p className="text-sm text-muted-foreground">Duration</p>
              <p className="mt-1 font-medium">
                {formatDuration(demoMeeting.durationSeconds)}
              </p>
            </div>
            <div className="rounded-lg border-2 border-border bg-background p-4">
              <p className="text-sm text-muted-foreground">Action items</p>
              <p className="mt-1 font-medium">
                {demoMeeting.actionItems.length}
              </p>
            </div>
          </div>
          <div className="mt-5 flex flex-wrap gap-2">
            <Link
              href={`/app/meetings/${demoMeeting.id}`}
              className={buttonVariants({ variant: "secondary" })}
            >
              Open workspace
              <ArrowUpRight className="h-4 w-4" />
            </Link>
            <Link href="/demo" className={buttonVariants({ variant: "ghost" })}>
              View fixture demo
            </Link>
          </div>
        </Card>
        <Card>
          <div className="flex items-center gap-2">
            <Search className="h-4 w-4 text-primary" />
            <h2 className="font-semibold">What the final data layer adds</h2>
          </div>
          <div className="mt-4 space-y-3 text-sm text-muted-foreground">
            <p>Private per-user meeting history.</p>
            <p>Search, filters, and empty states backed by Supabase queries.</p>
            <p>Retry and deletion wired through ownership checks.</p>
            <p>
              Polling while uploads, transcription, or summary jobs are active.
            </p>
          </div>
          <div className="mt-4 flex gap-2 rounded-lg border-2 border-dashed border-border bg-background px-3 py-3 text-sm">
            <AlertTriangle className="mt-0.5 h-4 w-4 text-accent" />
            <span>
              This scaffold intentionally keeps the dashboard functional before
              the authenticated query layer is connected.
            </span>
          </div>
        </Card>
      </div>
    </div>
  )
}
