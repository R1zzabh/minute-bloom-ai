import { toFile } from "openai"
import type {
  TranscriptionCreateResponse,
  TranscriptionVerbose,
} from "openai/resources/audio/transcriptions"

import { getTranscriptionModel, runAIRequest } from "@/lib/ai/provider"
import { transcriptSegmentSchema } from "@/lib/ai/schemas"
import type { TranscriptSegment } from "@/types/meeting"

export type NormalizedTranscript = {
  durationSeconds: number | null
  rawText: string
  readableTranscript: string
  segments: TranscriptSegment[]
}

function isVerboseResult(
  value: TranscriptionCreateResponse
): value is TranscriptionVerbose {
  return "language" in value || "segments" in value
}

function normalizeSegments(response: TranscriptionCreateResponse) {
  if (isVerboseResult(response) && response.segments?.length) {
    return response.segments
      .map((segment, index) => {
        const text = segment.text.trim()

        if (!text) {
          return null
        }

        return transcriptSegmentSchema.parse({
          id: String(segment.id ?? index),
          startSeconds: segment.start,
          endSeconds: segment.end,
          text,
          speaker: null,
        })
      })
      .filter((segment): segment is TranscriptSegment => Boolean(segment))
  }

  return []
}

function buildReadableTranscript(
  segments: TranscriptSegment[],
  fallbackText: string
) {
  if (segments.length === 0) {
    return fallbackText.trim()
  }

  return segments
    .map(
      (segment) =>
        `[${new Date(segment.startSeconds * 1000).toISOString().slice(11, 19)}] ${segment.text}`
    )
    .join("\n")
}

function buildRawTranscript(
  response: TranscriptionCreateResponse,
  segments: TranscriptSegment[]
) {
  const directText =
    typeof response.text === "string" ? response.text.trim() : ""

  if (directText) {
    return directText
  }

  return segments
    .map((segment) => segment.text)
    .join(" ")
    .trim()
}

export async function transcribeMeetingAudio(input: {
  audioBuffer: ArrayBuffer
  fileName: string
  mimeType: string
  language: string
}) {
  const model = getTranscriptionModel()
  const file = await toFile(Buffer.from(input.audioBuffer), input.fileName, {
    type: input.mimeType,
  })

  const response = await runAIRequest("transcription", (client) =>
    client.audio.transcriptions.create({
      file,
      model,
      language: input.language !== "auto" ? input.language : undefined,
      response_format: "verbose_json",
      timestamp_granularities: ["segment"],
    })
  )

  const segments = normalizeSegments(response)
  const rawText = buildRawTranscript(response, segments)
  const readableTranscript = buildReadableTranscript(segments, rawText)
  const durationSeconds =
    "duration" in response && typeof response.duration === "number"
      ? response.duration
      : null

  return {
    durationSeconds,
    rawText,
    readableTranscript,
    segments,
  } satisfies NormalizedTranscript
}
