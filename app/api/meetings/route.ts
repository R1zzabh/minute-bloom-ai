import { revalidatePath } from "next/cache"

import {
  getMissingConfigurationMessage,
  getRuntimeConfiguration,
} from "@/lib/env"
import { assertSameOriginMutation } from "@/lib/http/origin"
import { takeRateLimitToken } from "@/lib/meetings/rate-limit"
import { createMeetingRecord } from "@/lib/meetings/mutations"
import { createMeetingRequestSchema } from "@/lib/meetings/validators"
import { getAuthenticatedUser } from "@/lib/supabase/server"

export async function POST(request: Request) {
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

  if (!(await takeRateLimitToken(`upload:create:${user.id}`, 6, 600_000))) {
    return Response.json(
      { error: "Too many uploads started right now." },
      { status: 429 }
    )
  }

  const body = createMeetingRequestSchema.parse(await request.json())
  const meeting = await createMeetingRecord(user.id, body)

  revalidatePath("/app")

  return Response.json({ meeting }, { status: 201 })
}
