import type { MeetingRecord } from "@/types/meeting"
import { formatTimestamp } from "@/lib/utils"

const CONTROL_CHARACTER_PATTERN =
  /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g

function sanitizeExportText(value: string | null | undefined) {
  return (value ?? "")
    .replace(/\r\n?/g, "\n")
    .replace(CONTROL_CHARACTER_PATTERN, "")
}

function formatBulletList(items: string[]) {
  return items.length > 0 ? items.join("\n") : "- None"
}

export function buildMeetingMarkdownExport(meeting: MeetingRecord) {
  const summary = meeting.summary
  const transcript = meeting.transcriptSegments.map(
    (segment) =>
      `- [${formatTimestamp(segment.startSeconds)}] ${sanitizeExportText(segment.speaker) || "Speaker"}: ${sanitizeExportText(segment.text)}`
  )
  const decisions = (summary?.decisions ?? []).map(
    (item) => `- ${sanitizeExportText(item.decision)}`
  )
  const actionItems = meeting.actionItems.map(
    (item) =>
      `- ${sanitizeExportText(item.task)} (${sanitizeExportText(item.owner) || "Unassigned"} · ${item.priority} · ${item.status})`
  )

  return `# ${sanitizeExportText(meeting.title)}

## Executive summary
${sanitizeExportText(summary?.executiveSummary) || "No summary available."}

## Decisions
${formatBulletList(decisions)}

## Action items
${formatBulletList(actionItems)}

## Transcript
${transcript.length > 0 ? transcript.join("\n") : "- Transcript unavailable"}
`
}

export function buildMeetingTextExport(meeting: MeetingRecord) {
  const summary = meeting.summary
  const decisionLines = (summary?.decisions ?? []).map(
    (item) => `- ${sanitizeExportText(item.decision)}`
  )
  const actionItemLines = meeting.actionItems.map(
    (item) =>
      `- ${sanitizeExportText(item.task)} | ${sanitizeExportText(item.owner) || "Unassigned"} | ${item.priority} | ${item.status}`
  )
  const transcriptLines = meeting.transcriptSegments.map(
    (segment) =>
      `- [${formatTimestamp(segment.startSeconds)}] ${sanitizeExportText(segment.speaker) || "Speaker"}: ${sanitizeExportText(segment.text)}`
  )

  return [
    sanitizeExportText(meeting.title),
    "",
    "Executive summary:",
    sanitizeExportText(summary?.executiveSummary) || "No summary available.",
    "",
    "Decisions:",
    ...(decisionLines.length > 0 ? decisionLines : ["- None"]),
    "",
    "Action items:",
    ...(actionItemLines.length > 0 ? actionItemLines : ["- None"]),
    "",
    "Transcript:",
    ...(transcriptLines.length > 0
      ? transcriptLines
      : ["- Transcript unavailable"]),
  ].join("\n")
}

export function buildMeetingJsonExport(meeting: MeetingRecord) {
  return JSON.stringify(meeting, null, 2)
}
