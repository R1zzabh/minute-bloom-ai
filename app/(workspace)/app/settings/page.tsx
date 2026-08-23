import { Card } from "@/components/ui/card"

export default function SettingsPage() {
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
            Email identity, redirect handling, and sign-out controls are
            connected in the auth milestone.
          </p>
        </Card>
        <Card>
          <h2 className="text-lg font-semibold">Theme</h2>
          <p className="mt-3 text-sm leading-7 text-muted-foreground">
            Class-based light and dark mode are available globally and respect
            hydration safety.
          </p>
        </Card>
        <Card>
          <h2 className="text-lg font-semibold">Data controls</h2>
          <p className="mt-3 text-sm leading-7 text-muted-foreground">
            Meeting deletion, storage cleanup, and ownership protections are
            implemented alongside the data layer.
          </p>
        </Card>
      </div>
    </div>
  )
}
