import { MeetingUploadForm } from "@/components/meetings/meeting-upload-form"
import { ConfigurationRequiredState } from "@/components/shared/configuration-required-state"
import {
  getMissingConfigurationMessage,
  getRuntimeConfiguration,
} from "@/lib/env"

export default function NewMeetingPage() {
  const runtime = getRuntimeConfiguration()

  if (!runtime.supabaseClientConfigured) {
    return (
      <ConfigurationRequiredState
        title="Live uploads are unavailable"
        message="MinuteBloom only accepts real uploads inside /app when Supabase is configured for the authenticated workspace."
        missing={runtime.missing.supabaseClient}
      />
    )
  }

  return (
    <div className="content-width space-y-6">
      <div>
        <p className="mono-label">new meeting</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">
          Upload audio and start the processing pipeline
        </h1>
      </div>
      <MeetingUploadForm
        liveUploadsEnabled={runtime.liveProcessingConfigured}
        availabilityMessage={
          getMissingConfigurationMessage("liveProcessing") ??
          "Live processing is ready."
        }
      />
    </div>
  )
}
