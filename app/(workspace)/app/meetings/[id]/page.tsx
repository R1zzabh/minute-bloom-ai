import { notFound } from "next/navigation"

import { MeetingWorkspace } from "@/components/meetings/meeting-workspace"
import { demoMeeting } from "@/fixtures/demo-meeting"

export default async function MeetingDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  if (id !== demoMeeting.id) {
    notFound()
  }

  return (
    <div className="content-width">
      <MeetingWorkspace meeting={demoMeeting} />
    </div>
  )
}
