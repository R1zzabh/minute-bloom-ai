import { z } from "zod"

import { summarizeMeeting } from "@/lib/ai/summarize"
import { transcribeMeetingAudio } from "@/lib/ai/transcribe"
import { MAX_AUDIO_FILE_SIZE_BYTES } from "@/lib/constants"
import { takeRateLimitToken } from "@/lib/meetings/rate-limit"
import { getMeetingForUser } from "@/lib/meetings/queries"
import { createAdminSupabaseClient } from "@/lib/supabase/admin"
import { getAuthenticatedUser } from "@/lib/supabase/server"
import { sanitizeErrorMessage } from "@/lib/supabase/utils"

export const maxDuration = 300

const paramsSchema = z.object({
  id: z.string().min(1),
})

const bucketName = "meeting-audio"

export async function POST(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const user = await getAuthenticatedUser()

  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 })
  }

  if (!takeRateLimitToken(`process:${user.id}`, 6, 60_000)) {
    return Response.json(
      { error: "Too many processing requests." },
      { status: 429 }
    )
  }

  const { id } = paramsSchema.parse(await context.params)
  const meeting = await getMeetingForUser(id, user.id)

  if (!meeting) {
    return Response.json({ error: "Meeting not found." }, { status: 404 })
  }

  if (meeting.status === "completed") {
    return Response.json({ ok: true, status: "completed", progress: 100 })
  }

  if (
    meeting.status === "uploading" ||
    meeting.status === "transcribing" ||
    meeting.status === "summarizing"
  ) {
    return Response.json(
      { ok: true, status: meeting.status, progress: meeting.progress },
      { status: 202 }
    )
  }

  const admin = createAdminSupabaseClient()
  const { data: lockedMeeting, error: lockError } = await admin
    .from("meetings")
    .update({
      status:
        meeting.status === "failed" && meeting.transcriptSegments.length > 0
          ? "summarizing"
          : "transcribing",
      progress: meeting.transcriptSegments.length > 0 ? 70 : 35,
      processing_error: null,
    })
    .eq("id", id)
    .eq("user_id", user.id)
    .in("status", meeting.status === "failed" ? ["failed"] : ["uploaded"])
    .select("*")
    .maybeSingle()

  if (lockError) {
    return Response.json(
      { error: "Unable to lock meeting for processing." },
      { status: 500 }
    )
  }

  if (!lockedMeeting) {
    return Response.json(
      { ok: true, status: meeting.status, progress: meeting.progress },
      { status: 202 }
    )
  }

  try {
    let transcriptText = meeting.transcriptText
    let transcriptSegments = meeting.transcriptSegments
    let durationSeconds = meeting.durationSeconds

    if (meeting.transcriptSegments.length === 0) {
      const { data: audioBlob, error: downloadError } = await admin.storage
        .from(bucketName)
        .download(meeting.storagePath)

      if (downloadError || !audioBlob) {
        throw new Error(
          "Unable to download the meeting audio from private storage."
        )
      }

      if (audioBlob.size > MAX_AUDIO_FILE_SIZE_BYTES) {
        throw new Error(
          "Stored audio exceeds the supported 25 MB processing limit."
        )
      }

      const transcription = await transcribeMeetingAudio({
        audioBuffer: await audioBlob.arrayBuffer(),
        fileName: meeting.originalFileName,
        mimeType: meeting.mimeType,
        language: meeting.language,
      })

      transcriptText = transcription.readableTranscript
      transcriptSegments = transcription.segments
      durationSeconds = transcription.durationSeconds

      const { error: transcriptSaveError } = await admin
        .from("meetings")
        .update({
          transcript_text: transcriptText,
          transcript_segments: transcriptSegments,
          duration_seconds: durationSeconds,
          progress: 70,
          status: "summarizing",
        })
        .eq("id", id)
        .eq("user_id", user.id)

      if (transcriptSaveError) {
        throw new Error("Unable to save the transcript.")
      }
    }

    const summary = await summarizeMeeting({
      title: meeting.title,
      description: meeting.description,
      language: meeting.language,
      transcriptText,
    })

    const { error: replaceActionItemsError } = await admin
      .from("action_items")
      .delete()
      .eq("meeting_id", id)
      .eq("user_id", user.id)

    if (replaceActionItemsError) {
      throw new Error("Unable to clear previous action items.")
    }

    if (summary.actionItems.length > 0) {
      const { error: insertActionItemsError } = await admin
        .from("action_items")
        .insert(
          summary.actionItems.map((item) => ({
            meeting_id: id,
            user_id: user.id,
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
      .eq("id", id)
      .eq("user_id", user.id)

    if (completeError) {
      throw new Error("Unable to finalize the meeting.")
    }

    return Response.json({ ok: true, status: "completed" })
  } catch (error) {
    await admin
      .from("meetings")
      .update({
        status: "failed",
        processing_error: sanitizeErrorMessage(error),
      })
      .eq("id", id)
      .eq("user_id", user.id)

    return Response.json(
      { error: sanitizeErrorMessage(error) },
      { status: 500 }
    )
  }
}
