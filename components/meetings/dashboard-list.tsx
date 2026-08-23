"use client"

import Link from "next/link"
import { AlertTriangle, Clock3, Search, Trash2 } from "lucide-react"
import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

import { Badge } from "@/components/ui/badge"
import { Button, buttonVariants } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import type { MeetingRecord } from "@/types/meeting"
import {
  ACTIVE_MEETING_STATUSES,
  TERMINAL_MEETING_STATUSES,
} from "@/lib/constants"
import { cn, formatDateLabel, formatDuration } from "@/lib/utils"

const filters = ["All", "Processing", "Completed", "Failed"] as const

export function DashboardList({
  initialMeetings,
}: {
  initialMeetings: MeetingRecord[]
}) {
  const router = useRouter()
  const [query, setQuery] = useState("")
  const [filter, setFilter] = useState<(typeof filters)[number]>("All")
  const [deletingId, setDeletingId] = useState<string | null>(null)

  useEffect(() => {
    if (
      !initialMeetings.some((meeting) =>
        ACTIVE_MEETING_STATUSES.includes(
          meeting.status as (typeof ACTIVE_MEETING_STATUSES)[number]
        )
      )
    ) {
      return
    }

    const interval = window.setInterval(() => {
      router.refresh()
    }, 2_000)

    return () => window.clearInterval(interval)
  }, [initialMeetings, router])

  const meetings = useMemo(() => {
    const normalized = query.trim().toLowerCase()

    return initialMeetings.filter((meeting) => {
      const matchesQuery =
        normalized.length === 0 ||
        `${meeting.title} ${meeting.description ?? ""}`
          .toLowerCase()
          .includes(normalized)

      const matchesFilter =
        filter === "All"
          ? true
          : filter === "Processing"
            ? ACTIVE_MEETING_STATUSES.includes(
                meeting.status as (typeof ACTIVE_MEETING_STATUSES)[number]
              )
            : filter === "Completed"
              ? meeting.status === "completed"
              : meeting.status === "failed"

      return matchesQuery && matchesFilter
    })
  }, [filter, initialMeetings, query])

  async function handleDelete(meetingId: string) {
    if (!window.confirm("Delete this meeting and its private audio file?")) {
      return
    }

    setDeletingId(meetingId)

    try {
      const response = await fetch(`/api/meetings/${meetingId}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        const payload = (await response.json()) as { error?: string }
        throw new Error(payload.error ?? "Unable to delete meeting.")
      }

      toast.success("Meeting deleted.")
      router.refresh()
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Unable to delete meeting."
      )
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div className="space-y-6">
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

      <div className="grid gap-4 md:grid-cols-[1fr_auto]">
        <div className="relative">
          <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            aria-label="Search meetings"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            className="pl-10"
            placeholder="Search by title or context"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          {filters.map((label) => (
            <button
              key={label}
              type="button"
              onClick={() => setFilter(label)}
              className={cn(
                "pressable rounded-md border-2 border-border px-3 py-2 font-mono text-[11px] tracking-[0.22em] uppercase shadow-[var(--shadow-xs)]",
                filter === label
                  ? "bg-primary text-primary-foreground"
                  : "bg-card text-card-foreground"
              )}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {initialMeetings.length === 0 ? (
        <Card className="text-center">
          <p className="mono-label">first run</p>
          <h2 className="mt-3 text-2xl font-semibold tracking-tight">
            No meetings yet
          </h2>
          <p className="mt-3 text-sm leading-7 text-muted-foreground">
            Upload a recording to create your first transcript, summary, and
            action plan.
          </p>
        </Card>
      ) : null}

      {initialMeetings.length > 0 && meetings.length === 0 ? (
        <Card className="text-center">
          <p className="mono-label">no results</p>
          <p className="mt-3 text-sm leading-7 text-muted-foreground">
            No meetings match the current search and filter combination.
          </p>
        </Card>
      ) : null}

      <div className="grid gap-4">
        {meetings.map((meeting) => {
          const isActive = ACTIVE_MEETING_STATUSES.includes(
            meeting.status as (typeof ACTIVE_MEETING_STATUSES)[number]
          )
          const isTerminal = TERMINAL_MEETING_STATUSES.includes(
            meeting.status as (typeof TERMINAL_MEETING_STATUSES)[number]
          )

          return (
            <Card key={meeting.id}>
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="space-y-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge
                      variant={
                        meeting.status === "completed"
                          ? "primary"
                          : meeting.status === "failed"
                            ? "accent"
                            : "secondary"
                      }
                    >
                      {meeting.status}
                    </Badge>
                    <Badge>{formatDuration(meeting.durationSeconds)}</Badge>
                    <Badge>{meeting.actionItems.length} tasks</Badge>
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold tracking-tight">
                      {meeting.title}
                    </h2>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {formatDateLabel(meeting.createdAt)}
                      {meeting.description ? ` · ${meeting.description}` : ""}
                    </p>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-3">
                    <div className="rounded-lg border-2 border-border bg-background px-3 py-3">
                      <p className="text-xs text-muted-foreground uppercase">
                        Status
                      </p>
                      <p className="mt-1 text-sm font-medium">
                        {meeting.status}
                      </p>
                    </div>
                    <div className="rounded-lg border-2 border-border bg-background px-3 py-3">
                      <p className="text-xs text-muted-foreground uppercase">
                        Duration
                      </p>
                      <p className="mt-1 text-sm font-medium">
                        {formatDuration(meeting.durationSeconds)}
                      </p>
                    </div>
                    <div className="rounded-lg border-2 border-border bg-background px-3 py-3">
                      <p className="text-xs text-muted-foreground uppercase">
                        Action items
                      </p>
                      <p className="mt-1 text-sm font-medium">
                        {meeting.actionItems.length}
                      </p>
                    </div>
                  </div>
                  {meeting.processingError ? (
                    <div className="flex gap-2 rounded-lg border-2 border-border bg-accent/40 px-3 py-3 text-sm">
                      <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-accent-foreground" />
                      <span>{meeting.processingError}</span>
                    </div>
                  ) : null}
                </div>
                <div className="flex flex-wrap gap-2">
                  <Link
                    href={`/app/meetings/${meeting.id}`}
                    className={buttonVariants({ variant: "secondary" })}
                  >
                    Open workspace
                  </Link>
                  <Button
                    type="button"
                    variant="destructive"
                    disabled={deletingId === meeting.id}
                    onClick={() => handleDelete(meeting.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                    {deletingId === meeting.id ? "Deleting..." : "Delete"}
                  </Button>
                </div>
              </div>
              <div className="mt-5 flex items-center gap-2 text-sm text-muted-foreground">
                <Clock3 className="h-4 w-4" />
                <span>
                  {isActive
                    ? `Processing is active at ${meeting.progress}%`
                    : isTerminal
                      ? "Ready for export, editing, and grounded follow-up."
                      : "Waiting for upload completion."}
                </span>
              </div>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
