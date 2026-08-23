import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

const mocks = vi.hoisted(() => {
  class MockAPIError extends Error {
    status: number | undefined
    headers: Headers | undefined
    error: object | undefined
    code: string | null | undefined
    type: string | undefined

    constructor(
      status?: number,
      error?: Record<string, unknown>,
      message?: string,
      headers?: Headers
    ) {
      super(message ?? "API error")
      this.status = status
      this.headers = headers
      this.error = error
      this.code = typeof error?.code === "string" ? error.code : undefined
      this.type = typeof error?.type === "string" ? error.type : undefined
    }
  }

  class MockAPIConnectionError extends MockAPIError {}
  class MockAPIConnectionTimeoutError extends MockAPIConnectionError {}
  class MockAuthenticationError extends MockAPIError {}
  class MockPermissionDeniedError extends MockAPIError {}
  class MockRateLimitError extends MockAPIError {}

  const client = {
    withOptions: vi.fn(),
  }
  class MockOpenAI {
    constructor() {
      return client as unknown as MockOpenAI
    }
  }

  return {
    APIError: MockAPIError,
    APIConnectionError: MockAPIConnectionError,
    APIConnectionTimeoutError: MockAPIConnectionTimeoutError,
    AuthenticationError: MockAuthenticationError,
    PermissionDeniedError: MockPermissionDeniedError,
    RateLimitError: MockRateLimitError,
    client,
    openAIConstructor: MockOpenAI,
  }
})

vi.mock("openai", () => ({
  default: mocks.openAIConstructor,
  APIError: mocks.APIError,
  APIConnectionError: mocks.APIConnectionError,
  APIConnectionTimeoutError: mocks.APIConnectionTimeoutError,
  AuthenticationError: mocks.AuthenticationError,
  PermissionDeniedError: mocks.PermissionDeniedError,
  RateLimitError: mocks.RateLimitError,
}))

import {
  normalizeAIError,
  resetAIClientCache,
  runAIRequest,
} from "@/lib/ai/provider"

const originalEnv = { ...process.env }

describe("ai provider", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    process.env = {
      ...originalEnv,
      AI_PROVIDER: "groq",
      GROQ_API_KEY: "gsk-test",
      GROQ_BASE_URL: "https://api.groq.com/openai/v1",
      GROQ_TRANSCRIPTION_MODEL: "whisper-large-v3-turbo",
      GROQ_SUMMARY_MODEL: "openai/gpt-oss-20b",
    }
    mocks.client.withOptions.mockReturnValue(mocks.client)
    resetAIClientCache()
  })

  afterEach(() => {
    process.env = { ...originalEnv }
    resetAIClientCache()
  })

  it("retries Groq rate limits using Retry-After headers", async () => {
    let attempts = 0

    const request = runAIRequest("summary", async () => {
      attempts += 1

      if (attempts === 1) {
        throw new mocks.RateLimitError(
          429,
          {
            code: "rate_limit_exceeded",
            message: "slow down",
          },
          "429 slow down",
          new Headers({ "retry-after-ms": "10" })
        )
      }

      return "ok"
    })

    await expect(request).resolves.toBe("ok")
    expect(attempts).toBe(2)
  })

  it("normalizes Groq quota failures safely", () => {
    const error = new mocks.RateLimitError(
      429,
      {
        code: "insufficient_quota",
        type: "insufficient_quota",
        message: "quota exceeded",
      },
      "429 quota exceeded",
      new Headers()
    )

    expect(normalizeAIError(error, "transcription")).toBe(
      "Groq transcription is rate-limited right now (429 insufficient_quota). Retry the meeting shortly."
    )
  })
})
