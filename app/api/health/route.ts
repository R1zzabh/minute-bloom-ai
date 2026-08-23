import { getRuntimeConfiguration } from "@/lib/env"

export async function GET() {
  const runtime = getRuntimeConfiguration()

  return Response.json({
    ok: true,
    service: "minute-bloom",
    timestamp: new Date().toISOString(),
    runtime: {
      aiProvider: runtime.aiProvider,
      appUrlConfigured: runtime.appUrlConfigured,
      supabaseClientConfigured: runtime.supabaseClientConfigured,
      supabaseAdminConfigured: runtime.supabaseAdminConfigured,
      aiConfigured: runtime.aiConfigured,
      openAIConfigured: runtime.openAIConfigured,
      groqConfigured: runtime.groqConfigured,
      liveProcessingConfigured: runtime.liveProcessingConfigured,
      demoMode: runtime.demoMode,
    },
  })
}
