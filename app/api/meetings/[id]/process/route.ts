import { z } from "zod"

import {
  getMissingConfigurationMessage,
  getRuntimeConfiguration,
} from "@/lib/env"
import { assertSameOriginMutation } from "@/lib/http/origin"
import { queueMeetingForProcessing } from "@/lib/meetings/jobs"
import { takeRateLimitToken } from "@/lib/meetings/rate-limit"
import { getMeetingForUser } from "@/lib/meetings/queries"
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

  if (!(await takeRateLimitToken(`process:${user.id}`, 6, 60_000))) {
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

  if (meeting.status === "uploading") {
    return Response.json(
      { error: "Upload verification has not completed yet." },
      { status: 409 }
    )
  }

  try {
    const queuedState = await queueMeetingForProcessing({
      meetingId: id,
      userId: user.id,
      requestUrl: request.url,
      currentStatus: meeting.status,
      hasTranscript: meeting.transcriptSegments.length > 0,
    })

    return Response.json(
      {
        ok: true,
        status: queuedState.status,
        progress: queuedState.progress,
      },
      { status: 202 }
    )
  } catch (error) {
    return Response.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to queue the meeting for processing.",
      },
      { status: 500 }
    )
  }
}
