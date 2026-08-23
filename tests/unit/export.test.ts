import { demoMeeting } from "@/fixtures/demo-meeting"
import {
  buildMeetingJsonExport,
  buildMeetingMarkdownExport,
  buildMeetingTextExport,
} from "@/lib/meetings/export"

describe("exports", () => {
  it("creates markdown, text, and json exports", () => {
    expect(buildMeetingMarkdownExport(demoMeeting)).toContain("# Launch sync")
    expect(buildMeetingTextExport(demoMeeting)).toContain("Executive summary:")
    expect(JSON.parse(buildMeetingJsonExport(demoMeeting)).id).toBe(
      "demo-meeting"
    )
  })
})
