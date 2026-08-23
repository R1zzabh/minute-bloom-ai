import { beforeEach, describe, expect, it, vi } from "vitest"

const mocks = vi.hoisted(() => ({
  getRuntimeConfiguration: vi.fn(),
  hasWorkerAuthorization: vi.fn(),
  pruneExpiredRateLimits: vi.fn(),
  claimMeetingProcessingJob: vi.fn(),
  processMeetingJob: vi.fn(),
  completeMeetingProcessingJob: vi.fn(),
  markMeetingProcessingFailed: vi.fn(),
  failMeetingProcessingJob: vi.fn(),
}))

vi.mock("@/lib/env", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/env")>()
  return {
    ...actual,
    getRuntimeConfiguration: mocks.getRuntimeConfiguration,
  }
})

vi.mock("@/lib/http/origin", () => ({
  hasWorkerAuthorization: mocks.hasWorkerAuthorization,
}))

vi.mock("@/lib/meetings/rate-limit", () => ({
  pruneExpiredRateLimits: mocks.pruneExpiredRateLimits,
}))

vi.mock("@/lib/meetings/jobs", () => ({
  claimMeetingProcessingJob: mocks.claimMeetingProcessingJob,
  completeMeetingProcessingJob: mocks.completeMeetingProcessingJob,
  failMeetingProcessingJob: mocks.failMeetingProcessingJob,
  markMeetingProcessingFailed: mocks.markMeetingProcessingFailed,
}))

vi.mock("@/lib/meetings/processing", () => ({
  processMeetingJob: mocks.processMeetingJob,
}))

import { POST } from "@/app/api/internal/meeting-processing/route"

describe("internal meeting processing route", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.getRuntimeConfiguration.mockReturnValue({
      liveProcessingConfigured: true,
    })
    mocks.hasWorkerAuthorization.mockReturnValue(true)
    mocks.pruneExpiredRateLimits.mockResolvedValue(undefined)
    mocks.completeMeetingProcessingJob.mockResolvedValue(undefined)
    mocks.markMeetingProcessingFailed.mockResolvedValue(undefined)
    mocks.failMeetingProcessingJob.mockResolvedValue(undefined)
  })

  it("processes queued jobs locally without cron", async () => {
    mocks.claimMeetingProcessingJob
      .mockResolvedValueOnce({
        meeting_id: "meeting-1",
        user_id: "user-1",
        attempt_count: 1,
        max_attempts: 5,
      })
      .mockResolvedValueOnce(null)
    mocks.processMeetingJob.mockResolvedValue(undefined)

    const response = await POST(
      new Request("http://localhost/api/internal/meeting-processing", {
        method: "POST",
        headers: {
          authorization: "Bearer cron-secret",
        },
      })
    )

    expect(response.status).toBe(200)
    expect(mocks.processMeetingJob).toHaveBeenCalledWith({
      meetingId: "meeting-1",
      userId: "user-1",
    })
    expect(mocks.completeMeetingProcessingJob).toHaveBeenCalled()
    await expect(response.json()).resolves.toEqual({
      ok: true,
      processed: 1,
      meetingIds: ["meeting-1"],
    })
  })
})
