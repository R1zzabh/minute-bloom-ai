import { afterEach, describe, expect, it, vi } from "vitest"

vi.mock("@/lib/supabase/server", () => ({
  getAuthenticatedUser: vi.fn(),
}))

vi.mock("@/lib/meetings/queries", () => ({
  getMeetingForUser: vi.fn(),
}))

import { GET } from "@/app/api/meetings/[id]/export/route"
import { demoMeeting } from "@/fixtures/demo-meeting"
import { getMeetingForUser } from "@/lib/meetings/queries"
import { getAuthenticatedUser } from "@/lib/supabase/server"

describe("export route", () => {
  afterEach(() => {
    vi.clearAllMocks()
  })

  it("returns 401 when unauthenticated", async () => {
    vi.mocked(getAuthenticatedUser).mockResolvedValue(null)

    const response = await GET(
      new Request("http://localhost/api/meetings/demo-meeting/export"),
      { params: Promise.resolve({ id: "demo-meeting" }) }
    )

    expect(response.status).toBe(401)
  })

  it("returns markdown exports for owned meetings", async () => {
    vi.mocked(getAuthenticatedUser).mockResolvedValue({ id: "user-1" } as never)
    vi.mocked(getMeetingForUser).mockResolvedValue(demoMeeting)

    const response = await GET(
      new Request(
        "http://localhost/api/meetings/demo-meeting/export?format=markdown"
      ),
      { params: Promise.resolve({ id: "demo-meeting" }) }
    )

    const payload = await response.text()

    expect(response.status).toBe(200)
    expect(response.headers.get("Content-Type")).toContain("text/markdown")
    expect(payload).toContain("## Executive summary")
  })
})
