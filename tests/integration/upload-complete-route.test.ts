import { beforeEach, describe, expect, it, vi } from "vitest"

const mocks = vi.hoisted(() => ({
  getRuntimeConfiguration: vi.fn(),
  getMissingConfigurationMessage: vi.fn(() => null),
  getAuthenticatedUser: vi.fn(),
  getMeetingForUser: vi.fn(),
  takeRateLimitToken: vi.fn(),
  queueMeetingForProcessing: vi.fn(),
  listMock: vi.fn(),
  eqSecondMock: vi.fn(),
  eqFirstMock: vi.fn(),
  updateMock: vi.fn(),
  fromMock: vi.fn(),
  storageFromMock: vi.fn(),
}))

mocks.eqSecondMock.mockResolvedValue({ error: null })
mocks.eqFirstMock.mockReturnValue({ eq: mocks.eqSecondMock })
mocks.updateMock.mockReturnValue({ eq: mocks.eqFirstMock })
mocks.fromMock.mockReturnValue({ update: mocks.updateMock })
mocks.listMock.mockResolvedValue({
  data: [{ name: "audio.mp4" }],
  error: null,
})
mocks.storageFromMock.mockReturnValue({ list: mocks.listMock })

vi.mock("@/lib/env", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/env")>()
  return {
    ...actual,
    getMissingConfigurationMessage: mocks.getMissingConfigurationMessage,
    getRuntimeConfiguration: mocks.getRuntimeConfiguration,
  }
})

vi.mock("@/lib/supabase/server", () => ({
  createServerSupabaseClient: vi.fn(() => ({
    storage: {
      from: mocks.storageFromMock,
    },
    from: mocks.fromMock,
  })),
  getAuthenticatedUser: mocks.getAuthenticatedUser,
}))

vi.mock("@/lib/meetings/queries", () => ({
  getMeetingForUser: mocks.getMeetingForUser,
}))

vi.mock("@/lib/meetings/rate-limit", () => ({
  takeRateLimitToken: mocks.takeRateLimitToken,
}))

vi.mock("@/lib/meetings/jobs", () => ({
  queueMeetingForProcessing: mocks.queueMeetingForProcessing,
}))

import { POST } from "@/app/api/meetings/[id]/upload-complete/route"

describe("upload complete route", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.getRuntimeConfiguration.mockReturnValue({
      liveProcessingConfigured: true,
    })
    mocks.getAuthenticatedUser.mockResolvedValue({ id: "user-1" })
    mocks.takeRateLimitToken.mockResolvedValue(true)
    mocks.getMeetingForUser.mockResolvedValue({
      id: "meeting-1",
      status: "uploading",
      progress: 0,
      storagePath: "user-1/meeting-1/audio.mp4",
      transcriptSegments: [],
    })
    mocks.queueMeetingForProcessing.mockResolvedValue({
      status: "uploaded",
      progress: 25,
    })
    mocks.listMock.mockResolvedValue({
      data: [{ name: "audio.mp4" }],
      error: null,
    })
    mocks.eqSecondMock.mockResolvedValue({ error: null })
  })

  it("marks the meeting uploaded and starts processing", async () => {
    const response = await POST(
      new Request("http://localhost/api/meetings/meeting-1/upload-complete", {
        method: "POST",
        headers: {
          origin: "http://localhost",
        },
      }),
      { params: Promise.resolve({ id: "meeting-1" }) }
    )

    expect(response.status).toBe(202)
    expect(mocks.fromMock).toHaveBeenCalledWith("meetings")
    expect(mocks.queueMeetingForProcessing).toHaveBeenCalledWith({
      meetingId: "meeting-1",
      userId: "user-1",
      requestUrl: "http://localhost/api/meetings/meeting-1/upload-complete",
      currentStatus: "uploaded",
      hasTranscript: false,
    })
    await expect(response.json()).resolves.toEqual({
      ok: true,
      status: "uploaded",
      progress: 25,
    })
  })

  it("returns a failed meeting error when queue startup breaks", async () => {
    mocks.queueMeetingForProcessing.mockRejectedValue(
      new Error("Groq transcription failed (429 insufficient_quota).")
    )

    const response = await POST(
      new Request("http://localhost/api/meetings/meeting-1/upload-complete", {
        method: "POST",
        headers: {
          origin: "http://localhost",
        },
      }),
      { params: Promise.resolve({ id: "meeting-1" }) }
    )

    expect(response.status).toBe(500)
    await expect(response.json()).resolves.toEqual({
      error: "Groq transcription failed (429 insufficient_quota).",
    })
  })
})
