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
      AI_PROVIDER: " groq ",
      GROQ_API_KEY: " gsk-test ",
      GROQ_BASE_URL: " https://api.groq.com/openai/v1 ",
      GROQ_TRANSCRIPTION_MODEL: " whisper-large-v3-turbo ",
      GROQ_SUMMARY_MODEL: " openai/gpt-oss-20b ",
      CRON_SECRET: " cron-secret ",
    })

    const publicEnv = getPublicEnv()
    const serverEnv = getServerEnv()
    const runtime = getRuntimeConfiguration()

    expect(publicEnv.supabasePublicKey).toBe("sb_publishable_test")
    expect(serverEnv.supabaseServerKey).toBe("sb_secret_test")
    expect(serverEnv.AI_PROVIDER).toBe("groq")
    expect(runtime.aiProvider).toBe("groq")
    expect(runtime.groqConfigured).toBe(true)
    expect(runtime.aiConfigured).toBe(true)
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
      AI_PROVIDER: "groq",
      GROQ_API_KEY: "gsk-test",
      GROQ_BASE_URL: "https://api.groq.com/openai/v1",
      GROQ_TRANSCRIPTION_MODEL: "whisper-large-v3-turbo",
      GROQ_SUMMARY_MODEL: "openai/gpt-oss-20b",
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
      GROQ_API_KEY: "   ",
      GROQ_BASE_URL: "   ",
      GROQ_TRANSCRIPTION_MODEL: "   ",
      GROQ_SUMMARY_MODEL: "   ",
      CRON_SECRET: "   ",
    })

    const runtime = getRuntimeConfiguration()

    expect(runtime.supabaseClientConfigured).toBe(false)
    expect(runtime.supabaseAdminConfigured).toBe(false)
    expect(runtime.groqConfigured).toBe(false)
    expect(runtime.aiConfigured).toBe(false)
    expect(runtime.workerConfigured).toBe(false)
  })

  it("distinguishes public supabase-only from full live processing", () => {
    resetEnv({
      NEXT_PUBLIC_SUPABASE_URL: "https://example.supabase.co",
      NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "sb_publishable_test",
      AI_PROVIDER: "groq",
    })

    const runtime = getRuntimeConfiguration()

    expect(runtime.supabaseClientConfigured).toBe(true)
    expect(runtime.supabaseAdminConfigured).toBe(false)
    expect(runtime.aiConfigured).toBe(false)
    expect(runtime.liveProcessingConfigured).toBe(false)
  })

  it("keeps ai-only configuration out of live mode without supabase", () => {
    resetEnv({
      AI_PROVIDER: "groq",
      GROQ_API_KEY: "gsk-test",
      GROQ_BASE_URL: "https://api.groq.com/openai/v1",
      GROQ_TRANSCRIPTION_MODEL: "whisper-large-v3-turbo",
      GROQ_SUMMARY_MODEL: "openai/gpt-oss-20b",
      CRON_SECRET: "cron-secret",
    })

    const runtime = getRuntimeConfiguration()

    expect(runtime.groqConfigured).toBe(true)
    expect(runtime.supabaseClientConfigured).toBe(false)
    expect(runtime.liveProcessingConfigured).toBe(false)
  })

  it("keeps inactive openai settings from blocking groq live mode", () => {
    resetEnv({
      NEXT_PUBLIC_SUPABASE_URL: "https://example.supabase.co",
      NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "sb_publishable_test",
      SUPABASE_SECRET_KEY: "sb_secret_test",
      AI_PROVIDER: "groq",
      GROQ_API_KEY: "gsk-test",
      GROQ_BASE_URL: "https://api.groq.com/openai/v1",
      GROQ_TRANSCRIPTION_MODEL: "whisper-large-v3-turbo",
      GROQ_SUMMARY_MODEL: "openai/gpt-oss-20b",
      OPENAI_API_KEY: "sk-unused",
      CRON_SECRET: "cron-secret",
    })

    const runtime = getRuntimeConfiguration()

    expect(runtime.groqConfigured).toBe(true)
    expect(runtime.openAIConfigured).toBe(false)
    expect(runtime.liveProcessingConfigured).toBe(true)
  })
})
