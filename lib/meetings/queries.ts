import { z } from "zod"

import { demoMeeting } from "@/fixtures/demo-meeting"
import { hasConfiguredSupabase } from "@/lib/env"
import { createServerSupabaseClient } from "@/lib/supabase/server"
import type { MeetingRecord, MeetingSummary } from "@/types/meeting"

const actionItemRowSchema = z.object({
  id: z.string(),
  task: z.string(),
  owner: z.string().nullable(),
  due_date: z.string().nullable(),
  priority: z.enum(["low", "medium", "high"]),
  status: z.enum(["open", "in_progress", "done"]),
  source_timestamp_seconds: z.number().nullable(),
  is_inferred: z.boolean(),
})

const meetingRowSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string().nullable(),
  language: z.string(),
  status: z.enum([
    "uploading",
    "uploaded",
    "transcribing",
    "summarizing",
    "completed",
    "failed",
  ]),
  progress: z.number(),
  original_file_name: z.string(),
  mime_type: z.string(),
  size_bytes: z.number(),
  duration_seconds: z.number().nullable(),
  transcript_text: z.string().nullable(),
  transcript_segments: z.array(z.unknown()).default([]),
  summary: z.unknown().nullable(),
  processing_error: z.string().nullable(),
  created_at: z.string(),
  updated_at: z.string(),
  storage_path: z.string(),
  action_items: z.array(actionItemRowSchema).default([]),
})

function mapMeetingRow(row: z.infer<typeof meetingRowSchema>): MeetingRecord {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    language: row.language,
    storagePath: row.storage_path,
    status: row.status,
    progress: row.progress,
    originalFileName: row.original_file_name,
    mimeType: row.mime_type,
    sizeBytes: row.size_bytes,
    durationSeconds: row.duration_seconds,
    transcriptText: row.transcript_text ?? "",
    transcriptSegments:
      row.transcript_segments as MeetingRecord["transcriptSegments"],
    summary: row.summary as MeetingSummary | null,
    processingError: row.processing_error,
    actionItems: row.action_items.map((item) => ({
      id: item.id,
      task: item.task,
      owner: item.owner,
      dueDate: item.due_date,
      priority: item.priority,
      status: item.status,
      sourceTimestampSeconds: item.source_timestamp_seconds,
      isInferred: item.is_inferred,
    })),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

export async function listMeetingsForUser(userId: string) {
  if (!hasConfiguredSupabase()) {
    return [demoMeeting]
  }

  const supabase = await createServerSupabaseClient()
  const { data, error } = await supabase
    .from("meetings")
    .select("*, action_items(*)")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })

  if (error) {
    throw new Error("Unable to load meetings.")
  }

  return z.array(meetingRowSchema).parse(data).map(mapMeetingRow)
}

export async function getMeetingForUser(meetingId: string, userId: string) {
  if (!hasConfiguredSupabase()) {
    return meetingId === demoMeeting.id ? demoMeeting : null
  }

  const supabase = await createServerSupabaseClient()
  const { data, error } = await supabase
    .from("meetings")
    .select("*, action_items(*)")
    .eq("id", meetingId)
    .eq("user_id", userId)
    .maybeSingle()

  if (error) {
    throw new Error("Unable to load meeting.")
  }

  if (!data) {
    return null
  }

  return mapMeetingRow(meetingRowSchema.parse(data))
}
