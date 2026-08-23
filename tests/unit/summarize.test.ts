import { describe, expect, it, vi } from "vitest"

const mocks = vi.hoisted(() => ({
  getSummaryModel: vi.fn(() => "openai/gpt-oss-20b"),
  getAIProviderLabel: vi.fn(() => "Groq"),
  runAIRequest: vi.fn(),
}))

vi.mock("@/lib/ai/provider", () => ({
  getSummaryModel: mocks.getSummaryModel,
  getAIProviderLabel: mocks.getAIProviderLabel,
  runAIRequest: mocks.runAIRequest,
}))

import {
  answerMeetingQuestion,
  createEmptyMeetingSummary,
  summarizeMeeting,
} from "@/lib/ai/summarize"
import { demoMeeting } from "@/fixtures/demo-meeting"

describe("summarizeMeeting", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.getSummaryModel.mockReturnValue("openai/gpt-oss-20b")
    mocks.getAIProviderLabel.mockReturnValue("Groq")
  })

  it("returns a safe empty summary for blank transcripts", async () => {
    await expect(
      summarizeMeeting({
        title: "Blank",
        description: null,
        language: "en",
        transcriptText: "   ",
      })
    ).resolves.toEqual(createEmptyMeetingSummary())
  })

  it("chunks long transcripts and aggregates validated summaries", async () => {
    mocks.runAIRequest
      .mockResolvedValueOnce({
        output_parsed: {
          suggestedTitle: "Chunk 1",
          executiveSummary: "First half summary.",
          keyTopics: [{ topic: "Roadmap", detail: "Launch sequencing." }],
          decisions: [],
          actionItems: [
            {
              task: "Share roadmap draft",
              owner: "Priya",
              dueDate: null,
              priority: "medium",
              timestampSeconds: 12,
              isInferred: false,
            },
          ],
          blockers: [],
          openQuestions: [],
        },
      })
      .mockResolvedValueOnce({
        output_parsed: {
          suggestedTitle: "Chunk 2",
          executiveSummary: "Second half summary.",
          keyTopics: [{ topic: "Roadmap", detail: "Launch sequencing." }],
          decisions: [],
          actionItems: [
            {
              task: "Share roadmap draft",
              owner: "Priya",
              dueDate: null,
              priority: "high",
              timestampSeconds: 12,
              isInferred: false,
            },
          ],
          blockers: [],
          openQuestions: [],
        },
      })
      .mockResolvedValueOnce({
        output_parsed: {
          suggestedTitle: "Launch planning",
          executiveSummary: "The team aligned on launch sequencing.",
          keyTopics: [{ topic: "Roadmap", detail: "Launch sequencing." }],
          decisions: [],
          actionItems: [
            {
              task: "Share roadmap draft",
              owner: "Priya",
              dueDate: null,
              priority: "high",
              timestampSeconds: 12,
              isInferred: false,
            },
          ],
          blockers: [],
          openQuestions: [],
        },
      })

    const longTranscript = Array.from(
      { length: 140 },
      (_, index) =>
        `[00:00:${String(index % 60).padStart(2, "0")}] Team note ${index} about launch sequencing, coordination blockers, delivery owners, and engineering follow-up.`
    ).join("\n")

    const summary = await summarizeMeeting({
      title: "Launch planning",
      description: null,
      language: "en",
      transcriptText: longTranscript,
    })

    expect(mocks.runAIRequest).toHaveBeenCalledTimes(3)
    expect(summary.actionItems).toHaveLength(1)
    expect(summary.actionItems[0]?.priority).toBe("high")
  })

  it("rejects invalid structured summaries", async () => {
    mocks.runAIRequest.mockResolvedValueOnce({
      output_parsed: {
        suggestedTitle: "Broken summary",
      },
    })

    await expect(
      summarizeMeeting({
        title: "Broken",
        description: null,
        language: "en",
        transcriptText: "A real transcript line.",
      })
    ).rejects.toThrow()
  })
})

describe("answerMeetingQuestion", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.getSummaryModel.mockReturnValue("openai/gpt-oss-20b")
    mocks.getAIProviderLabel.mockReturnValue("Groq")
  })

  it("returns validated grounded answers", async () => {
    mocks.runAIRequest.mockResolvedValueOnce({
      output_parsed: {
        answer: "Calendar integration stayed out of scope.",
        citations: [
          {
            timestampSeconds: 52,
            supportingQuote: "ship the workspace first",
          },
        ],
      },
    })

    const answer = await answerMeetingQuestion(
      demoMeeting,
      "What did they decide about scope?"
    )

    expect(answer.answer).toContain("out of scope")
    expect(answer.citations).toHaveLength(1)
  })
})
