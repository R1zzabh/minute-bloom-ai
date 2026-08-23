import { getRuntimeConfiguration } from "@/lib/env"

export async function GET() {
  const runtime = getRuntimeConfiguration()

  return Response.json({
    ok: true,
    service: "minute-bloom",
    timestamp: new Date().toISOString(),
    runtime: {
      appUrlConfigured: runtime.appUrlConfigured,
      supabaseClientConfigured: runtime.supabaseClientConfigured,
      supabaseAdminConfigured: runtime.supabaseAdminConfigured,
      openAIConfigured: runtime.openAIConfigured,
      liveProcessingConfigured: runtime.liveProcessingConfigured,
      demoMode: runtime.demoMode,
    },
  })
}
