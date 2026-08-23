import { revalidatePath } from "next/cache"
import { z } from "zod"

import {
  getMissingConfigurationMessage,
  getRuntimeConfiguration,
} from "@/lib/env"
import { assertSameOriginMutation } from "@/lib/http/origin"
import {
  deleteMeetingForUser,
  updateMeetingForUser,
} from "@/lib/meetings/mutations"
import { getMeetingForUser } from "@/lib/meetings/queries"
import { takeRateLimitToken } from "@/lib/meetings/rate-limit"
import { updateMeetingMetadataSchema } from "@/lib/meetings/validators"
import {
  createServerSupabaseClient,
  getAuthenticatedUser,
} from "@/lib/supabase/server"

const paramsSchema = z.object({
  id: z.string().min(1),
})

async function createAudioUrl(storagePath: string) {
  const supabase = await createServerSupabaseClient()
  const { data, error } = await supabase.storage
    .from("meeting-audio")
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

  const user = await getAuthenticatedUser()

  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 })
  }

  if (!(await takeRateLimitToken(`meeting:update:${user.id}`, 20, 60_000))) {
    return Response.json(
      { error: "Too many meeting updates right now." },
      { status: 429 }
    )
  }

  const { id } = paramsSchema.parse(await context.params)
  const meeting = await getMeetingForUser(id, user.id)

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

  const { id } = paramsSchema.parse(await context.params)
  const meeting = await getMeetingForUser(id, user.id)

  if (!meeting) {
    return Response.json({ error: "Meeting not found." }, { status: 404 })
  }

  const body = updateMeetingMetadataSchema.parse(await request.json())

  const update = {
    title: body.title,
    description: body.description,
    language: body.language,
  }

  await updateMeetingForUser(id, user.id, update)

  revalidatePath("/app")
  revalidatePath(`/app/meetings/${id}`)

  return Response.json({ ok: true })
}

export async function DELETE(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const runtime = getRuntimeConfiguration()

  if (!runtime.supabaseClientConfigured) {
    return Response.json(
      { error: "Supabase is not configured for the live workspace." },
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

  if (!(await takeRateLimitToken(`meeting:delete:${user.id}`, 6, 60_000))) {
    return Response.json(
      { error: "Too many delete requests right now." },
      { status: 429 }
    )
  }

  const { id } = paramsSchema.parse(await context.params)
  await deleteMeetingForUser(id, user.id)

  revalidatePath("/app")
  revalidatePath(`/app/meetings/${id}`)

  return Response.json({ ok: true })
}
