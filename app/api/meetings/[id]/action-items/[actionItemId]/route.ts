import { revalidatePath } from "next/cache"
import { z } from "zod"

import {
  getMissingConfigurationMessage,
  getRuntimeConfiguration,
} from "@/lib/env"
import { assertSameOriginMutation } from "@/lib/http/origin"
import { takeRateLimitToken } from "@/lib/meetings/rate-limit"
import { updateActionItemForUser } from "@/lib/meetings/mutations"
import { getMeetingForUser } from "@/lib/meetings/queries"
import { updateActionItemSchema } from "@/lib/meetings/validators"
import { getAuthenticatedUser } from "@/lib/supabase/server"

const paramsSchema = z.object({
  id: z.string().min(1),
  actionItemId: z.string().min(1),
})

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string; actionItemId: string }> }
) {
  const runtime = getRuntimeConfiguration()

  if (!runtime.supabaseAdminConfigured) {
    return Response.json(
      {
        error:
          getMissingConfigurationMessage("supabaseAdmin") ??
          "Supabase admin access is not configured.",
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

  if (
    !(await takeRateLimitToken(`action-item:update:${user.id}`, 20, 60_000))
  ) {
    return Response.json(
      { error: "Too many action item updates right now." },
      { status: 429 }
    )
  }

  const { id, actionItemId } = paramsSchema.parse(await context.params)
  const meeting = await getMeetingForUser(id, user.id)

  if (!meeting) {
    return Response.json({ error: "Meeting not found." }, { status: 404 })
  }

  const body = updateActionItemSchema.parse(await request.json())
  const updated = await updateActionItemForUser(id, actionItemId, user.id, body)

  if (!updated) {
    return Response.json({ error: "Action item not found." }, { status: 404 })
  }

  revalidatePath("/app")
  revalidatePath(`/app/meetings/${id}`)

  return Response.json({ ok: true })
}
