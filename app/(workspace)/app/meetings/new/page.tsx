import { UploadCloud } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"

export default function NewMeetingPage() {
  return (
    <div className="content-width space-y-6">
      <div>
        <p className="mono-label">new meeting</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">
          Upload audio and start the processing pipeline
        </h1>
      </div>
      <Card className="surface-dash p-8 text-center">
        <UploadCloud className="mx-auto h-10 w-10 text-primary" />
        <h2 className="mt-4 text-xl font-semibold">Drop an audio file here</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Supports mp3, mp4, mpeg, mpga, m4a, wav, and webm up to 25 MB.
        </p>
        <div className="mt-5 flex justify-center">
          <Button>Browse files</Button>
        </div>
      </Card>
      <div className="grid gap-5 lg:grid-cols-2">
        <Card>
          <label
            className="mb-2 block text-sm font-medium"
            htmlFor="meeting-title"
          >
            Meeting title
          </label>
          <Input id="meeting-title" placeholder="Weekly launch sync" />
          <label
            className="mt-4 mb-2 block text-sm font-medium"
            htmlFor="language"
          >
            Language
          </label>
          <Input id="language" placeholder="auto" />
        </Card>
        <Card>
          <label className="mb-2 block text-sm font-medium" htmlFor="context">
            Optional context
          </label>
          <Textarea
            id="context"
            placeholder="Tell MinuteBloom what this meeting is about, or leave blank."
          />
          <div className="mt-4 flex flex-wrap gap-2">
            {["Uploading", "Uploaded", "Transcribing", "Summarizing"].map(
              (step) => (
                <Badge key={step}>{step}</Badge>
              )
            )}
          </div>
        </Card>
      </div>
    </div>
  )
}
