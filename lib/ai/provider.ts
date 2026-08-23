import OpenAI, {
  APIConnectionError,
  APIConnectionTimeoutError,
  APIError,
  AuthenticationError,
  PermissionDeniedError,
  RateLimitError,
} from "openai"

import { getServerEnv, type AIProvider } from "@/lib/env"

const TRANSCRIPTION_TIMEOUT_MS = 120_000
const SUMMARY_TIMEOUT_MS = 45_000
const DEFAULT_RETRY_DELAYS_MS = [1_000, 3_000] as const
const MAX_RATE_LIMIT_DELAY_MS = 30_000

const cachedClients = new Map<string, OpenAI>()

export type AIContext = "transcription" | "summary"

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max)
}

function sleep(ms: number) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms)
  })
}

function parseRetryAfterMs(headers: Headers | undefined) {
  const retryAfterMs = headers?.get("retry-after-ms")

  if (retryAfterMs) {
    const milliseconds = Number(retryAfterMs)

    if (Number.isFinite(milliseconds) && milliseconds >= 0) {
      return clamp(milliseconds, 0, MAX_RATE_LIMIT_DELAY_MS)
    }
  }

  const retryAfter = headers?.get("retry-after")

  if (!retryAfter) {
    return null
  }

  const seconds = Number(retryAfter)

  if (Number.isFinite(seconds) && seconds >= 0) {
    return clamp(seconds * 1000, 0, MAX_RATE_LIMIT_DELAY_MS)
  }

  const parsedDate = Date.parse(retryAfter)

  if (!Number.isFinite(parsedDate)) {
    return null
  }

  return clamp(parsedDate - Date.now(), 0, MAX_RATE_LIMIT_DELAY_MS)
}

function getProviderLabel(provider: AIProvider) {
  return provider === "groq" ? "Groq" : "OpenAI"
}

function getProviderKeyEnvVar(provider: AIProvider) {
  return provider === "groq" ? "GROQ_API_KEY" : "OPENAI_API_KEY"
}

function getProviderModelEnvVar(provider: AIProvider, context: AIContext) {
  if (provider === "groq") {
    return context === "transcription"
      ? "GROQ_TRANSCRIPTION_MODEL"
      : "GROQ_SUMMARY_MODEL"
  }

  return context === "transcription"
    ? "OPENAI_TRANSCRIPTION_MODEL"
    : "OPENAI_SUMMARY_MODEL"
}

function formatAIErrorMetadata(error: APIError) {
  const parts: string[] = []

  if (typeof error.status === "number") {
    parts.push(String(error.status))
  }

  if (typeof error.code === "string" && error.code.trim().length > 0) {
    parts.push(error.code.trim())
  } else if (typeof error.type === "string" && error.type.trim().length > 0) {
    parts.push(error.type.trim())
  }

  return parts.length > 0 ? ` (${parts.join(" ")})` : ""
}

export function getAIProvider() {
  return getServerEnv().AI_PROVIDER ?? "openai"
}

export function getAIProviderLabel() {
  return getProviderLabel(getAIProvider())
}

export function getTranscriptionModel() {
  const env = getServerEnv()

  if (env.AI_PROVIDER === "groq") {
    return env.GROQ_TRANSCRIPTION_MODEL ?? "whisper-large-v3-turbo"
  }

  return env.OPENAI_TRANSCRIPTION_MODEL ?? "gpt-4o-transcribe-diarize"
}

export function getSummaryModel() {
  const env = getServerEnv()

  if (env.AI_PROVIDER === "groq") {
    return env.GROQ_SUMMARY_MODEL ?? "openai/gpt-oss-20b"
  }

  return env.OPENAI_SUMMARY_MODEL ?? "gpt-4.1-mini"
}

function getProviderConfiguration(provider: AIProvider) {
  const env = getServerEnv()

  if (provider === "groq") {
    return {
      apiKey: env.GROQ_API_KEY,
      baseURL: env.GROQ_BASE_URL ?? "https://api.groq.com/openai/v1",
    }
  }

  return {
    apiKey: env.OPENAI_API_KEY,
    baseURL: undefined,
  }
}

export function getAIClient() {
  const provider = getAIProvider()
  const configuration = getProviderConfiguration(provider)

  if (!configuration.apiKey) {
    throw new Error(`${getProviderKeyEnvVar(provider)} is not configured.`)
  }

  const cacheKey = `${provider}:${configuration.baseURL ?? "default"}:${configuration.apiKey}`
  const cachedClient = cachedClients.get(cacheKey)

  if (cachedClient) {
    return cachedClient
  }

  const client = new OpenAI({
    apiKey: configuration.apiKey,
    baseURL: configuration.baseURL,
    maxRetries: 0,
  })

  cachedClients.set(cacheKey, client)
  return client
}

export function getAITimeoutMs(context: AIContext) {
  return context === "transcription"
    ? TRANSCRIPTION_TIMEOUT_MS
    : SUMMARY_TIMEOUT_MS
}

function isRetriableAIError(error: unknown) {
  if (
    error instanceof APIConnectionTimeoutError ||
    error instanceof APIConnectionError ||
    error instanceof RateLimitError
  ) {
    return true
  }

  if (error instanceof APIError) {
    return (
      error.status === 408 ||
      error.status === 409 ||
      error.status === 429 ||
      Boolean(error.status && error.status >= 500)
    )
  }

  return false
}

function getRetryDelayMs(error: unknown, attempt: number) {
  if (error instanceof RateLimitError) {
    const retryAfterMs = parseRetryAfterMs(error.headers)

    if (retryAfterMs !== null) {
      return retryAfterMs
    }
  }

  return DEFAULT_RETRY_DELAYS_MS[attempt] ?? null
}

export async function runAIRequest<T>(
  context: AIContext,
  operation: (client: OpenAI) => Promise<T>
) {
  let lastError: unknown

  for (
    let attempt = 0;
    attempt <= DEFAULT_RETRY_DELAYS_MS.length;
    attempt += 1
  ) {
    try {
      const client = getAIClient().withOptions({
        timeout: getAITimeoutMs(context),
        maxRetries: 0,
      })

      return await operation(client)
    } catch (error) {
      lastError = error

      const retryDelayMs = getRetryDelayMs(error, attempt)

      if (!isRetriableAIError(error) || retryDelayMs === null) {
        break
      }

      await sleep(retryDelayMs)
    }
  }

  throw new Error(normalizeAIError(lastError, context))
}

export function normalizeAIError(error: unknown, context: AIContext) {
  const provider = getAIProvider()
  const providerLabel = getProviderLabel(provider)
  const modelEnvVar = getProviderModelEnvVar(provider, context)

  if (error instanceof APIConnectionTimeoutError) {
    return `${providerLabel} ${context} timed out. Retry the meeting in a moment.`
  }

  if (error instanceof APIConnectionError) {
    return `${providerLabel} ${context} is temporarily unavailable. Retry the meeting in a moment.`
  }

  if (error instanceof RateLimitError) {
    return `${providerLabel} ${context} is rate-limited right now${formatAIErrorMetadata(error)}. Retry the meeting shortly.`
  }

  if (error instanceof AuthenticationError) {
    return `${getProviderKeyEnvVar(provider)} is invalid${formatAIErrorMetadata(error)}.`
  }

  if (error instanceof PermissionDeniedError) {
    const message = error.message.toLowerCase()

    if (message.includes("quota") || message.includes("billing")) {
      return `${providerLabel} ${context} is unavailable for this project${formatAIErrorMetadata(error)}. Check billing and model access.`
    }
  }

  if (error instanceof APIError) {
    const message = error.message.toLowerCase()
    const metadata = formatAIErrorMetadata(error)

    if (message.includes("model") && message.includes("not found")) {
      return `The configured ${providerLabel} ${context} model is unavailable${metadata}. Check ${modelEnvVar}.`
    }

    if (
      (message.includes("unsupported") && message.includes("response")) ||
      message.includes("json schema")
    ) {
      return `The configured ${providerLabel} ${context} model does not support the required response format${metadata}. Check ${modelEnvVar}.`
    }

    if (message.includes("invalid") && message.includes("api key")) {
      return `${getProviderKeyEnvVar(provider)} is invalid${metadata}.`
    }

    if (message.includes("quota") || message.includes("billing")) {
      return `${providerLabel} ${context} is unavailable for this project${metadata}. Check billing and model access.`
    }

    return `${providerLabel} ${context} failed${metadata}.`
  }

  if (error instanceof Error) {
    return error.message
  }

  return `${providerLabel} ${context} failed.`
}

export function resetAIClientCache() {
  cachedClients.clear()
}
