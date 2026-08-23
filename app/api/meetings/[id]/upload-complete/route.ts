import { z } from "zod"

import {
  getMissingConfigurationMessage,
  getRuntimeConfiguration,
} from "@/lib/env"
import { assertSameOriginMutation } from "@/lib/http/origin"
import { queueMeetingForProcessing } from "@/lib/meetings/jobs"
import { takeRateLimitToken } from "@/lib/meetings/rate-limit"
import { getMeetingForUser } from "@/lib/meetings/queries"
import {
  createServerSupabaseClient,
  getAuthenticatedUser,
} from "@/lib/supabase/server"

const paramsSchema = z.object({
  id: z.string().min(1),
})

function splitStoragePath(storagePath: string) {
  const lastSlash = storagePath.lastIndexOf("/")

  if (lastSlash === -1) {
    return { folder: "", objectName: storagePath }
  }

  return {
    folder: storagePath.slice(0, lastSlash),
    objectName: storagePath.slice(lastSlash + 1),
  }
}

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

  if (!(await takeRateLimitToken(`upload:complete:${user.id}`, 12, 60_000))) {
    return Response.json(
      { error: "Too many upload completion requests." },
      { status: 429 }
    )
  }

  const { id } = paramsSchema.parse(await context.params)
  const meeting = await getMeetingForUser(id, user.id)

  if (!meeting) {
    return Response.json({ error: "Meeting not found." }, { status: 404 })
  }

  if (
    meeting.status === "uploaded" ||
    meeting.status === "transcribing" ||
    meeting.status === "summarizing" ||
    meeting.status === "completed"
  ) {
    return Response.json({ ok: true, status: meeting.status })
  }

  const { folder, objectName } = splitStoragePath(meeting.storagePath)
  const supabase = await createServerSupabaseClient()
  const { data: objects, error: storageError } = await supabase.storage
    .from("meeting-audio")
    .list(folder, {
      limit: 100,
      search: objectName,
    })

  if (storageError) {
    return Response.json(
      { error: "Unable to verify the uploaded audio object." },
      { status: 500 }
    )
  }

  const objectExists = objects.some((entry) => entry.name === objectName)

  if (!objectExists) {
    return Response.json(
      {
        error:
          "The uploaded audio file could not be verified in private storage.",
      },
      { status: 409 }
    )
  }

  const { error: updateError } = await supabase
    .from("meetings")
    .update({
      status: "uploaded",
      progress: 25,
      processing_error: null,
    })
    .eq("id", id)
    .eq("user_id", user.id)

  if (updateError) {
    return Response.json(
      { error: "Unable to finalize upload verification." },
      { status: 500 }
    )
  }

  try {
    await queueMeetingForProcessing({
      meetingId: id,
      userId: user.id,
      requestUrl: request.url,
      currentStatus: "uploaded",
      hasTranscript: meeting.transcriptSegments.length > 0,
    })
  } catch (error) {
    return Response.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to start meeting processing.",
      },
      { status: 500 }
    )
  }

  return Response.json(
    { ok: true, status: "uploaded", progress: 25 },
    { status: 202 }
  )
}
