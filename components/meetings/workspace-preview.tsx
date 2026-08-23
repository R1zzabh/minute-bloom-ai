import { CheckCircle2, Clock3, Search } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import { demoMeeting } from "@/fixtures/demo-meeting"
import { appConfig } from "@/lib/config"
import {
  cn,
  formatBytes,
  formatDateLabel,
  formatDuration,
  formatTimestamp,
} from "@/lib/utils"

function WaveBar({ height }: { height: string }) {
  return <div className="w-2 rounded-full bg-primary/70" style={{ height }} />
}

export function WorkspacePreview({ compact = false }: { compact?: boolean }) {
  return (
    <Card className="grid-pattern overflow-hidden p-0">
      <div className="grid gap-0 lg:grid-cols-[1.15fr_0.85fr]">
        <div className="border-b-2 border-border p-5 lg:border-r-2 lg:border-b-0 lg:p-6">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="mono-label">workspace preview</p>
              <h3 className="mt-1 text-lg font-semibold">
                {demoMeeting.title}
              </h3>
            </div>
            <Badge variant="secondary">timestamped</Badge>
          </div>
          <div className="surface-card bg-background/90 p-4">
            <div className="flex items-center justify-between gap-3 border-b-2 border-border pb-3">
              <div>
                <p className="mono-label">recording</p>
                <p className="mt-1 text-sm font-medium">
                  {demoMeeting.originalFileName}
                </p>
              </div>
              <div className="text-right text-xs text-muted-foreground">
                <p>{formatBytes(demoMeeting.sizeBytes)}</p>
                <p>{formatDuration(demoMeeting.durationSeconds)}</p>
              </div>
            </div>
            <div className="mt-4 flex items-end gap-1">
              {["40%", "58%", "32%", "65%", "45%", "72%", "50%", "34%"].map(
                (height, index) => (
                  <WaveBar key={`${height}-${index}`} height={height} />
                )
              )}
            </div>
            <div className="mt-5 flex items-center gap-2 rounded-lg border-2 border-dashed border-border px-3 py-2">
              <Search className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">
                Search transcript or jump to a timestamp
              </span>
            </div>
            <div className="mt-4 space-y-3">
              {demoMeeting.transcriptSegments
                .slice(0, compact ? 3 : 4)
                .map((segment) => (
                  <div
                    key={segment.id}
                    className="rounded-lg border-2 border-border bg-card px-3 py-2"
                  >
                    <div className="mb-1 flex items-center justify-between gap-3">
                      <span className="font-mono text-xs text-muted-foreground">
                        {formatTimestamp(segment.startSeconds)}
                      </span>
                      {segment.speaker ? (
                        <span className="text-xs font-medium text-primary">
                          {segment.speaker}
                        </span>
                      ) : null}
                    </div>
                    <p className="text-sm leading-6">{segment.text}</p>
                  </div>
                ))}
            </div>
          </div>
        </div>
        <div className="space-y-4 p-5 lg:p-6">
          <div className="surface-card bg-card/90 p-4">
            <div className="mb-3 flex items-center justify-between gap-3">
              <div>
                <p className="mono-label">executive summary</p>
                <p className="mt-1 text-sm leading-6 text-muted-foreground">
                  {demoMeeting.summary?.executiveSummary}
                </p>
              </div>
              <Clock3 className="h-5 w-5 text-primary" />
            </div>
          </div>
          <div className="surface-card bg-card/90 p-4">
            <div className="mb-3 flex items-center justify-between gap-3">
              <h4 className="text-sm font-semibold">Action items</h4>
              <Badge variant="accent">
                {demoMeeting.actionItems.length} ready
              </Badge>
            </div>
            <div className="space-y-3">
              {demoMeeting.actionItems.map((item) => (
                <div
                  key={item.id}
                  className="rounded-lg border-2 border-border bg-background px-3 py-3"
                >
                  <div className="flex items-start gap-3">
                    <CheckCircle2
                      className={cn(
                        "mt-1 h-4 w-4 shrink-0",
                        item.status === "done"
                          ? "text-primary"
                          : "text-muted-foreground"
                      )}
                    />
                    <div className="space-y-1">
                      <p className="text-sm font-medium">{item.task}</p>
                      <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                        <span>{item.owner ?? "Unassigned"}</span>
                        <span>
                          {item.dueDate
                            ? formatDateLabel(item.dueDate)
                            : "No due date"}
                        </span>
                        <span className="uppercase">{item.priority}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="surface-card bg-secondary/50 p-4">
            <p className="mono-label">ask ai</p>
            <p className="mt-1 text-sm leading-6 text-foreground">
              {appConfig.suggestedQuestions[0]}
            </p>
          </div>
        </div>
      </div>
    </Card>
  )
}
