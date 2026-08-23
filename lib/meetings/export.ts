import type { MeetingRecord } from "@/types/meeting"
import { formatTimestamp } from "@/lib/utils"

export function buildMeetingMarkdownExport(meeting: MeetingRecord) {
  const summary = meeting.summary
  const transcript = meeting.transcriptSegments
    .map(
      (segment) =>
        `- [${formatTimestamp(segment.startSeconds)}] ${segment.speaker ?? "Speaker"}: ${segment.text}`
    )
    .join("\n")

  const actionItems = meeting.actionItems
    .map(
      (item) =>
        `- ${item.task} (${item.owner ?? "Unassigned"} · ${item.priority} · ${item.status})`
    )
    .join("\n")

  return `# ${meeting.title}

## Executive summary
${summary?.executiveSummary ?? "No summary available."}

## Decisions
${summary?.decisions.map((item) => `- ${item.decision}`).join("\n") ?? "- None"}

## Action items
${actionItems || "- None"}

## Transcript
${transcript || "- Transcript unavailable"}
`
}

export function buildMeetingTextExport(meeting: MeetingRecord) {
  return [
    meeting.title,
    "",
    `Executive summary: ${meeting.summary?.executiveSummary ?? "No summary available."}`,
    "",
    "Action items:",
    ...meeting.actionItems.map(
      (item) =>
        `- ${item.task} | ${item.owner ?? "Unassigned"} | ${item.priority} | ${item.status}`
    ),
  ].join("\n")
}

export function buildMeetingJsonExport(meeting: MeetingRecord) {
  return JSON.stringify(meeting, null, 2)
}
