import { revalidatePath } from "next/cache"
import { z } from "zod"

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
  const user = await getAuthenticatedUser()

  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 })
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
