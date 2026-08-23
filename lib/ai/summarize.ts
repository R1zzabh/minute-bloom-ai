import { zodTextFormat } from "openai/helpers/zod"

import { getOpenAIClient, getSummaryModel } from "@/lib/ai/openai"
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

  const client = getOpenAIClient()
  const response = await client.responses.parse({
    model: getSummaryModel(),
    instructions: SUMMARY_SYSTEM_PROMPT,
    input: buildSummaryUserPrompt(meeting),
    text: {
      format: zodTextFormat(meetingSummarySchema, "meeting_summary"),
    },
  })

  return response.output_parsed ?? createEmptyMeetingSummary()
}

export async function answerMeetingQuestion(
  meeting: MeetingRecord,
  question: string
) {
  const client = getOpenAIClient()
  const response = await client.responses.parse({
    model: getSummaryModel(),
    instructions: ASK_AI_SYSTEM_PROMPT,
    input: buildAskAIUserPrompt(meeting, question),
    text: {
      format: zodTextFormat(groundedAnswerSchema, "grounded_meeting_answer"),
    },
  })

  return (
    response.output_parsed ?? {
      answer: "The answer is not present in this meeting.",
      citations: [],
    }
  )
}
