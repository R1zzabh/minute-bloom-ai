import { afterEach, describe, expect, it, vi } from "vitest"

const mocks = vi.hoisted(() => ({
  getRuntimeConfiguration: vi.fn(),
  getMissingConfigurationMessage: vi.fn(() => null),
  getAuthenticatedUser: vi.fn(),
  getMeetingForUser: vi.fn(),
  takeRateLimitToken: vi.fn(),
  enqueueMeetingProcessingJob: vi.fn(),
  scheduleMeetingWorker: vi.fn(),
  inMock: vi.fn(async () => ({ error: null })),
  eqSecondMock: vi.fn(),
  eqFirstMock: vi.fn(),
  updateMock: vi.fn(),
  fromMock: vi.fn(),
}))

mocks.eqSecondMock.mockImplementation(() => ({ in: mocks.inMock }))
mocks.eqFirstMock.mockImplementation(() => ({ eq: mocks.eqSecondMock }))
mocks.updateMock.mockImplementation(() => ({ eq: mocks.eqFirstMock }))
mocks.fromMock.mockImplementation(() => ({ update: mocks.updateMock }))

vi.mock("@/lib/env", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/env")>()
  return {
    ...actual,
    getMissingConfigurationMessage: mocks.getMissingConfigurationMessage,
    getRuntimeConfiguration: mocks.getRuntimeConfiguration,
  }
})

vi.mock("@/lib/supabase/server", () => ({
  getAuthenticatedUser: mocks.getAuthenticatedUser,
}))

vi.mock("@/lib/meetings/queries", () => ({
  getMeetingForUser: mocks.getMeetingForUser,
}))

vi.mock("@/lib/meetings/rate-limit", () => ({
  takeRateLimitToken: mocks.takeRateLimitToken,
}))

vi.mock("@/lib/meetings/jobs", () => ({
  enqueueMeetingProcessingJob: mocks.enqueueMeetingProcessingJob,
  scheduleMeetingWorker: mocks.scheduleMeetingWorker,
}))

vi.mock("@/lib/supabase/admin", () => ({
  createAdminSupabaseClient: vi.fn(() => ({
    from: mocks.fromMock,
  })),
}))

import { POST } from "@/app/api/meetings/[id]/process/route"

describe("process route", () => {
  afterEach(() => {
    vi.clearAllMocks()
    mocks.getRuntimeConfiguration.mockReturnValue({
      liveProcessingConfigured: true,
    })
    mocks.takeRateLimitToken.mockResolvedValue(true)
    mocks.getAuthenticatedUser.mockResolvedValue({ id: "user-1" })
  })

  it("returns 503 when live processing is not configured", async () => {
    mocks.getRuntimeConfiguration.mockReturnValue({
      liveProcessingConfigured: false,
    })

    const response = await POST(
      new Request("http://localhost/api/meetings/meeting-1/process", {
        method: "POST",
        headers: {
          origin: "http://localhost",
        },
      }),
      { params: Promise.resolve({ id: "meeting-1" }) }
    )

    expect(response.status).toBe(503)
  })

  it("returns 409 when upload verification is still pending", async () => {
    mocks.getMeetingForUser.mockResolvedValue({
      id: "meeting-1",
      status: "uploading",
      progress: 0,
      transcriptSegments: [],
    })

    const response = await POST(
      new Request("http://localhost/api/meetings/meeting-1/process", {
        method: "POST",
        headers: {
          origin: "http://localhost",
        },
      }),
      { params: Promise.resolve({ id: "meeting-1" }) }
    )

    expect(response.status).toBe(409)
  })

  it("queues uploaded meetings and returns 202", async () => {
    mocks.getMeetingForUser.mockResolvedValue({
      id: "meeting-1",
      status: "uploaded",
      progress: 25,
      transcriptSegments: [],
    })

    const response = await POST(
      new Request("http://localhost/api/meetings/meeting-1/process", {
        method: "POST",
        headers: {
          origin: "http://localhost",
        },
      }),
      { params: Promise.resolve({ id: "meeting-1" }) }
    )

    expect(response.status).toBe(202)
    expect(mocks.enqueueMeetingProcessingJob).toHaveBeenCalledWith({
      meetingId: "meeting-1",
      userId: "user-1",
    })
    expect(mocks.scheduleMeetingWorker).toHaveBeenCalled()
  })
})
