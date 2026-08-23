import { revalidatePath } from "next/cache"
import { z } from "zod"

import { demoMeeting } from "@/fixtures/demo-meeting"
import { hasConfiguredSupabase } from "@/lib/env"
import {
  deleteMeetingForUser,
  updateMeetingForUser,
} from "@/lib/meetings/mutations"
import { getMeetingForUser } from "@/lib/meetings/queries"
import {
  isLegalMeetingTransition,
  updateMeetingSchema,
} from "@/lib/meetings/validators"
import { createAdminSupabaseClient } from "@/lib/supabase/admin"
import { getAuthenticatedUser } from "@/lib/supabase/server"

const paramsSchema = z.object({
  id: z.string().min(1),
})

const bucketName = "meeting-audio"

async function createAudioUrl(storagePath: string) {
  if (!hasConfiguredSupabase()) {
    return "/api/demo-audio"
  }

  const admin = createAdminSupabaseClient()
  const { data, error } = await admin.storage
    .from(bucketName)
    .createSignedUrl(storagePath, 60 * 60)

  if (error) {
    return null
  }

  return data.signedUrl
}

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const user = await getAuthenticatedUser()

  if (!user && hasConfiguredSupabase()) {
    return Response.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { id } = paramsSchema.parse(await context.params)
  const meeting = user
    ? await getMeetingForUser(id, user.id)
    : id === demoMeeting.id
      ? demoMeeting
      : null

  if (!meeting) {
    return Response.json({ error: "Meeting not found." }, { status: 404 })
  }

  const audioUrl = await createAudioUrl(meeting.storagePath)

  return Response.json({
    meeting,
    audioUrl,
  })
}

export async function PATCH(
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

  const body = updateMeetingSchema.parse(await request.json())

  if (
    body.status &&
    body.status !== meeting.status &&
    !isLegalMeetingTransition(meeting.status, body.status)
  ) {
    return Response.json(
      { error: "Illegal processing-state transition." },
      { status: 400 }
    )
  }

  const update = {
    title: body.title,
    description: body.description,
    language: body.language,
    status: body.status,
    progress: body.progress,
    processing_error: body.processingError,
  }

  await updateMeetingForUser(id, user.id, update)

  revalidatePath("/app")
  revalidatePath(`/app/meetings/${id}`)

  return Response.json({ ok: true })
}

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const user = await getAuthenticatedUser()

  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { id } = paramsSchema.parse(await context.params)
  await deleteMeetingForUser(id, user.id)

  revalidatePath("/app")
  revalidatePath(`/app/meetings/${id}`)

  return Response.json({ ok: true })
}
