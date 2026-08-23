import { notFound, redirect } from "next/navigation"

import { MeetingWorkspace } from "@/components/meetings/meeting-workspace"
import { demoMeeting } from "@/fixtures/demo-meeting"
import { hasConfiguredSupabase } from "@/lib/env"
import { getMeetingForUser } from "@/lib/meetings/queries"
import { getAuthenticatedUser } from "@/lib/supabase/server"

export default async function MeetingDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const hasSupabase = hasConfiguredSupabase()
  const user = hasSupabase ? await getAuthenticatedUser() : null

  if (hasSupabase && !user) {
    redirect("/sign-in")
  }

  const meeting = user
    ? await getMeetingForUser(id, user.id)
    : id === demoMeeting.id
      ? demoMeeting
      : null

  if (!meeting) {
    notFound()
  }

  return (
    <div className="content-width">
      <MeetingWorkspace
        key={`${meeting.id}:${meeting.updatedAt}`}
        meeting={meeting}
        initialAudioUrl={hasSupabase ? null : "/api/demo-audio"}
        mode={hasSupabase ? "live" : "fixture"}
      />
    </div>
  )
}
