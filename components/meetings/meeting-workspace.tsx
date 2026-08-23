"use client"

import {
  AlertTriangle,
  CheckCircle2,
  Copy,
  Download,
  Search,
} from "lucide-react"
import { useMemo, useState } from "react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import type { MeetingRecord } from "@/types/meeting"
import {
  cn,
  formatBytes,
  formatDateLabel,
  formatDuration,
  formatTimestamp,
} from "@/lib/utils"

const tabs = ["Overview", "Transcript", "Action Items", "Ask AI"] as const

export function MeetingWorkspace({
  meeting,
  isDemo = false,
}: {
  meeting: MeetingRecord
  isDemo?: boolean
}) {
  const [activeTab, setActiveTab] = useState<(typeof tabs)[number]>("Overview")
  const [transcriptQuery, setTranscriptQuery] = useState("")
  const [actionQuery, setActionQuery] = useState("")

  const filteredTranscript = useMemo(() => {
    const query = transcriptQuery.trim().toLowerCase()
    if (!query) {
      return meeting.transcriptSegments
    }

    return meeting.transcriptSegments.filter((segment) =>
      `${segment.speaker ?? ""} ${segment.text}`.toLowerCase().includes(query)
    )
  }, [meeting.transcriptSegments, transcriptQuery])

  const filteredActionItems = useMemo(() => {
    const query = actionQuery.trim().toLowerCase()
    if (!query) {
      return meeting.actionItems
    }

    return meeting.actionItems.filter((item) =>
      `${item.task} ${item.owner ?? ""} ${item.priority}`
        .toLowerCase()
        .includes(query)
    )
  }, [actionQuery, meeting.actionItems])

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
                <Badge variant="primary">{meeting.status}</Badge>
                <Badge>{formatDuration(meeting.durationSeconds)}</Badge>
                <Badge>{formatBytes(meeting.sizeBytes)}</Badge>
              </div>
              <div>
                <h1 className="text-2xl font-semibold tracking-tight">
                  {meeting.title}
                </h1>
                <p className="mt-1 text-sm text-muted-foreground">
                  Created {formatDateLabel(meeting.createdAt)} ·{" "}
                  {meeting.originalFileName}
                </p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button variant="ghost" size="sm">
                <Copy className="h-4 w-4" />
                Copy
              </Button>
              <Button variant="secondary" size="sm">
                <Download className="h-4 w-4" />
                Export
              </Button>
            </div>
          </div>
          <div className="rounded-lg border-2 border-border bg-background p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="mono-label">audio player</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Sticky player and transcript seeking are wired into the final
                  meeting detail experience.
                </p>
              </div>
              <Badge variant="secondary">HTML audio</Badge>
            </div>
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
                  {meeting.summary?.executiveSummary}
                </p>
              </Card>
              <Card>
                <h2 className="text-base font-semibold">Key topics</h2>
                <div className="mt-4 space-y-3">
                  {meeting.summary?.keyTopics.map((topic) => (
                    <div key={topic.topic}>
                      <p className="text-sm font-medium">{topic.topic}</p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {topic.detail}
                      </p>
                    </div>
                  ))}
                </div>
              </Card>
              <Card>
                <h2 className="text-base font-semibold">Decisions</h2>
                <div className="mt-4 space-y-3">
                  {meeting.summary?.decisions.map((item) => (
                    <div key={item.decision}>
                      <p className="text-sm font-medium">{item.decision}</p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {item.rationale ?? "No rationale recorded"} ·{" "}
                        {formatTimestamp(item.timestampSeconds)}
                      </p>
                    </div>
                  ))}
                </div>
              </Card>
              <Card>
                <h2 className="text-base font-semibold">Blockers</h2>
                <div className="mt-4 space-y-2">
                  {meeting.summary?.blockers.map((blocker) => (
                    <div key={blocker} className="flex gap-2 text-sm">
                      <AlertTriangle className="mt-1 h-4 w-4 text-accent" />
                      <span>{blocker}</span>
                    </div>
                  ))}
                </div>
              </Card>
              <Card>
                <h2 className="text-base font-semibold">Open questions</h2>
                <div className="mt-4 space-y-2">
                  {meeting.summary?.openQuestions.map((question) => (
                    <div key={question} className="flex gap-2 text-sm">
                      <Search className="mt-1 h-4 w-4 text-primary" />
                      <span>{question}</span>
                    </div>
                  ))}
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
              <div className="space-y-3">
                {filteredTranscript.map((segment) => (
                  <Card key={segment.id} className="p-4">
                    <div className="flex items-center justify-between gap-3">
                      <button
                        type="button"
                        className="font-mono text-xs text-primary underline-offset-4 hover:underline"
                      >
                        {formatTimestamp(segment.startSeconds)}
                      </button>
                      <Badge>{segment.speaker ?? "Unknown speaker"}</Badge>
                    </div>
                    <p className="mt-3 text-sm leading-7">{segment.text}</p>
                  </Card>
                ))}
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
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="flex gap-3">
                        <CheckCircle2
                          className={cn(
                            "mt-1 h-4 w-4 shrink-0",
                            item.status === "done"
                              ? "text-primary"
                              : "text-muted-foreground"
                          )}
                        />
                        <div>
                          <p className="text-sm font-medium">{item.task}</p>
                          <div className="mt-1 flex flex-wrap gap-2 text-xs text-muted-foreground">
                            <span>{item.owner ?? "Unassigned"}</span>
                            <span>
                              {item.dueDate
                                ? formatDateLabel(item.dueDate)
                                : "No due date"}
                            </span>
                            <span className="uppercase">{item.priority}</span>
                            <span>{item.status.replace("_", " ")}</span>
                          </div>
                        </div>
                      </div>
                      <Badge variant={item.isInferred ? "accent" : "secondary"}>
                        {item.isInferred ? "Inferred" : "Explicit"}
                      </Badge>
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
                  {[
                    "What did the team decide about scope?",
                    "Which task still has no owner?",
                    "Where was the upload risk mentioned?",
                  ].map((question) => (
                    <button
                      key={question}
                      type="button"
                      className="w-full rounded-lg border-2 border-border bg-background px-3 py-3 text-left text-sm hover:bg-muted"
                    >
                      {question}
                    </button>
                  ))}
                </div>
              </Card>
              <Card>
                <p className="mono-label">grounded answer</p>
                <p className="mt-3 text-sm leading-7 text-muted-foreground">
                  Calendar integration was explicitly kept out of scope in favor
                  of shipping the workspace first. The decision appears at{" "}
                  <span className="font-mono text-foreground">00:52</span>.
                </p>
              </Card>
            </div>
          ) : null}
        </Card>
        <div className="space-y-5">
          <Card>
            <p className="mono-label">meeting health</p>
            <div className="mt-4 space-y-3 text-sm text-muted-foreground">
              <p>Language: {meeting.language}</p>
              <p>Status: {meeting.status}</p>
              <p>Transcript segments: {meeting.transcriptSegments.length}</p>
              <p>Action items: {meeting.actionItems.length}</p>
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
