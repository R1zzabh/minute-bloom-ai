import { redirect } from "next/navigation"

import { DashboardList } from "@/components/meetings/dashboard-list"
import { hasConfiguredSupabase } from "@/lib/env"
import { listMeetingsForUser } from "@/lib/meetings/queries"
import { getAuthenticatedUser } from "@/lib/supabase/server"

export default async function DashboardPage() {
  const user = hasConfiguredSupabase() ? await getAuthenticatedUser() : null

  if (hasConfiguredSupabase() && !user) {
    redirect("/sign-in")
  }

  const meetings = await listMeetingsForUser(user?.id ?? "fixture-user")

  return <DashboardList initialMeetings={meetings} />
}
