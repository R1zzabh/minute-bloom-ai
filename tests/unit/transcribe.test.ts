import { describe, expect, it, vi } from "vitest"

const mocks = vi.hoisted(() => ({
  toFile: vi.fn(async () => ({ id: "file-1" })),
  getTranscriptionModel: vi.fn(() => "whisper-large-v3-turbo"),
  runAIRequest: vi.fn(),
}))

vi.mock("openai", () => ({
  toFile: mocks.toFile,
}))

vi.mock("@/lib/ai/provider", () => ({
  getTranscriptionModel: mocks.getTranscriptionModel,
  runAIRequest: mocks.runAIRequest,
}))

import { transcribeMeetingAudio } from "@/lib/ai/transcribe"

describe("transcribeMeetingAudio", () => {
  it("normalizes verbose_json segments with unknown speakers", async () => {
    mocks.runAIRequest.mockResolvedValueOnce({
      text: "Hello team. We are shipping on Friday.",
      language: "en",
      duration: 9.2,
      segments: [
        { id: 1, start: 0, end: 2.1, text: "Hello team." },
        { id: 2, start: 2.1, end: 5.7, text: "We are shipping on Friday." },
      ],
    })

    const result = await transcribeMeetingAudio({
      audioBuffer: new ArrayBuffer(8),
      fileName: "meeting.mp4",
      mimeType: "video/mp4",
      language: "auto",
    })

    expect(result.durationSeconds).toBe(9.2)
    expect(result.rawText).toContain("shipping on Friday")
    expect(result.segments).toHaveLength(2)
    expect(result.segments.every((segment) => segment.speaker === null)).toBe(
      true
    )
    expect(result.readableTranscript).not.toContain("Speaker 1")
    expect(result.readableTranscript).toContain("[00:00:00] Hello team.")
  })

  it("returns a safe empty transcript when the provider returns no usable speech", async () => {
    mocks.runAIRequest.mockResolvedValueOnce({
      text: "   ",
      language: "en",
      segments: [],
    })

    const result = await transcribeMeetingAudio({
      audioBuffer: new ArrayBuffer(8),
      fileName: "meeting.mp4",
      mimeType: "video/mp4",
      language: "auto",
    })

    expect(result.rawText).toBe("")
    expect(result.readableTranscript).toBe("")
    expect(result.segments).toEqual([])
  })

  it("rejects malformed segment timestamps", async () => {
    mocks.runAIRequest.mockResolvedValueOnce({
      text: "Hello team.",
      language: "en",
      segments: [{ id: 1, start: -1, end: 2, text: "Hello team." }],
    })

    await expect(
      transcribeMeetingAudio({
        audioBuffer: new ArrayBuffer(8),
        fileName: "meeting.mp4",
        mimeType: "video/mp4",
        language: "auto",
      })
    ).rejects.toThrow()
  })
})
