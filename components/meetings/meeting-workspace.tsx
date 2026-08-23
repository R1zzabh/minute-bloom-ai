"use client"

import {
  AlertTriangle,
  CheckCircle2,
  Copy,
  Download,
  LoaderCircle,
  RotateCcw,
  Search,
  Trash2,
} from "lucide-react"
import { useEffect, useMemo, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import type { MeetingActionItem, MeetingRecord } from "@/types/meeting"
import { appConfig } from "@/lib/config"
import { ACTIVE_MEETING_STATUSES } from "@/lib/constants"
import {
  buildMeetingJsonExport,
  buildMeetingMarkdownExport,
  buildMeetingTextExport,
} from "@/lib/meetings/export"
import {
  cn,
  formatBytes,
  formatDateLabel,
  formatDuration,
  formatTimestamp,
} from "@/lib/utils"

const tabs = ["Overview", "Transcript", "Action Items", "Ask AI"] as const

type WorkspaceMode = "live" | "demo"

function buildDemoAnswer(question: string) {
  const normalized = question.toLowerCase()

  if (normalized.includes("scope") || normalized.includes("calendar")) {
    return {
      answer:
        "The team kept calendar integration out of scope so they could ship the workspace first.",
      citations: [
        {
          timestampSeconds: 52,
          supportingQuote:
            "Let's ship the workspace first and keep calendar integration out of scope.",
        },
      ],
    }
  }

  if (normalized.includes("owner") || normalized.includes("qa")) {
    return {
      answer:
        "Ownership for the QA checklist is still unresolved in this meeting.",
      citations: [
        {
          timestampSeconds: 18,
          supportingQuote:
            "The main blocker is still unclear ownership for the QA checklist.",
        },
      ],
    }
  }

  return {
    answer:
      "The answer is not explicitly present in this demo meeting. Try asking about scope, QA ownership, or Priya's follow-up.",
    citations: [],
  }
}

function statusVariant(status: MeetingRecord["status"]) {
  if (status === "completed") {
    return "primary" as const
  }

  if (status === "failed") {
    return "accent" as const
  }

  return "secondary" as const
}

export function MeetingWorkspace({
  meeting,
  initialAudioUrl = null,
  mode = "live",
}: {
  meeting: MeetingRecord
  initialAudioUrl?: string | null
  mode?: WorkspaceMode
}) {
  const router = useRouter()
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const [activeTab, setActiveTab] = useState<(typeof tabs)[number]>("Overview")
  const [transcriptQuery, setTranscriptQuery] = useState("")
  const [speakerFilter, setSpeakerFilter] = useState<string>("All speakers")
  const [actionQuery, setActionQuery] = useState("")
  const [meetingState, setMeetingState] = useState(meeting)
  const [draftActionItems, setDraftActionItems] = useState(meeting.actionItems)
  const [audioUrl, setAudioUrl] = useState<string | null>(
    initialAudioUrl ?? (mode === "live" ? null : "/api/demo-audio")
  )
  const [chatQuestion, setChatQuestion] = useState("")
  const [chatAnswer, setChatAnswer] = useState<{
    answer: string
    citations: Array<{
      timestampSeconds: number | null
      supportingQuote: string | null
    }>
  } | null>(null)
  const [chatPending, setChatPending] = useState(false)
  const [savingActionId, setSavingActionId] = useState<string | null>(null)
  const [retryPending, setRetryPending] = useState(false)
  const [deletePending, setDeletePending] = useState(false)
  const isLive = mode === "live"
  const isDemo = mode === "demo"
  const canEdit = mode !== "demo"

  useEffect(() => {
    if (!isLive) {
      return
    }

    let active = true

    async function refreshMeeting() {
      try {
        const response = await fetch(`/api/meetings/${meetingState.id}`, {
          cache: "no-store",
        })

        if (!response.ok) {
          return
        }

        const payload = (await response.json()) as {
          meeting: MeetingRecord
          audioUrl: string | null
        }

        if (!active) {
          return
        }

        setMeetingState(payload.meeting)
        setDraftActionItems(payload.meeting.actionItems)
        setAudioUrl(payload.audioUrl)
      } catch {
        // Keep the last good UI state if polling fails.
      }
    }

    void refreshMeeting()

    if (
      !ACTIVE_MEETING_STATUSES.includes(
        meetingState.status as (typeof ACTIVE_MEETING_STATUSES)[number]
      )
    ) {
      return () => {
        active = false
      }
    }

    const interval = window.setInterval(() => {
      void refreshMeeting()
    }, 2_000)

    return () => {
      active = false
      window.clearInterval(interval)
    }
  }, [isLive, meetingState.id, meetingState.status])

  const speakers = useMemo(() => {
    return Array.from(
      new Set(
        meetingState.transcriptSegments
          .map((segment) => segment.speaker)
          .filter((speaker): speaker is string => Boolean(speaker))
      )
    )
  }, [meetingState.transcriptSegments])

  const filteredTranscript = useMemo(() => {
    const query = transcriptQuery.trim().toLowerCase()

    return meetingState.transcriptSegments.filter((segment) => {
      const matchesSpeaker =
        speakerFilter === "All speakers" || segment.speaker === speakerFilter
      const matchesQuery =
        query.length === 0 ||
        `${segment.speaker ?? ""} ${segment.text}`.toLowerCase().includes(query)

      return matchesSpeaker && matchesQuery
    })
  }, [meetingState.transcriptSegments, speakerFilter, transcriptQuery])

  const filteredActionItems = useMemo(() => {
    const query = actionQuery.trim().toLowerCase()

    return draftActionItems.filter((item) =>
      query.length === 0
        ? true
        : `${item.task} ${item.owner ?? ""} ${item.priority} ${item.status}`
            .toLowerCase()
            .includes(query)
    )
  }, [actionQuery, draftActionItems])

  function updateDraftActionItem(
    actionItemId: string,
    patch: Partial<MeetingActionItem>
  ) {
    setDraftActionItems((current) =>
      current.map((item) =>
        item.id === actionItemId ? { ...item, ...patch } : item
      )
    )
  }

  async function saveActionItem(item: MeetingActionItem) {
    if (!canEdit) {
      return
    }

    setSavingActionId(item.id)

    try {
      const response = await fetch(
        `/api/meetings/${meetingState.id}/action-items/${item.id}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            task: item.task,
            owner: item.owner,
            dueDate: item.dueDate,
            priority: item.priority,
            status: item.status,
          }),
        }
      )

      if (!response.ok) {
        const payload = (await response.json()) as { error?: string }
        throw new Error(payload.error ?? "Unable to save action item.")
      }

      setMeetingState((current) => ({
        ...current,
        actionItems: draftActionItems,
      }))
      toast.success("Action item saved.")
      router.refresh()
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Unable to save action item."
      )
    } finally {
      setSavingActionId(null)
    }
  }

  function seekToTimestamp(seconds: number | null) {
    if (!audioRef.current || seconds === null) {
      return
    }

    audioRef.current.currentTime = seconds
    void audioRef.current.play().catch(() => {})
  }

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(
        buildMeetingMarkdownExport(meetingState)
      )
      toast.success("Meeting notes copied to the clipboard.")
    } catch {
      toast.error("Unable to copy the meeting notes.")
    }
  }

  async function handleExport(format: "markdown" | "text" | "json") {
    const fallbackExport =
      format === "json"
        ? buildMeetingJsonExport(meetingState)
        : format === "text"
          ? buildMeetingTextExport(meetingState)
          : buildMeetingMarkdownExport(meetingState)
    const mimeType =
      format === "json"
        ? "application/json"
        : format === "text"
          ? "text/plain;charset=utf-8"
          : "text/markdown;charset=utf-8"
    const url = isLive
      ? `/api/meetings/${meetingState.id}/export?format=${format}`
      : `data:${mimeType},${encodeURIComponent(fallbackExport)}`

    const anchor = document.createElement("a")
    anchor.href = url
    anchor.download =
      format === "markdown"
        ? `${meetingState.id}.md`
        : format === "json"
          ? `${meetingState.id}.json`
          : `${meetingState.id}.txt`
    anchor.click()
  }

  async function handleAsk(question = chatQuestion) {
    if (!question.trim()) {
      toast.error("Ask a question about this meeting first.")
      return
    }

    if (!isLive) {
      setChatAnswer(buildDemoAnswer(question))
      setChatQuestion(question)
      return
    }

    setChatPending(true)

    try {
      const response = await fetch(`/api/meetings/${meetingState.id}/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ question }),
      })

      const payload = (await response.json()) as {
        error?: string
        answer?: string
        citations?: Array<{
          timestampSeconds: number | null
          supportingQuote: string | null
        }>
      }

      if (!response.ok || !payload.answer) {
        throw new Error(payload.error ?? "Unable to answer that question.")
      }

      setChatAnswer({
        answer: payload.answer,
        citations: payload.citations ?? [],
      })
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Unable to answer that question."
      )
    } finally {
      setChatPending(false)
    }
  }

  async function handleRetry() {
    if (mode === "demo") {
      return
    }

    setRetryPending(true)

    try {
      const response = await fetch(`/api/meetings/${meetingState.id}/retry`, {
        method: "POST",
      })

      if (!response.ok) {
        const payload = (await response.json()) as { error?: string }
        throw new Error(payload.error ?? "Unable to retry the meeting.")
      }

      toast.success("Retry queued.")
      router.refresh()
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Unable to retry the meeting."
      )
    } finally {
      setRetryPending(false)
    }
  }

  async function handleDelete() {
    if (mode === "demo") {
      return
    }

    if (!window.confirm("Delete this meeting and its private audio file?")) {
      return
    }

    setDeletePending(true)

    try {
      const response = await fetch(`/api/meetings/${meetingState.id}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        const payload = (await response.json()) as { error?: string }
        throw new Error(payload.error ?? "Unable to delete the meeting.")
      }

      toast.success("Meeting deleted.")
      router.push("/app")
      router.refresh()
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Unable to delete the meeting."
      )
    } finally {
      setDeletePending(false)
    }
  }

  return (
    <div className="space-y-6">
      {isDemo ? (
        <Card className="border-accent bg-accent/40 py-4">
          <p className="text-sm">
            This is a deterministic public fixture. It mirrors the product UI
            without calling live transcription or summarization services.
          </p>
        </Card>
      ) : null}
      <div className="grid gap-5 lg:grid-cols-[1.2fr_0.8fr]">
        <Card className="space-y-4">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant={statusVariant(meetingState.status)}>
                  {meetingState.status}
                </Badge>
                <Badge>{formatDuration(meetingState.durationSeconds)}</Badge>
                <Badge>{formatBytes(meetingState.sizeBytes)}</Badge>
              </div>
              <div>
                <h1 className="text-2xl font-semibold tracking-tight">
                  {meetingState.title}
                </h1>
                <p className="mt-1 text-sm text-muted-foreground">
                  Created {formatDateLabel(meetingState.createdAt)} ·{" "}
                  {meetingState.originalFileName}
                </p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button variant="ghost" size="sm" onClick={handleCopy}>
                <Copy className="h-4 w-4" />
                Copy
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => handleExport("markdown")}
              >
                <Download className="h-4 w-4" />
                Export
              </Button>
              {meetingState.status === "failed" && canEdit ? (
                <Button
                  variant="secondary"
                  size="sm"
                  disabled={retryPending}
                  onClick={handleRetry}
                >
                  <RotateCcw className="h-4 w-4" />
                  {retryPending ? "Retrying..." : "Retry"}
                </Button>
              ) : null}
              {canEdit ? (
                <Button
                  variant="destructive"
                  size="sm"
                  disabled={deletePending}
                  onClick={handleDelete}
                >
                  <Trash2 className="h-4 w-4" />
                  {deletePending ? "Deleting..." : "Delete"}
                </Button>
              ) : null}
            </div>
          </div>

          <div className="rounded-lg border-2 border-border bg-background p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="mono-label">audio player</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Click any transcript timestamp to seek the player.
                </p>
              </div>
              <Badge variant="secondary">HTML audio</Badge>
            </div>
            <audio
              ref={audioRef}
              className="mt-4 w-full"
              controls
              preload="metadata"
              src={audioUrl ?? undefined}
            />
          </div>

          <div className="flex gap-2 overflow-x-auto pb-2">
            {tabs.map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveTab(tab)}
                className={cn(
                  "pressable rounded-lg border-2 border-border px-4 py-2 text-sm font-medium shadow-[var(--shadow-xs)]",
                  activeTab === tab
                    ? "bg-primary text-primary-foreground"
                    : "bg-card text-card-foreground"
                )}
              >
                {tab}
              </button>
            ))}
          </div>

          {activeTab === "Overview" ? (
            <div className="grid gap-4 md:grid-cols-2">
              <Card className="md:col-span-2">
                <p className="mono-label">executive summary</p>
                <p className="mt-3 text-sm leading-7 text-muted-foreground">
                  {meetingState.summary?.executiveSummary ??
                    "No summary is available yet."}
                </p>
              </Card>
              <Card>
                <h2 className="text-base font-semibold">Key topics</h2>
                <div className="mt-4 space-y-3">
                  {meetingState.summary?.keyTopics.length ? (
                    meetingState.summary.keyTopics.map((topic) => (
                      <div key={topic.topic}>
                        <p className="text-sm font-medium">{topic.topic}</p>
                        <p className="mt-1 text-sm text-muted-foreground">
                          {topic.detail}
                        </p>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      No key topics available yet.
                    </p>
                  )}
                </div>
              </Card>
              <Card>
                <h2 className="text-base font-semibold">Decisions</h2>
                <div className="mt-4 space-y-3">
                  {meetingState.summary?.decisions.length ? (
                    meetingState.summary.decisions.map((item) => (
                      <div key={`${item.decision}-${item.timestampSeconds}`}>
                        <p className="text-sm font-medium">{item.decision}</p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {item.rationale ?? "No rationale recorded"} ·{" "}
                          {formatTimestamp(item.timestampSeconds)}
                        </p>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      No decisions available yet.
                    </p>
                  )}
                </div>
              </Card>
              <Card>
                <h2 className="text-base font-semibold">Blockers</h2>
                <div className="mt-4 space-y-2">
                  {meetingState.summary?.blockers.length ? (
                    meetingState.summary.blockers.map((blocker) => (
                      <div key={blocker} className="flex gap-2 text-sm">
                        <AlertTriangle className="mt-1 h-4 w-4 text-accent" />
                        <span>{blocker}</span>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      No blockers recorded.
                    </p>
                  )}
                </div>
              </Card>
              <Card>
                <h2 className="text-base font-semibold">Open questions</h2>
                <div className="mt-4 space-y-2">
                  {meetingState.summary?.openQuestions.length ? (
                    meetingState.summary.openQuestions.map((question) => (
                      <div key={question} className="flex gap-2 text-sm">
                        <Search className="mt-1 h-4 w-4 text-primary" />
                        <span>{question}</span>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      No open questions recorded.
                    </p>
                  )}
                </div>
              </Card>
            </div>
          ) : null}

          {activeTab === "Transcript" ? (
            <div className="space-y-4">
              <Input
                aria-label="Search transcript"
                value={transcriptQuery}
                onChange={(event) => setTranscriptQuery(event.target.value)}
                placeholder="Search by speaker, phrase, or keyword"
              />
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setSpeakerFilter("All speakers")}
                  className={cn(
                    "pressable rounded-md border-2 border-border px-3 py-2 text-xs shadow-[var(--shadow-xs)]",
                    speakerFilter === "All speakers"
                      ? "bg-primary text-primary-foreground"
                      : "bg-card"
                  )}
                >
                  All speakers
                </button>
                {speakers.map((speaker) => (
                  <button
                    key={speaker}
                    type="button"
                    onClick={() => setSpeakerFilter(speaker)}
                    className={cn(
                      "pressable rounded-md border-2 border-border px-3 py-2 text-xs shadow-[var(--shadow-xs)]",
                      speakerFilter === speaker
                        ? "bg-primary text-primary-foreground"
                        : "bg-card"
                    )}
                  >
                    {speaker}
                  </button>
                ))}
              </div>
              <div className="space-y-3">
                {filteredTranscript.map((segment) => (
                  <Card key={segment.id} className="p-4">
                    <div className="flex items-center justify-between gap-3">
                      <button
                        type="button"
                        onClick={() => seekToTimestamp(segment.startSeconds)}
                        className="font-mono text-xs text-primary underline-offset-4 hover:underline"
                      >
                        {formatTimestamp(segment.startSeconds)}
                      </button>
                      <Badge>{segment.speaker ?? "Unknown speaker"}</Badge>
                    </div>
                    <p className="mt-3 text-sm leading-7">{segment.text}</p>
                  </Card>
                ))}
                {filteredTranscript.length === 0 ? (
                  <Card>
                    <p className="text-sm text-muted-foreground">
                      No transcript segments match the current search and
                      speaker filters.
                    </p>
                  </Card>
                ) : null}
              </div>
            </div>
          ) : null}

          {activeTab === "Action Items" ? (
            <div className="space-y-4">
              <Input
                aria-label="Search action items"
                value={actionQuery}
                onChange={(event) => setActionQuery(event.target.value)}
                placeholder="Search task, owner, or priority"
              />
              <div className="space-y-3">
                {filteredActionItems.map((item) => (
                  <Card key={item.id} className="p-4">
                    <div className="grid gap-4 lg:grid-cols-[1fr_168px]">
                      <div className="space-y-3">
                        <div className="flex items-start gap-3">
                          <CheckCircle2
                            className={cn(
                              "mt-1 h-4 w-4 shrink-0",
                              item.status === "done"
                                ? "text-primary"
                                : "text-muted-foreground"
                            )}
                          />
                          <div className="flex-1 space-y-3">
                            <Input
                              aria-label={`Task for ${item.id}`}
                              value={item.task}
                              disabled={!canEdit}
                              onChange={(event) =>
                                updateDraftActionItem(item.id, {
                                  task: event.target.value,
                                })
                              }
                            />
                            <div className="grid gap-3 md:grid-cols-2">
                              <Input
                                aria-label={`Owner for ${item.id}`}
                                value={item.owner ?? ""}
                                disabled={!canEdit}
                                onChange={(event) =>
                                  updateDraftActionItem(item.id, {
                                    owner: event.target.value || null,
                                  })
                                }
                                placeholder="Owner"
                              />
                              <Input
                                aria-label={`Due date for ${item.id}`}
                                type="date"
                                value={item.dueDate ?? ""}
                                disabled={!canEdit}
                                onChange={(event) =>
                                  updateDraftActionItem(item.id, {
                                    dueDate: event.target.value || null,
                                  })
                                }
                              />
                            </div>
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <Badge
                            variant={item.isInferred ? "accent" : "secondary"}
                          >
                            {item.isInferred ? "Inferred" : "Explicit"}
                          </Badge>
                          {item.sourceTimestampSeconds !== null ? (
                            <button
                              type="button"
                              onClick={() =>
                                seekToTimestamp(item.sourceTimestampSeconds)
                              }
                              className="font-mono text-xs text-primary underline-offset-4 hover:underline"
                            >
                              {formatTimestamp(item.sourceTimestampSeconds)}
                            </button>
                          ) : null}
                        </div>
                      </div>
                      <div className="space-y-3">
                        <label className="block text-xs font-medium text-muted-foreground uppercase">
                          Priority
                          <select
                            className="mt-2 flex h-11 w-full rounded-lg border-2 border-input bg-background px-3 py-2 text-sm shadow-[var(--shadow-xs)]"
                            value={item.priority}
                            disabled={!canEdit}
                            onChange={(event) =>
                              updateDraftActionItem(item.id, {
                                priority: event.target
                                  .value as MeetingActionItem["priority"],
                              })
                            }
                          >
                            <option value="low">low</option>
                            <option value="medium">medium</option>
                            <option value="high">high</option>
                          </select>
                        </label>
                        <label className="block text-xs font-medium text-muted-foreground uppercase">
                          Status
                          <select
                            className="mt-2 flex h-11 w-full rounded-lg border-2 border-input bg-background px-3 py-2 text-sm shadow-[var(--shadow-xs)]"
                            value={item.status}
                            disabled={!canEdit}
                            onChange={(event) =>
                              updateDraftActionItem(item.id, {
                                status: event.target
                                  .value as MeetingActionItem["status"],
                              })
                            }
                          >
                            <option value="open">open</option>
                            <option value="in_progress">in progress</option>
                            <option value="done">done</option>
                          </select>
                        </label>
                        {canEdit ? (
                          <Button
                            type="button"
                            variant="secondary"
                            disabled={savingActionId === item.id}
                            onClick={() => saveActionItem(item)}
                          >
                            {savingActionId === item.id ? (
                              <>
                                <LoaderCircle className="h-4 w-4 animate-spin" />
                                Saving...
                              </>
                            ) : (
                              "Save"
                            )}
                          </Button>
                        ) : null}
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          ) : null}

          {activeTab === "Ask AI" ? (
            <div className="grid gap-4 lg:grid-cols-[0.8fr_1.2fr]">
              <Card>
                <p className="mono-label">suggested prompts</p>
                <div className="mt-3 space-y-2">
                  {appConfig.suggestedQuestions.map((question) => (
                    <button
                      key={question}
                      type="button"
                      onClick={() => {
                        setChatQuestion(question)
                        void handleAsk(question)
                      }}
                      className="w-full rounded-lg border-2 border-border bg-background px-3 py-3 text-left text-sm hover:bg-muted"
                    >
                      {question}
                    </button>
                  ))}
                </div>
              </Card>
              <Card>
                <p className="mono-label">grounded answer</p>
                <div className="mt-3 space-y-3">
                  <Input
                    aria-label="Ask AI question"
                    value={chatQuestion}
                    onChange={(event) => setChatQuestion(event.target.value)}
                    placeholder="Ask about a decision, blocker, or assignment"
                  />
                  <Button
                    type="button"
                    disabled={chatPending}
                    onClick={() => void handleAsk()}
                  >
                    {chatPending ? (
                      <>
                        <LoaderCircle className="h-4 w-4 animate-spin" />
                        Asking...
                      </>
                    ) : (
                      "Ask MinuteBloom"
                    )}
                  </Button>
                  <div className="rounded-lg border-2 border-border bg-background p-4">
                    <p className="text-sm leading-7 text-muted-foreground">
                      {chatAnswer?.answer ??
                        "Ask a grounded question about this meeting to get an answer scoped only to its transcript and summary."}
                    </p>
                    {chatAnswer?.citations.length ? (
                      <div className="mt-4 space-y-2">
                        {chatAnswer.citations.map((citation, index) => (
                          <div
                            key={`${citation.timestampSeconds}-${index}`}
                            className="rounded-lg border-2 border-border px-3 py-3 text-sm"
                          >
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() =>
                                  seekToTimestamp(citation.timestampSeconds)
                                }
                                className="font-mono text-xs text-primary underline-offset-4 hover:underline"
                              >
                                {formatTimestamp(citation.timestampSeconds)}
                              </button>
                            </div>
                            {citation.supportingQuote ? (
                              <p className="mt-2 text-muted-foreground">
                                {citation.supportingQuote}
                              </p>
                            ) : null}
                          </div>
                        ))}
                      </div>
                    ) : null}
                  </div>
                </div>
              </Card>
            </div>
          ) : null}
        </Card>

        <div className="space-y-5">
          <Card>
            <p className="mono-label">meeting health</p>
            <div className="mt-4 space-y-3 text-sm text-muted-foreground">
              <p>Language: {meetingState.language}</p>
              <p>Status: {meetingState.status}</p>
              <p>
                Transcript segments: {meetingState.transcriptSegments.length}
              </p>
              <p>Action items: {meetingState.actionItems.length}</p>
            </div>
          </Card>
          <Card>
            <p className="mono-label">exports</p>
            <div className="mt-4 grid gap-2">
              <Button
                type="button"
                variant="secondary"
                onClick={() => handleExport("markdown")}
              >
                Download Markdown
              </Button>
              <Button
                type="button"
                variant="secondary"
                onClick={() => handleExport("text")}
              >
                Download Text
              </Button>
              <Button
                type="button"
                variant="secondary"
                onClick={() => handleExport("json")}
              >
                Download JSON
              </Button>
            </div>
          </Card>
          <Card>
            <p className="mono-label">what ships today</p>
            <div className="mt-4 space-y-3 text-sm text-muted-foreground">
              <p>Private uploads with explicit 25 MB validation.</p>
              <p>
                Speaker-aware transcript rendering with timestamp navigation.
              </p>
              <p>
                Searchable notes, exports, retry states, and grounded follow-up.
              </p>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
