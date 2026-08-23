import { z } from "zod"

import { answerMeetingQuestion } from "@/lib/ai/summarize"
import {
  getMissingConfigurationMessage,
  getRuntimeConfiguration,
} from "@/lib/env"
import { assertSameOriginMutation } from "@/lib/http/origin"
import { takeRateLimitToken } from "@/lib/meetings/rate-limit"
import { getMeetingForUser } from "@/lib/meetings/queries"
import { chatRequestSchema } from "@/lib/meetings/validators"
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

  if (!(await takeRateLimitToken(`chat:${user.id}`, 15, 60_000))) {
    return Response.json(
      { error: "Too many questions right now." },
      { status: 429 }
    )
  }

  const { id } = paramsSchema.parse(await context.params)
  const body = chatRequestSchema.parse(await request.json())
  const meeting = await getMeetingForUser(id, user.id)

  if (!meeting) {
    return Response.json({ error: "Meeting not found." }, { status: 404 })
  }

  const answer = await answerMeetingQuestion(meeting, body.question)
  return Response.json(answer)
}
