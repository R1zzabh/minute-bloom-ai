import { z } from "zod"

import { summarizeMeeting } from "@/lib/ai/summarize"
import { transcribeMeetingAudio } from "@/lib/ai/transcribe"
import { validateStoredMeetingAudio } from "@/lib/meetings/audio"
import { createAdminSupabaseClient } from "@/lib/supabase/admin"
import type { Json } from "@/types/database"

const processingMeetingSchema = z.object({
  id: z.string(),
  user_id: z.string(),
  title: z.string(),
  description: z.string().nullable(),
  language: z.string(),
  storage_path: z.string(),
  original_file_name: z.string(),
  mime_type: z.string(),
  status: z.enum([
    "uploading",
    "uploaded",
    "transcribing",
    "summarizing",
    "completed",
    "failed",
  ]),
  progress: z.number(),
  transcript_text: z.string().nullable(),
  transcript_segments: z.array(z.unknown()).default([]),
  duration_seconds: z.number().nullable(),
})

export async function processMeetingJob(input: {
  meetingId: string
  userId: string
}) {
  const admin = createAdminSupabaseClient()
  const { data: meetingRow, error: meetingError } = await admin
    .from("meetings")
    .select(
      "id, user_id, title, description, language, storage_path, original_file_name, mime_type, status, progress, transcript_text, transcript_segments, duration_seconds"
    )
    .eq("id", input.meetingId)
    .eq("user_id", input.userId)
    .maybeSingle()

  if (meetingError) {
    throw new Error("Unable to load the queued meeting.")
  }

  if (!meetingRow) {
    return
  }

  const meeting = processingMeetingSchema.parse(meetingRow)

  if (meeting.status === "completed") {
    return
  }

  let transcriptText = meeting.transcript_text ?? ""
  let transcriptSegments = meeting.transcript_segments
  let durationSeconds = meeting.duration_seconds

  if (!Array.isArray(transcriptSegments) || transcriptSegments.length === 0) {
    await admin
      .from("meetings")
      .update({
        status: "transcribing",
        progress: 35,
        processing_error: null,
      })
      .eq("id", meeting.id)
      .eq("user_id", meeting.user_id)

    const { data: audioBlob, error: downloadError } = await admin.storage
      .from("meeting-audio")
      .download(meeting.storage_path)

    if (downloadError || !audioBlob) {
      throw new Error(
        "Unable to download the meeting audio from private storage."
      )
    }

    const audioBuffer = await audioBlob.arrayBuffer()
    validateStoredMeetingAudio(
      {
        originalFileName: meeting.original_file_name,
        mimeType: meeting.mime_type,
      },
      audioBlob.size,
      new Uint8Array(audioBuffer)
    )

    const transcription = await transcribeMeetingAudio({
      audioBuffer,
      fileName: meeting.original_file_name,
      mimeType: meeting.mime_type,
      language: meeting.language,
    })

    transcriptText = transcription.readableTranscript
    transcriptSegments = transcription.segments
    durationSeconds = transcription.durationSeconds

    const { error: transcriptSaveError } = await admin
      .from("meetings")
      .update({
        transcript_text: transcriptText,
        transcript_segments: transcriptSegments as Json,
        duration_seconds: durationSeconds,
        progress: 70,
        status: "summarizing",
        processing_error: null,
      })
      .eq("id", meeting.id)
      .eq("user_id", meeting.user_id)

    if (transcriptSaveError) {
      throw new Error("Unable to save the transcript.")
    }
  }

  await admin
    .from("meetings")
    .update({
      status: "summarizing",
      progress: 70,
      processing_error: null,
    })
    .eq("id", meeting.id)
    .eq("user_id", meeting.user_id)

  const summary = await summarizeMeeting({
    title: meeting.title,
    description: meeting.description,
    language: meeting.language,
    transcriptText,
  })

  const { error: replaceActionItemsError } = await admin
    .from("action_items")
    .delete()
    .eq("meeting_id", meeting.id)
    .eq("user_id", meeting.user_id)

  if (replaceActionItemsError) {
    throw new Error("Unable to clear previous action items.")
  }

  if (summary.actionItems.length > 0) {
    const { error: insertActionItemsError } = await admin
      .from("action_items")
      .insert(
        summary.actionItems.map((item) => ({
          meeting_id: meeting.id,
          user_id: meeting.user_id,
          task: item.task,
          owner: item.owner,
          due_date: item.dueDate,
          priority: item.priority,
          status: "open",
          source_timestamp_seconds: item.timestampSeconds,
          is_inferred: item.isInferred,
        }))
      )

    if (insertActionItemsError) {
      throw new Error("Unable to save action items.")
    }
  }

  const { error: completeError } = await admin
    .from("meetings")
    .update({
      summary,
      status: "completed",
      progress: 100,
      processing_error: null,
    })
    .eq("id", meeting.id)
    .eq("user_id", meeting.user_id)

  if (completeError) {
    throw new Error("Unable to finalize the meeting.")
  }
}
