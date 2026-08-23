import { z } from "zod"

import { createAdminSupabaseClient } from "@/lib/supabase/admin"
import { getMeetingForUser } from "@/lib/meetings/queries"
import { getAuthenticatedUser } from "@/lib/supabase/server"

const paramsSchema = z.object({
  id: z.string().min(1),
})

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const user = await getAuthenticatedUser()

  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 })
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

  const admin = createAdminSupabaseClient()
  await admin
    .from("meetings")
    .update({
      status:
        meeting.transcriptSegments.length > 0 ? "summarizing" : "uploaded",
      progress: meeting.transcriptSegments.length > 0 ? 70 : 25,
      processing_error: null,
    })
    .eq("id", id)
    .eq("user_id", user.id)

  const processUrl = new URL(`/api/meetings/${id}/process`, request.url)
  await fetch(processUrl, {
    method: "POST",
    headers: {
      cookie: request.headers.get("cookie") ?? "",
    },
  })

  return Response.json({ ok: true })
}
