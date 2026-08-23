import { afterEach, describe, expect, it, vi } from "vitest"

const mocks = vi.hoisted(() => ({
  getRuntimeConfiguration: vi.fn(),
  getMissingConfigurationMessage: vi.fn((): string | null => null),
  getAuthenticatedUser: vi.fn(),
  getMeetingForUser: vi.fn(),
  updateActionItemForUser: vi.fn(),
  takeRateLimitToken: vi.fn(),
}))

vi.mock("@/lib/env", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/env")>()
  return {
    ...actual,
    getMissingConfigurationMessage: mocks.getMissingConfigurationMessage,
    getRuntimeConfiguration: mocks.getRuntimeConfiguration,
  }
})

vi.mock("@/lib/meetings/queries", () => ({
  getMeetingForUser: mocks.getMeetingForUser,
}))

vi.mock("@/lib/meetings/mutations", () => ({
  updateActionItemForUser: mocks.updateActionItemForUser,
}))

vi.mock("@/lib/meetings/rate-limit", () => ({
  takeRateLimitToken: mocks.takeRateLimitToken,
}))

vi.mock("@/lib/supabase/server", () => ({
  getAuthenticatedUser: mocks.getAuthenticatedUser,
}))

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}))

import { PATCH } from "@/app/api/meetings/[id]/action-items/[actionItemId]/route"

describe("action item route", () => {
  afterEach(() => {
    vi.clearAllMocks()
    mocks.getRuntimeConfiguration.mockReturnValue({
      supabaseAdminConfigured: true,
    })
    mocks.getAuthenticatedUser.mockResolvedValue({ id: "user-1" })
    mocks.getMeetingForUser.mockResolvedValue({ id: "meeting-1" })
    mocks.takeRateLimitToken.mockResolvedValue(true)
    mocks.updateActionItemForUser.mockResolvedValue({ id: "action-1" })
  })

  it("returns 503 when Supabase admin access is not configured", async () => {
    mocks.getRuntimeConfiguration.mockReturnValue({
      supabaseAdminConfigured: false,
    })
    mocks.getMissingConfigurationMessage.mockReturnValue(
      "Missing configuration: SUPABASE_SECRET_KEY."
    )

    const response = await PATCH(
      new Request(
        "http://localhost/api/meetings/meeting-1/action-items/action-1",
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            origin: "http://localhost",
          },
          body: JSON.stringify({ status: "done" }),
        }
      ),
      { params: Promise.resolve({ id: "meeting-1", actionItemId: "action-1" }) }
    )

    expect(response.status).toBe(503)
  })

  it("returns 429 when the shared mutation rate limit is exhausted", async () => {
    mocks.takeRateLimitToken.mockResolvedValue(false)

    const response = await PATCH(
      new Request(
        "http://localhost/api/meetings/meeting-1/action-items/action-1",
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            origin: "http://localhost",
          },
          body: JSON.stringify({ status: "done" }),
        }
      ),
      { params: Promise.resolve({ id: "meeting-1", actionItemId: "action-1" }) }
    )

    expect(response.status).toBe(429)
  })

  it("returns 404 when the meeting is not owned by the current user", async () => {
    mocks.getMeetingForUser.mockResolvedValue(null)

    const response = await PATCH(
      new Request(
        "http://localhost/api/meetings/meeting-1/action-items/action-1",
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            origin: "http://localhost",
          },
          body: JSON.stringify({ status: "done" }),
        }
      ),
      { params: Promise.resolve({ id: "meeting-1", actionItemId: "action-1" }) }
    )

    expect(response.status).toBe(404)
  })

  it("updates an owned action item", async () => {
    const response = await PATCH(
      new Request(
        "http://localhost/api/meetings/meeting-1/action-items/action-1",
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            origin: "http://localhost",
          },
          body: JSON.stringify({ status: "done" }),
        }
      ),
      { params: Promise.resolve({ id: "meeting-1", actionItemId: "action-1" }) }
    )

    expect(response.status).toBe(200)
    expect(mocks.updateActionItemForUser).toHaveBeenCalledWith(
      "meeting-1",
      "action-1",
      "user-1",
      { status: "done" }
    )
  })
})
