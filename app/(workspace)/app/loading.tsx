import { LoaderCircle } from "lucide-react"

import { Card } from "@/components/ui/card"

export default function WorkspaceLoading() {
  return (
    <Card
      className="content-width flex items-center gap-3"
      role="status"
      aria-live="polite"
    >
      <LoaderCircle className="h-5 w-5 animate-spin text-primary" />
      <div>
        <p className="font-medium">Loading workspace</p>
        <p className="text-sm text-muted-foreground">
          MinuteBloom is fetching the latest meeting data.
        </p>
      </div>
    </Card>
  )
}
