import { z } from "zod"

import {
  getMissingConfigurationMessage,
  getRuntimeConfiguration,
} from "@/lib/env"
import { assertSameOriginMutation } from "@/lib/http/origin"
import {
  enqueueMeetingProcessingJob,
  scheduleMeetingWorker,
} from "@/lib/meetings/jobs"
import { takeRateLimitToken } from "@/lib/meetings/rate-limit"
import { getMeetingForUser } from "@/lib/meetings/queries"
import { createAdminSupabaseClient } from "@/lib/supabase/admin"
import { getAuthenticatedUser } from "@/lib/supabase/server"

const paramsSchema = z.object({
  id: z.string().min(1),
})

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const runtime = getRuntimeConfiguration()

  if (!runtime.liveProcessingConfigured) {
    return Response.json(
      {
        error:
          getMissingConfigurationMessage("liveProcessing") ??
          "Live processing is not configured.",
      },
      { status: 503 }
    )
  }

  const sameOrigin = assertSameOriginMutation(request)

  if (!sameOrigin.ok) {
    return sameOrigin.response
  }

  const user = await getAuthenticatedUser()

  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 })
  }

  if (!(await takeRateLimitToken(`retry:${user.id}`, 6, 60_000))) {
    return Response.json({ error: "Too many retry requests." }, { status: 429 })
  }

  const { id } = paramsSchema.parse(await context.params)
  const meeting = await getMeetingForUser(id, user.id)

  if (!meeting) {
    return Response.json({ error: "Meeting not found." }, { status: 404 })
  }

  if (meeting.status !== "failed") {
    return Response.json(
      { error: "Only failed meetings can be retried." },
      { status: 400 }
    )
  }

  const nextStatus =
    meeting.transcriptSegments.length > 0 ? "summarizing" : "transcribing"
  const nextProgress = meeting.transcriptSegments.length > 0 ? 70 : 35
  const admin = createAdminSupabaseClient()

  const { error: updateError } = await admin
    .from("meetings")
    .update({
      status: nextStatus,
      progress: nextProgress,
      processing_error: null,
    })
    .eq("id", id)
    .eq("user_id", user.id)

  if (updateError) {
    return Response.json(
      { error: "Unable to queue the retry." },
      { status: 500 }
    )
  }

  await enqueueMeetingProcessingJob({
    meetingId: id,
    userId: user.id,
    resetAttempts: true,
  })
  scheduleMeetingWorker(request.url)

  return Response.json(
    { ok: true, status: nextStatus, progress: nextProgress },
    { status: 202 }
  )
}
