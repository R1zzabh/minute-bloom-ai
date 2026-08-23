import {
  createStoragePath,
  formatBytes,
  formatDuration,
  formatTimestamp,
  sanitizeFileName,
} from "@/lib/utils"

describe("utils", () => {
  it("formats bytes", () => {
    expect(formatBytes(0)).toBe("0 B")
    expect(formatBytes(25 * 1024 * 1024)).toBe("25 MB")
  })

  it("formats durations and timestamps", () => {
    expect(formatDuration(3671)).toBe("1h 1m")
    expect(formatTimestamp(74)).toBe("01:14")
    expect(formatTimestamp(3674)).toBe("01:01:14")
  })

  it("sanitizes file names and creates storage paths", () => {
    expect(sanitizeFileName("Team Sync Final!.m4a")).toBe(
      "team-sync-final-.m4a"
    )
    const path = createStoragePath(
      "user-1",
      "meeting-1",
      "Team Sync Final!.m4a"
    )
    expect(path.startsWith("user-1/meeting-1/")).toBe(true)
    expect(path.endsWith("-team-sync-final-.m4a")).toBe(true)
  })
})
