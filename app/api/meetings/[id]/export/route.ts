import { z } from "zod"

import {
  buildMeetingJsonExport,
  buildMeetingMarkdownExport,
  buildMeetingTextExport,
} from "@/lib/meetings/export"
import { getMeetingForUser } from "@/lib/meetings/queries"
import { exportFormatSchema } from "@/lib/meetings/validators"
import { getAuthenticatedUser } from "@/lib/supabase/server"

const paramsSchema = z.object({
  id: z.string().min(1),
})

export async function GET(
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

  const format = exportFormatSchema.parse(
    new URL(request.url).searchParams.get("format") ?? "markdown"
  )

  if (format === "json") {
    return new Response(buildMeetingJsonExport(meeting), {
      headers: {
        "Content-Type": "application/json",
        "Content-Disposition": `attachment; filename="${meeting.id}.json"`,
      },
    })
  }

  if (format === "text") {
    return new Response(buildMeetingTextExport(meeting), {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Content-Disposition": `attachment; filename="${meeting.id}.txt"`,
      },
    })
  }

  return new Response(buildMeetingMarkdownExport(meeting), {
    headers: {
      "Content-Type": "text/markdown; charset=utf-8",
      "Content-Disposition": `attachment; filename="${meeting.id}.md"`,
    },
  })
}
