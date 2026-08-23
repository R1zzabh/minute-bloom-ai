import { MeetingWorkspace } from "@/components/meetings/meeting-workspace"
import { SiteHeader } from "@/components/shared/site-header"
import { demoMeeting } from "@/fixtures/demo-meeting"

export default function DemoPage() {
  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="section-padding">
        <div className="content-width">
          <MeetingWorkspace
            key={`${demoMeeting.id}:${demoMeeting.updatedAt}`}
            meeting={demoMeeting}
            initialAudioUrl="/api/demo-audio"
            mode="demo"
          />
        </div>
      </main>
    </div>
  )
}
