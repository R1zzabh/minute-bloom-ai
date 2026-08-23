import { SignOutButton } from "@/components/shared/sign-out-button"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import { getRuntimeConfiguration } from "@/lib/env"
import { getAuthenticatedUser } from "@/lib/supabase/server"

export default async function SettingsPage() {
  const runtime = getRuntimeConfiguration()
  const user = runtime.supabaseClientConfigured
    ? await getAuthenticatedUser()
    : null

  return (
    <div className="content-width space-y-6">
      <div>
        <p className="mono-label">settings</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">
          Profile, theme, and data controls
        </h1>
      </div>
      <div className="grid gap-4 lg:grid-cols-3">
        <Card>
          <h2 className="text-lg font-semibold">Profile</h2>
          <p className="mt-3 text-sm leading-7 text-muted-foreground">
            {user?.email ??
              "Supabase auth is not configured in this environment."}
          </p>
          {user ? (
            <SignOutButton className="mt-4" variant="secondary">
              Sign out
            </SignOutButton>
          ) : null}
        </Card>
        <Card>
          <h2 className="text-lg font-semibold">Theme</h2>
          <p className="mt-3 text-sm leading-7 text-muted-foreground">
            Class-based light and dark mode are available globally and respect
            hydration safety.
          </p>
        </Card>
        <Card>
          <h2 className="text-lg font-semibold">Environment</h2>
          <div className="mt-4 flex flex-wrap gap-2">
            <Badge
              variant={runtime.supabaseClientConfigured ? "primary" : "accent"}
            >
              Supabase client{" "}
              {runtime.supabaseClientConfigured ? "ready" : "missing"}
            </Badge>
            <Badge
              variant={runtime.supabaseAdminConfigured ? "primary" : "accent"}
            >
              Supabase admin{" "}
              {runtime.supabaseAdminConfigured ? "ready" : "missing"}
            </Badge>
            <Badge variant={runtime.openAIConfigured ? "primary" : "accent"}>
              OpenAI {runtime.openAIConfigured ? "ready" : "missing"}
            </Badge>
            <Badge
              variant={runtime.liveProcessingConfigured ? "primary" : "accent"}
            >
              Live processing{" "}
              {runtime.liveProcessingConfigured ? "ready" : "disabled"}
            </Badge>
          </div>
          <p className="mt-4 text-sm leading-7 text-muted-foreground">
            {runtime.liveProcessingConfigured
              ? "Real uploads, queue-backed processing, and grounded Ask AI are enabled in this workspace."
              : `Live processing is disabled until these variables are configured: ${runtime.missing.liveProcessing.join(", ")}.`}
          </p>
          <p className="mt-3 text-sm leading-7 text-muted-foreground">
            {runtime.supabaseClientConfigured
              ? "Meeting deletion removes both the database row and the private audio object once storage cleanup succeeds."
              : "The /app workspace will remain unavailable until Supabase public credentials are configured."}
          </p>
        </Card>
      </div>
    </div>
  )
}
