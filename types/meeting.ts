export type MeetingStatus =
  | "uploading"
  | "uploaded"
  | "transcribing"
  | "summarizing"
  | "completed"
  | "failed"

export type ActionItemStatus = "open" | "in_progress" | "done"
export type ActionItemPriority = "low" | "medium" | "high"

export type TranscriptSegment = {
  id: string
  startSeconds: number
  endSeconds: number
  text: string
  speaker: string | null
}

export type MeetingSummary = {
  suggestedTitle: string
  executiveSummary: string
  keyTopics: Array<{ topic: string; detail: string }>
  decisions: Array<{
    decision: string
    rationale: string | null
    timestampSeconds: number | null
  }>
  actionItems: Array<{
    task: string
    owner: string | null
    dueDate: string | null
    priority: ActionItemPriority
    timestampSeconds: number | null
    isInferred: boolean
  }>
  blockers: string[]
  openQuestions: string[]
}

export type MeetingActionItem = {
  id: string
  task: string
  owner: string | null
  dueDate: string | null
  priority: ActionItemPriority
  status: ActionItemStatus
  sourceTimestampSeconds: number | null
  isInferred: boolean
}

export type MeetingRecord = {
  id: string
  title: string
  description: string | null
  language: string
  storagePath: string
  status: MeetingStatus
  progress: number
  originalFileName: string
  mimeType: string
  sizeBytes: number
  durationSeconds: number | null
  transcriptText: string
  transcriptSegments: TranscriptSegment[]
  summary: MeetingSummary | null
  processingError: string | null
  actionItems: MeetingActionItem[]
  createdAt: string
  updatedAt: string
}
