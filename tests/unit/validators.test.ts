import { MAX_AUDIO_FILE_SIZE_BYTES } from "@/lib/constants"
import {
  isLegalMeetingTransition,
  validateAudioFile,
} from "@/lib/meetings/validators"

describe("meeting validators", () => {
  it("accepts and rejects supported upload types", () => {
    expect(
      validateAudioFile({
        name: "demo.m4a",
        size: 1024,
        type: "audio/m4a",
      }).valid
    ).toBe(true)

    expect(
      validateAudioFile({
        name: "demo.exe",
        size: 1024,
        type: "application/octet-stream",
      }).valid
    ).toBe(false)
  })

  it("enforces the 25 MB file limit", () => {
    expect(
      validateAudioFile({
        name: "demo.m4a",
        size: MAX_AUDIO_FILE_SIZE_BYTES,
        type: "audio/m4a",
      }).valid
    ).toBe(true)

    expect(
      validateAudioFile({
        name: "too-large.m4a",
        size: MAX_AUDIO_FILE_SIZE_BYTES + 1,
        type: "audio/m4a",
      }).valid
    ).toBe(false)
  })

  it("checks legal processing transitions", () => {
    expect(isLegalMeetingTransition("uploaded", "transcribing")).toBe(true)
    expect(isLegalMeetingTransition("summarizing", "completed")).toBe(true)
    expect(isLegalMeetingTransition("completed", "failed")).toBe(false)
  })
})
