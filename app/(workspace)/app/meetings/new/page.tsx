import { MeetingUploadForm } from "@/components/meetings/meeting-upload-form"
import { hasConfiguredOpenAI, hasConfiguredSupabase } from "@/lib/env"

export default function NewMeetingPage() {
  const liveUploadsEnabled = hasConfiguredSupabase() && hasConfiguredOpenAI()

  return (
    <div className="content-width space-y-6">
      <div>
        <p className="mono-label">new meeting</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">
          Upload audio and start the processing pipeline
        </h1>
      </div>
      <MeetingUploadForm liveUploadsEnabled={liveUploadsEnabled} />
    </div>
  )
}
