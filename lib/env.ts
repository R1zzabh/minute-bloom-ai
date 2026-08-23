type PublicEnv = {
  NEXT_PUBLIC_APP_URL?: string
  NEXT_PUBLIC_SUPABASE_URL?: string
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?: string
  NEXT_PUBLIC_SUPABASE_ANON_KEY?: string
  supabasePublicKey?: string
}

type ServerEnv = PublicEnv & {
  SUPABASE_SECRET_KEY?: string
  SUPABASE_SERVICE_ROLE_KEY?: string
  supabaseServerKey?: string
  OPENAI_API_KEY?: string
  OPENAI_TRANSCRIPTION_MODEL?: string
  OPENAI_SUMMARY_MODEL?: string
  CRON_SECRET?: string
}

type RuntimeConfiguration = {
  appUrlConfigured: boolean
  supabaseClientConfigured: boolean
  supabaseAdminConfigured: boolean
  openAIConfigured: boolean
  workerConfigured: boolean
  liveProcessingConfigured: boolean
  demoMode: boolean
  usesLegacySupabaseAnonKey: boolean
  usesLegacySupabaseServiceRoleKey: boolean
  missing: {
    appUrl: string[]
    supabaseClient: string[]
    supabaseAdmin: string[]
    openAI: string[]
    worker: string[]
    liveProcessing: string[]
  }
}

function normalizeOptionalEnv(value: string | undefined) {
  if (typeof value !== "string") {
    return undefined
  }

  const normalized = value.trim()
  return normalized.length > 0 ? normalized : undefined
}

function normalizeOptionalUrl(value: string | undefined) {
  const normalized = normalizeOptionalEnv(value)

  if (!normalized) {
    return undefined
  }

  return new URL(normalized).toString().replace(/\/$/, "")
}

export function getPublicEnv(): PublicEnv {
  const publishableKey = normalizeOptionalEnv(
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
  )
  const legacyAnonKey = normalizeOptionalEnv(
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  )

  return {
    NEXT_PUBLIC_APP_URL: normalizeOptionalUrl(process.env.NEXT_PUBLIC_APP_URL),
    NEXT_PUBLIC_SUPABASE_URL: normalizeOptionalUrl(
      process.env.NEXT_PUBLIC_SUPABASE_URL
    ),
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: publishableKey,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: legacyAnonKey,
    supabasePublicKey: publishableKey ?? legacyAnonKey,
  }
}

export function getServerEnv(): ServerEnv {
  const publicEnv = getPublicEnv()
  const secretKey = normalizeOptionalEnv(process.env.SUPABASE_SECRET_KEY)
  const legacyServiceRoleKey = normalizeOptionalEnv(
    process.env.SUPABASE_SERVICE_ROLE_KEY
  )

  return {
    ...publicEnv,
    SUPABASE_SECRET_KEY: secretKey,
    SUPABASE_SERVICE_ROLE_KEY: legacyServiceRoleKey,
    supabaseServerKey: secretKey ?? legacyServiceRoleKey,
    OPENAI_API_KEY: normalizeOptionalEnv(process.env.OPENAI_API_KEY),
    OPENAI_TRANSCRIPTION_MODEL: normalizeOptionalEnv(
      process.env.OPENAI_TRANSCRIPTION_MODEL
    ),
    OPENAI_SUMMARY_MODEL: normalizeOptionalEnv(
      process.env.OPENAI_SUMMARY_MODEL
    ),
    CRON_SECRET: normalizeOptionalEnv(process.env.CRON_SECRET),
  }
}

export function getRuntimeConfiguration(): RuntimeConfiguration {
  const publicEnv = getPublicEnv()
  const serverEnv = getServerEnv()

  const appUrlConfigured = Boolean(publicEnv.NEXT_PUBLIC_APP_URL)
  const supabaseClientConfigured = Boolean(
    publicEnv.NEXT_PUBLIC_SUPABASE_URL && publicEnv.supabasePublicKey
  )
  const supabaseAdminConfigured = Boolean(
    supabaseClientConfigured && serverEnv.supabaseServerKey
  )
  const openAIConfigured = Boolean(
    serverEnv.OPENAI_API_KEY &&
    serverEnv.OPENAI_TRANSCRIPTION_MODEL &&
    serverEnv.OPENAI_SUMMARY_MODEL
  )
  const workerConfigured = Boolean(serverEnv.CRON_SECRET)
  const liveProcessingConfigured = Boolean(
    supabaseAdminConfigured && openAIConfigured && workerConfigured
  )

  const missingAppUrl = appUrlConfigured ? [] : ["NEXT_PUBLIC_APP_URL"]
  const missingSupabaseClient = [
    !publicEnv.NEXT_PUBLIC_SUPABASE_URL ? "NEXT_PUBLIC_SUPABASE_URL" : null,
    !publicEnv.supabasePublicKey
      ? "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY or NEXT_PUBLIC_SUPABASE_ANON_KEY"
      : null,
  ].filter((value): value is string => Boolean(value))
  const missingSupabaseAdmin = [
    ...missingSupabaseClient,
    !serverEnv.supabaseServerKey
      ? "SUPABASE_SECRET_KEY or SUPABASE_SERVICE_ROLE_KEY"
      : null,
  ].filter((value): value is string => Boolean(value))
  const missingOpenAI = [
    !serverEnv.OPENAI_API_KEY ? "OPENAI_API_KEY" : null,
    !serverEnv.OPENAI_TRANSCRIPTION_MODEL ? "OPENAI_TRANSCRIPTION_MODEL" : null,
    !serverEnv.OPENAI_SUMMARY_MODEL ? "OPENAI_SUMMARY_MODEL" : null,
  ].filter((value): value is string => Boolean(value))
  const missingWorker = workerConfigured ? [] : ["CRON_SECRET"]

  return {
    appUrlConfigured,
    supabaseClientConfigured,
    supabaseAdminConfigured,
    openAIConfigured,
    workerConfigured,
    liveProcessingConfigured,
    demoMode: !supabaseClientConfigured,
    usesLegacySupabaseAnonKey: Boolean(
      !publicEnv.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY &&
      publicEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY
    ),
    usesLegacySupabaseServiceRoleKey: Boolean(
      !serverEnv.SUPABASE_SECRET_KEY && serverEnv.SUPABASE_SERVICE_ROLE_KEY
    ),
    missing: {
      appUrl: missingAppUrl,
      supabaseClient: missingSupabaseClient,
      supabaseAdmin: missingSupabaseAdmin,
      openAI: missingOpenAI,
      worker: missingWorker,
      liveProcessing: [
        ...missingSupabaseAdmin,
        ...missingOpenAI,
        ...missingWorker,
      ],
    },
  }
}

export function hasConfiguredSupabase() {
  return getRuntimeConfiguration().supabaseClientConfigured
}

export function hasConfiguredSupabaseAdmin() {
  return getRuntimeConfiguration().supabaseAdminConfigured
}

export function hasConfiguredOpenAI() {
  return getRuntimeConfiguration().openAIConfigured
}

export function hasConfiguredLiveProcessing() {
  return getRuntimeConfiguration().liveProcessingConfigured
}

export function isDemoMode() {
  return getRuntimeConfiguration().demoMode
}

export function getMissingConfigurationMessage(
  scope: keyof RuntimeConfiguration["missing"]
) {
  const config = getRuntimeConfiguration()
  const missing = config.missing[scope]

  if (missing.length === 0) {
    return null
  }

  return `Missing configuration: ${missing.join(", ")}.`
}
