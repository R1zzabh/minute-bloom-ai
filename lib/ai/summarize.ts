import { zodTextFormat } from "openai/helpers/zod"

import { getSummaryModel, runOpenAIRequest } from "@/lib/ai/openai"
import {
  ASK_AI_SYSTEM_PROMPT,
  SUMMARY_SYSTEM_PROMPT,
  buildAskAIUserPrompt,
  buildSummaryUserPrompt,
} from "@/lib/ai/prompts"
import { groundedAnswerSchema, meetingSummarySchema } from "@/lib/ai/schemas"
import type { MeetingRecord } from "@/types/meeting"

export function createEmptyMeetingSummary() {
  return {
    suggestedTitle: "Untitled meeting",
    executiveSummary:
      "The transcript did not contain enough reliable detail to summarize.",
    keyTopics: [],
    decisions: [],
    actionItems: [],
    blockers: [],
    openQuestions: [],
  }
}

export async function summarizeMeeting(
  meeting: Pick<
    MeetingRecord,
    "title" | "description" | "language" | "transcriptText"
  >
) {
  if (!meeting.transcriptText.trim()) {
    return createEmptyMeetingSummary()
  }

  const response = await runOpenAIRequest("summary", (client) =>
    client.responses.parse({
      model: getSummaryModel(),
      instructions: SUMMARY_SYSTEM_PROMPT,
      input: buildSummaryUserPrompt(meeting),
      text: {
        format: zodTextFormat(meetingSummarySchema, "meeting_summary"),
      },
    })
  )

  if (!response.output_parsed) {
    throw new Error("OpenAI summary returned no structured output.")
  }

  return meetingSummarySchema.parse(response.output_parsed)
}

export async function answerMeetingQuestion(
  meeting: MeetingRecord,
  question: string
) {
  const response = await runOpenAIRequest("summary", (client) =>
    client.responses.parse({
      model: getSummaryModel(),
      instructions: ASK_AI_SYSTEM_PROMPT,
      input: buildAskAIUserPrompt(meeting, question),
      text: {
        format: zodTextFormat(groundedAnswerSchema, "grounded_meeting_answer"),
      },
    })
  )

  if (!response.output_parsed) {
    throw new Error("OpenAI returned no structured answer.")
  }

  return groundedAnswerSchema.parse(response.output_parsed)
}
