import { redirect } from "next/navigation"

import { DashboardList } from "@/components/meetings/dashboard-list"
import { ConfigurationRequiredState } from "@/components/shared/configuration-required-state"
import { getRuntimeConfiguration } from "@/lib/env"
import { listMeetingsForUser } from "@/lib/meetings/queries"
import { getAuthenticatedUser } from "@/lib/supabase/server"

export default async function DashboardPage() {
  const runtime = getRuntimeConfiguration()

  if (!runtime.supabaseClientConfigured) {
    return (
      <ConfigurationRequiredState
        title="The live workspace is unavailable in this environment"
        message="MinuteBloom only serves real account data inside /app. Configure Supabase to enable sign-in, dashboard access, and private meeting storage."
        missing={runtime.missing.supabaseClient}
      />
    )
  }

  const user = await getAuthenticatedUser()

  if (!user) {
    redirect("/sign-in")
  }

  const meetings = await listMeetingsForUser(user.id)

  return <DashboardList initialMeetings={meetings} />
}
