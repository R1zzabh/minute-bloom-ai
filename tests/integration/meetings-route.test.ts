import { afterEach, describe, expect, it, vi } from "vitest"

const mocks = vi.hoisted(() => ({
  getRuntimeConfiguration: vi.fn(),
  getMissingConfigurationMessage: vi.fn((): string | null => null),
  getAuthenticatedUser: vi.fn(),
  takeRateLimitToken: vi.fn(),
  createMeetingRecord: vi.fn(),
}))

vi.mock("@/lib/env", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/env")>()
  return {
    ...actual,
    getMissingConfigurationMessage: mocks.getMissingConfigurationMessage,
    getRuntimeConfiguration: mocks.getRuntimeConfiguration,
  }
})

vi.mock("@/lib/meetings/rate-limit", () => ({
  takeRateLimitToken: mocks.takeRateLimitToken,
}))

vi.mock("@/lib/meetings/mutations", () => ({
  createMeetingRecord: mocks.createMeetingRecord,
}))

vi.mock("@/lib/supabase/server", () => ({
  getAuthenticatedUser: mocks.getAuthenticatedUser,
}))

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}))

import { POST } from "@/app/api/meetings/route"

describe("meetings route", () => {
  afterEach(() => {
    vi.clearAllMocks()
    mocks.getRuntimeConfiguration.mockReturnValue({
      liveProcessingConfigured: true,
    })
    mocks.getAuthenticatedUser.mockResolvedValue({ id: "user-1" })
    mocks.takeRateLimitToken.mockResolvedValue(true)
    mocks.createMeetingRecord.mockResolvedValue({
      id: "meeting-1",
      storagePath: "user-1/meeting-1/demo.mp3",
      status: "uploading",
    })
  })

  it("returns 503 when live processing is not configured", async () => {
    mocks.getRuntimeConfiguration.mockReturnValue({
      liveProcessingConfigured: false,
    })
    mocks.getMissingConfigurationMessage.mockReturnValue(
      "Missing configuration: OPENAI_API_KEY."
    )

    const response = await POST(
      new Request("http://localhost/api/meetings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          origin: "http://localhost",
        },
        body: JSON.stringify({
          originalFileName: "demo.mp3",
          mimeType: "audio/mpeg",
          sizeBytes: 1024,
        }),
      })
    )

    expect(response.status).toBe(503)
    expect(await response.json()).toEqual({
      error: "Missing configuration: OPENAI_API_KEY.",
    })
  })

  it("returns 429 when the shared upload rate limit is exhausted", async () => {
    mocks.takeRateLimitToken.mockResolvedValue(false)

    const response = await POST(
      new Request("http://localhost/api/meetings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          origin: "http://localhost",
        },
        body: JSON.stringify({
          title: "Launch sync",
          originalFileName: "demo.mp3",
          mimeType: "audio/mpeg",
          sizeBytes: 1024,
        }),
      })
    )

    expect(response.status).toBe(429)
  })

  it("creates a meeting when configuration and rate limits are satisfied", async () => {
    const response = await POST(
      new Request("http://localhost/api/meetings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          origin: "http://localhost",
        },
        body: JSON.stringify({
          title: "Launch sync",
          originalFileName: "demo.mp3",
          mimeType: "audio/mpeg",
          sizeBytes: 1024,
        }),
      })
    )

    expect(response.status).toBe(201)
    expect(await response.json()).toEqual({
      meeting: {
        id: "meeting-1",
        storagePath: "user-1/meeting-1/demo.mp3",
        status: "uploading",
      },
    })
    expect(mocks.createMeetingRecord).toHaveBeenCalledWith("user-1", {
      title: "Launch sync",
      language: "auto",
      originalFileName: "demo.mp3",
      mimeType: "audio/mpeg",
      sizeBytes: 1024,
    })
  })
})
