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
    expect(buildMeetingTextExport(demoMeeting)).toContain("Decisions:")
    expect(buildMeetingTextExport(demoMeeting)).toContain("Transcript:")
    expect(buildMeetingTextExport(demoMeeting)).toContain(
      "The main blocker is still unclear ownership for the QA checklist."
    )
    expect(JSON.parse(buildMeetingJsonExport(demoMeeting)).id).toBe(
      "demo-meeting"
    )
  })
})
