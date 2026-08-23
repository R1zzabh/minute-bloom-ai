import { revalidatePath } from "next/cache"

import { createMeetingRecord } from "@/lib/meetings/mutations"
import { createMeetingRequestSchema } from "@/lib/meetings/validators"
import { getAuthenticatedUser } from "@/lib/supabase/server"

export async function POST(request: Request) {
  const user = await getAuthenticatedUser()

  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 })
  }

  const body = createMeetingRequestSchema.parse(await request.json())
  const meeting = await createMeetingRecord(user.id, body)

  revalidatePath("/app")

  return Response.json({ meeting }, { status: 201 })
}
