import { getPublicEnv, getRuntimeConfiguration, getServerEnv } from "@/lib/env"

const originalEnv = { ...process.env }

function resetEnv(overrides: Record<string, string | undefined>) {
  process.env = { ...originalEnv }

  for (const [key, value] of Object.entries(overrides)) {
    if (value === undefined) {
      delete process.env[key]
    } else {
      process.env[key] = value
    }
  }
}

describe("environment configuration", () => {
  afterEach(() => {
    process.env = { ...originalEnv }
  })

  it("treats missing credentials as demo mode", () => {
    resetEnv({})

    const runtime = getRuntimeConfiguration()

    expect(runtime.demoMode).toBe(true)
    expect(runtime.supabaseClientConfigured).toBe(false)
    expect(runtime.liveProcessingConfigured).toBe(false)
    expect(runtime.missing.supabaseClient).toContain("NEXT_PUBLIC_SUPABASE_URL")
  })

  it("supports the publishable key and secret key canonical names", () => {
    resetEnv({
      NEXT_PUBLIC_SUPABASE_URL: " https://example.supabase.co ",
      NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: " sb_publishable_test ",
      SUPABASE_SECRET_KEY: " sb_secret_test ",
      OPENAI_API_KEY: " sk-test ",
      OPENAI_TRANSCRIPTION_MODEL: " gpt-4o-transcribe-diarize ",
      OPENAI_SUMMARY_MODEL: " gpt-4.1-mini ",
      CRON_SECRET: " cron-secret ",
    })

    const publicEnv = getPublicEnv()
    const serverEnv = getServerEnv()
    const runtime = getRuntimeConfiguration()

    expect(publicEnv.supabasePublicKey).toBe("sb_publishable_test")
    expect(serverEnv.supabaseServerKey).toBe("sb_secret_test")
    expect(runtime.supabaseClientConfigured).toBe(true)
    expect(runtime.supabaseAdminConfigured).toBe(true)
    expect(runtime.liveProcessingConfigured).toBe(true)
    expect(runtime.demoMode).toBe(false)
  })

  it("supports the legacy anon and service-role aliases", () => {
    resetEnv({
      NEXT_PUBLIC_SUPABASE_URL: "https://example.supabase.co",
      NEXT_PUBLIC_SUPABASE_ANON_KEY: "legacy-anon",
      SUPABASE_SERVICE_ROLE_KEY: "legacy-service-role",
      OPENAI_API_KEY: "sk-test",
      OPENAI_TRANSCRIPTION_MODEL: "gpt-4o-transcribe-diarize",
      OPENAI_SUMMARY_MODEL: "gpt-4.1-mini",
      CRON_SECRET: "cron-secret",
    })

    const runtime = getRuntimeConfiguration()

    expect(runtime.usesLegacySupabaseAnonKey).toBe(true)
    expect(runtime.usesLegacySupabaseServiceRoleKey).toBe(true)
    expect(runtime.liveProcessingConfigured).toBe(true)
  })

  it("treats whitespace-only variables as missing", () => {
    resetEnv({
      NEXT_PUBLIC_SUPABASE_URL: "   ",
      NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "   ",
      SUPABASE_SECRET_KEY: "   ",
      OPENAI_API_KEY: "   ",
      OPENAI_TRANSCRIPTION_MODEL: "   ",
      OPENAI_SUMMARY_MODEL: "   ",
      CRON_SECRET: "   ",
    })

    const runtime = getRuntimeConfiguration()

    expect(runtime.supabaseClientConfigured).toBe(false)
    expect(runtime.supabaseAdminConfigured).toBe(false)
    expect(runtime.openAIConfigured).toBe(false)
    expect(runtime.workerConfigured).toBe(false)
  })

  it("distinguishes public supabase-only from full live processing", () => {
    resetEnv({
      NEXT_PUBLIC_SUPABASE_URL: "https://example.supabase.co",
      NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "sb_publishable_test",
    })

    const runtime = getRuntimeConfiguration()

    expect(runtime.supabaseClientConfigured).toBe(true)
    expect(runtime.supabaseAdminConfigured).toBe(false)
    expect(runtime.openAIConfigured).toBe(false)
    expect(runtime.liveProcessingConfigured).toBe(false)
  })

  it("keeps openai-only configuration out of live mode", () => {
    resetEnv({
      OPENAI_API_KEY: "sk-test",
      OPENAI_TRANSCRIPTION_MODEL: "gpt-4o-transcribe-diarize",
      OPENAI_SUMMARY_MODEL: "gpt-4.1-mini",
      CRON_SECRET: "cron-secret",
    })

    const runtime = getRuntimeConfiguration()

    expect(runtime.openAIConfigured).toBe(true)
    expect(runtime.supabaseClientConfigured).toBe(false)
    expect(runtime.liveProcessingConfigured).toBe(false)
  })
})
