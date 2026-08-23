import { afterEach, describe, expect, it, vi } from "vitest"

vi.mock("@/lib/env", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/env")>()
  return {
    ...actual,
    getMissingConfigurationMessage: vi.fn(() => null),
    getRuntimeConfiguration: vi.fn(() => ({
      liveProcessingConfigured: true,
    })),
  }
})

vi.mock("@/lib/supabase/server", () => ({
  getAuthenticatedUser: vi.fn(),
}))

vi.mock("@/lib/meetings/queries", () => ({
  getMeetingForUser: vi.fn(),
}))

vi.mock("@/lib/meetings/rate-limit", () => ({
  takeRateLimitToken: vi.fn(async () => true),
}))

vi.mock("@/lib/ai/summarize", () => ({
  answerMeetingQuestion: vi.fn(),
}))

import { POST } from "@/app/api/meetings/[id]/chat/route"
import { demoMeeting } from "@/fixtures/demo-meeting"
import { answerMeetingQuestion } from "@/lib/ai/summarize"
import { getMeetingForUser } from "@/lib/meetings/queries"
import { getAuthenticatedUser } from "@/lib/supabase/server"

describe("chat route", () => {
  afterEach(() => {
    vi.clearAllMocks()
  })

  it("returns 401 when unauthenticated", async () => {
    vi.mocked(getAuthenticatedUser).mockResolvedValue(null)

    const response = await POST(
      new Request("http://localhost/api/meetings/demo-meeting/chat", {
        method: "POST",
        headers: {
          origin: "http://localhost",
        },
        body: JSON.stringify({ question: "What happened?" }),
      }),
      { params: Promise.resolve({ id: "demo-meeting" }) }
    )

    expect(response.status).toBe(401)
  })

  it("returns a grounded answer for owned meetings", async () => {
    vi.mocked(getAuthenticatedUser).mockResolvedValue({ id: "user-1" } as never)
    vi.mocked(getMeetingForUser).mockResolvedValue(demoMeeting)
    vi.mocked(answerMeetingQuestion).mockResolvedValue({
      answer: "The team kept calendar integration out of scope.",
      citations: [
        { timestampSeconds: 52, supportingQuote: "ship the workspace first" },
      ],
    })

    const response = await POST(
      new Request("http://localhost/api/meetings/demo-meeting/chat", {
        method: "POST",
        headers: {
          origin: "http://localhost",
        },
        body: JSON.stringify({ question: "What did they decide about scope?" }),
      }),
      { params: Promise.resolve({ id: "demo-meeting" }) }
    )

    const payload = await response.json()

    expect(response.status).toBe(200)
    expect(payload.answer).toContain("out of scope")
  })
})
