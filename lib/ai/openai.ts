import OpenAI, {
  APIConnectionError,
  APIConnectionTimeoutError,
  APIError,
  RateLimitError,
} from "openai"

import { getServerEnv } from "@/lib/env"

let cachedClient: OpenAI | null = null

const TRANSCRIPTION_TIMEOUT_MS = 120_000
const SUMMARY_TIMEOUT_MS = 45_000
const OPENAI_RETRY_DELAYS_MS = [1_000, 3_000] as const

export function getOpenAIClient() {
  if (!cachedClient) {
    const env = getServerEnv()

    if (!env.OPENAI_API_KEY) {
      throw new Error("OPENAI_API_KEY is not configured.")
    }

    cachedClient = new OpenAI({
      apiKey: env.OPENAI_API_KEY,
      maxRetries: 0,
    })
  }

  return cachedClient
}

export function getTranscriptionModel() {
  const env = getServerEnv()
  return env.OPENAI_TRANSCRIPTION_MODEL ?? "gpt-4o-transcribe-diarize"
}

export function getSummaryModel() {
  const env = getServerEnv()
  return env.OPENAI_SUMMARY_MODEL ?? "gpt-4.1-mini"
}

export function getOpenAITimeoutMs(context: "transcription" | "summary") {
  return context === "transcription"
    ? TRANSCRIPTION_TIMEOUT_MS
    : SUMMARY_TIMEOUT_MS
}

function isRetriableOpenAIError(error: unknown) {
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

function sleep(ms: number) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms)
  })
}

export async function runOpenAIRequest<T>(
  context: "transcription" | "summary",
  operation: (client: OpenAI) => Promise<T>
) {
  let lastError: unknown

  for (
    let attempt = 0;
    attempt <= OPENAI_RETRY_DELAYS_MS.length;
    attempt += 1
  ) {
    try {
      const client = getOpenAIClient().withOptions({
        timeout: getOpenAITimeoutMs(context),
        maxRetries: 0,
      })

      return await operation(client)
    } catch (error) {
      lastError = error

      if (
        attempt === OPENAI_RETRY_DELAYS_MS.length ||
        !isRetriableOpenAIError(error)
      ) {
        break
      }

      await sleep(OPENAI_RETRY_DELAYS_MS[attempt]!)
    }
  }

  throw new Error(normalizeOpenAIError(lastError, context))
}

export function normalizeOpenAIError(
  error: unknown,
  context: "transcription" | "summary"
) {
  if (error instanceof APIConnectionTimeoutError) {
    return `OpenAI ${context} timed out. Retry the meeting in a moment.`
  }

  if (error instanceof APIConnectionError) {
    return `OpenAI ${context} is temporarily unavailable. Retry the meeting in a moment.`
  }

  if (error instanceof RateLimitError) {
    return `OpenAI ${context} is rate-limited right now. Retry the meeting shortly.`
  }

  if (error instanceof APIError) {
    const message = error.message.toLowerCase()

    if (message.includes("model") && message.includes("not found")) {
      return `The configured OpenAI ${context} model is unavailable. Check ${context === "transcription" ? "OPENAI_TRANSCRIPTION_MODEL" : "OPENAI_SUMMARY_MODEL"}.`
    }

    if (message.includes("unsupported") && message.includes("response")) {
      return `The configured OpenAI ${context} model does not support the required response format. Check ${context === "transcription" ? "OPENAI_TRANSCRIPTION_MODEL" : "OPENAI_SUMMARY_MODEL"}.`
    }

    if (message.includes("invalid") && message.includes("api key")) {
      return "OPENAI_API_KEY is invalid."
    }
  }

  if (error instanceof Error) {
    return error.message
  }

  return `OpenAI ${context} failed.`
}
