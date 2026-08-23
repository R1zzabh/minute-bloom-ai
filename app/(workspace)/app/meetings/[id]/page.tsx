import { notFound, redirect } from "next/navigation"

import { MeetingWorkspace } from "@/components/meetings/meeting-workspace"
import { ConfigurationRequiredState } from "@/components/shared/configuration-required-state"
import { getRuntimeConfiguration } from "@/lib/env"
import { getMeetingForUser } from "@/lib/meetings/queries"
import { getAuthenticatedUser } from "@/lib/supabase/server"

export default async function MeetingDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const runtime = getRuntimeConfiguration()

  if (!runtime.supabaseClientConfigured) {
    return (
      <ConfigurationRequiredState
        title="The live meeting workspace is unavailable"
        message="The /app workspace never substitutes fixture meetings. Configure Supabase to open private meeting workspaces here, or use /demo for deterministic sample data."
        missing={runtime.missing.supabaseClient}
      />
    )
  }

  const user = await getAuthenticatedUser()

  if (!user) {
    redirect("/sign-in")
  }

  const meeting = await getMeetingForUser(id, user.id)

  if (!meeting) {
    notFound()
  }

  return (
    <div className="content-width">
      <MeetingWorkspace
        key={`${meeting.id}:${meeting.updatedAt}`}
        meeting={meeting}
        initialAudioUrl={null}
        mode="live"
      />
    </div>
  )
}
