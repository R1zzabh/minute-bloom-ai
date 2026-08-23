import { zodTextFormat } from "openai/helpers/zod"
import type { ZodType } from "zod"

import {
  getAIProviderLabel,
  getSummaryModel,
  runAIRequest,
} from "@/lib/ai/provider"
import {
  ASK_AI_SYSTEM_PROMPT,
  SUMMARY_SYSTEM_PROMPT,
  buildAskAIUserPrompt,
  buildChunkSummaryUserPrompt,
  buildSummaryAggregationPrompt,
  buildSummaryUserPrompt,
} from "@/lib/ai/prompts"
import {
  groundedAnswerSchema,
  meetingSummarySchema,
  type GroundedAnswer,
  type MeetingSummaryShape,
} from "@/lib/ai/schemas"
import type { MeetingRecord } from "@/types/meeting"

const SINGLE_PASS_TRANSCRIPT_CHAR_LIMIT = 12_000
const CHUNK_TARGET_CHAR_LIMIT = 9_000

type SummaryMeetingInput = Pick<
  MeetingRecord,
  "title" | "description" | "language" | "transcriptText"
>

function dedupeStrings(values: string[]) {
  const seen = new Set<string>()

  return values.filter((value) => {
    const key = value.trim().toLowerCase()

    if (seen.has(key)) {
      return false
    }

    seen.add(key)
    return true
  })
}

function priorityRank(priority: "low" | "medium" | "high") {
  if (priority === "high") {
    return 3
  }

  if (priority === "medium") {
    return 2
  }

  return 1
}

function normalizeMeetingSummary(summary: MeetingSummaryShape) {
  const dedupedKeyTopics = new Map<
    string,
    MeetingSummaryShape["keyTopics"][number]
  >()
  const dedupedDecisions = new Map<
    string,
    MeetingSummaryShape["decisions"][number]
  >()
  const dedupedActionItems = new Map<
    string,
    MeetingSummaryShape["actionItems"][number]
  >()

  for (const topic of summary.keyTopics) {
    const key = `${topic.topic.trim().toLowerCase()}::${topic.detail
      .trim()
      .toLowerCase()}`

    if (!dedupedKeyTopics.has(key)) {
      dedupedKeyTopics.set(key, topic)
    }
  }

  for (const decision of summary.decisions) {
    const key = `${decision.decision.trim().toLowerCase()}::${decision.rationale?.trim().toLowerCase() ?? ""}::${decision.timestampSeconds ?? ""}`

    if (!dedupedDecisions.has(key)) {
      dedupedDecisions.set(key, decision)
    }
  }

  for (const item of summary.actionItems) {
    const key = `${item.task.trim().toLowerCase()}::${item.owner?.trim().toLowerCase() ?? ""}::${item.dueDate ?? ""}`
    const existing = dedupedActionItems.get(key)

    if (!existing) {
      dedupedActionItems.set(key, item)
      continue
    }

    dedupedActionItems.set(key, {
      task: existing.task,
      owner: existing.owner ?? item.owner,
      dueDate: existing.dueDate ?? item.dueDate,
      priority:
        priorityRank(item.priority) > priorityRank(existing.priority)
          ? item.priority
          : existing.priority,
      timestampSeconds: existing.timestampSeconds ?? item.timestampSeconds,
      isInferred: existing.isInferred && item.isInferred,
    })
  }

  return meetingSummarySchema.parse({
    ...summary,
    keyTopics: [...dedupedKeyTopics.values()],
    decisions: [...dedupedDecisions.values()],
    actionItems: [...dedupedActionItems.values()],
    blockers: dedupeStrings(summary.blockers),
    openQuestions: dedupeStrings(summary.openQuestions),
  })
}

function splitLongChunk(chunk: string, maxLength: number) {
  const sentenceParts = chunk.split(/(?<=[.!?])\s+/)
  const output: string[] = []
  let current = ""

  for (const sentence of sentenceParts) {
    if (!sentence.trim()) {
      continue
    }

    const candidate = current ? `${current} ${sentence}` : sentence

    if (candidate.length <= maxLength) {
      current = candidate
      continue
    }

    if (current) {
      output.push(current)
    }

    if (sentence.length <= maxLength) {
      current = sentence
      continue
    }

    for (let index = 0; index < sentence.length; index += maxLength) {
      output.push(sentence.slice(index, index + maxLength))
    }

    current = ""
  }

  if (current) {
    output.push(current)
  }

  return output.length > 0 ? output : [chunk]
}

function chunkTranscriptText(transcriptText: string) {
  const normalizedText = transcriptText.trim()

  if (normalizedText.length <= SINGLE_PASS_TRANSCRIPT_CHAR_LIMIT) {
    return [normalizedText]
  }

  const lines = normalizedText
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean)

  const chunks: string[] = []
  let currentChunk = ""

  for (const line of lines) {
    const candidate = currentChunk ? `${currentChunk}\n${line}` : line

    if (candidate.length <= CHUNK_TARGET_CHAR_LIMIT) {
      currentChunk = candidate
      continue
    }

    if (currentChunk) {
      chunks.push(currentChunk)
    }

    if (line.length <= CHUNK_TARGET_CHAR_LIMIT) {
      currentChunk = line
      continue
    }

    chunks.push(...splitLongChunk(line, CHUNK_TARGET_CHAR_LIMIT))
    currentChunk = ""
  }

  if (currentChunk) {
    chunks.push(currentChunk)
  }

  return chunks
}

function shouldFallbackToCreate(error: unknown) {
  if (!(error instanceof Error)) {
    return false
  }

  const message = error.message.toLowerCase()

  return (
    message.includes("json_schema") ||
    message.includes("structured output") ||
    message.includes("output_parsed")
  )
}

function extractOutputText(response: unknown): string {
  if (
    response &&
    typeof response === "object" &&
    "output_text" in response &&
    typeof response.output_text === "string"
  ) {
    return response.output_text
  }

  if (
    response &&
    typeof response === "object" &&
    "output" in response &&
    Array.isArray(response.output)
  ) {
    const textParts = response.output.flatMap((item) => {
      if (!item || typeof item !== "object" || !("content" in item)) {
        return []
      }

      if (!Array.isArray(item.content)) {
        return []
      }

      return item.content
        .map((contentItem: unknown) => {
          if (
            contentItem &&
            typeof contentItem === "object" &&
            "text" in contentItem &&
            typeof contentItem.text === "string"
          ) {
            return contentItem.text
          }

          return null
        })
        .filter((text: string | null): text is string => Boolean(text))
    })

    return textParts.join("\n").trim()
  }

  return ""
}

async function requestStructuredOutput<Output>(input: {
  instructions: string
  payload: string
  schema: ZodType<Output>
  schemaName: string
}) {
  const model = getSummaryModel()

  try {
    const response = await runAIRequest("summary", (client) =>
      client.responses.parse({
        model,
        instructions: input.instructions,
        input: input.payload,
        text: {
          format: zodTextFormat(input.schema, input.schemaName),
        },
      })
    )

    if (!response.output_parsed) {
      throw new Error(
        `${getAIProviderLabel()} summary returned no structured output.`
      )
    }

    return input.schema.parse(response.output_parsed)
  } catch (error) {
    if (!shouldFallbackToCreate(error)) {
      throw error
    }
  }

  const response = await runAIRequest("summary", (client) =>
    client.responses.create({
      model,
      instructions: input.instructions,
      input: input.payload,
      text: {
        format: zodTextFormat(input.schema, input.schemaName),
      },
    })
  )

  const outputText = extractOutputText(response)

  if (!outputText) {
    throw new Error(`${getAIProviderLabel()} summary returned no text output.`)
  }

  return input.schema.parse(JSON.parse(outputText))
}

async function summarizeTranscriptChunk(
  meeting: Pick<MeetingRecord, "title" | "description" | "language">,
  transcriptChunk: string,
  chunkIndex: number,
  chunkCount: number
) {
  return normalizeMeetingSummary(
    await requestStructuredOutput({
      instructions: SUMMARY_SYSTEM_PROMPT,
      payload: buildChunkSummaryUserPrompt(
        meeting,
        transcriptChunk,
        chunkIndex,
        chunkCount
      ),
      schema: meetingSummarySchema,
      schemaName: "meeting_summary_chunk",
    })
  )
}

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

export async function summarizeMeeting(meeting: SummaryMeetingInput) {
  if (!meeting.transcriptText.trim()) {
    return createEmptyMeetingSummary()
  }

  const transcriptChunks = chunkTranscriptText(meeting.transcriptText)

  if (transcriptChunks.length === 1) {
    return normalizeMeetingSummary(
      await requestStructuredOutput({
        instructions: SUMMARY_SYSTEM_PROMPT,
        payload: buildSummaryUserPrompt(meeting),
        schema: meetingSummarySchema,
        schemaName: "meeting_summary",
      })
    )
  }

  const chunkSummaries: MeetingSummaryShape[] = []

  for (const [index, chunk] of transcriptChunks.entries()) {
    chunkSummaries.push(
      await summarizeTranscriptChunk(
        meeting,
        chunk,
        index,
        transcriptChunks.length
      )
    )
  }

  return normalizeMeetingSummary(
    await requestStructuredOutput({
      instructions: SUMMARY_SYSTEM_PROMPT,
      payload: buildSummaryAggregationPrompt(meeting, chunkSummaries),
      schema: meetingSummarySchema,
      schemaName: "meeting_summary_aggregate",
    })
  )
}

export async function answerMeetingQuestion(
  meeting: MeetingRecord,
  question: string
) {
  return requestStructuredOutput<GroundedAnswer>({
    instructions: ASK_AI_SYSTEM_PROMPT,
    payload: buildAskAIUserPrompt(meeting, question),
    schema: groundedAnswerSchema,
    schemaName: "grounded_meeting_answer",
  })
}
