import { SignOutButton } from "@/components/shared/sign-out-button"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import { hasConfiguredOpenAI, hasConfiguredSupabase } from "@/lib/env"
import { getAuthenticatedUser } from "@/lib/supabase/server"

export default async function SettingsPage() {
  const user = hasConfiguredSupabase() ? await getAuthenticatedUser() : null

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
            <Badge variant={hasConfiguredSupabase() ? "primary" : "accent"}>
              Supabase {hasConfiguredSupabase() ? "ready" : "missing"}
            </Badge>
            <Badge variant={hasConfiguredOpenAI() ? "primary" : "accent"}>
              OpenAI {hasConfiguredOpenAI() ? "ready" : "missing"}
            </Badge>
          </div>
          <p className="mt-4 text-sm leading-7 text-muted-foreground">
            Meeting deletion removes both the database row and the private audio
            object when live credentials are configured.
          </p>
        </Card>
      </div>
    </div>
  )
}
