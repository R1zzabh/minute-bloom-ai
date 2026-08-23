import { toFile } from "openai"
import type {
  TranscriptionCreateResponse,
  TranscriptionDiarized,
  TranscriptionVerbose,
} from "openai/resources/audio/transcriptions"

import { getOpenAIClient, getTranscriptionModel } from "@/lib/ai/openai"
import { transcriptSegmentSchema } from "@/lib/ai/schemas"
import type { TranscriptSegment } from "@/types/meeting"

export type NormalizedTranscript = {
  durationSeconds: number | null
  rawText: string
  readableTranscript: string
  segments: TranscriptSegment[]
}

function isDiarizedResult(
  value: TranscriptionCreateResponse
): value is TranscriptionDiarized {
  return "segments" in value && Array.isArray(value.segments) && "task" in value
}

function isVerboseResult(
  value: TranscriptionCreateResponse
): value is TranscriptionVerbose {
  return "language" in value
}

function normalizeSegments(response: TranscriptionCreateResponse) {
  if (isDiarizedResult(response)) {
    return response.segments.map((segment) =>
      transcriptSegmentSchema.parse({
        id: segment.id,
        startSeconds: segment.start,
        endSeconds: segment.end,
        text: segment.text.trim(),
        speaker: segment.speaker?.trim() || null,
      })
    )
  }

  if (isVerboseResult(response) && response.segments?.length) {
    return response.segments.map((segment, index) =>
      transcriptSegmentSchema.parse({
        id: String(segment.id ?? index),
        startSeconds: segment.start,
        endSeconds: segment.end,
        text: segment.text.trim(),
        speaker: null,
      })
    )
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
    .map((segment) => {
      const speakerPrefix = segment.speaker ? `${segment.speaker}: ` : ""
      return `[${new Date(segment.startSeconds * 1000).toISOString().slice(11, 19)}] ${speakerPrefix}${segment.text}`
    })
    .join("\n")
}

export async function transcribeMeetingAudio(input: {
  audioBuffer: ArrayBuffer
  fileName: string
  mimeType: string
  language: string
}) {
  const model = getTranscriptionModel()
  const client = getOpenAIClient()
  const file = await toFile(Buffer.from(input.audioBuffer), input.fileName, {
    type: input.mimeType,
  })

  const response = await client.audio.transcriptions.create({
    file,
    model,
    language: input.language !== "auto" ? input.language : undefined,
    response_format:
      model === "gpt-4o-transcribe-diarize" ? "diarized_json" : "verbose_json",
    chunking_strategy:
      model === "gpt-4o-transcribe-diarize" ? "auto" : undefined,
    timestamp_granularities:
      model === "gpt-4o-transcribe-diarize" ? undefined : ["segment"],
  })

  const segments = normalizeSegments(response)
  const readableTranscript = buildReadableTranscript(segments, response.text)
  const durationSeconds =
    "duration" in response && typeof response.duration === "number"
      ? response.duration
      : null

  return {
    durationSeconds,
    rawText: response.text.trim(),
    readableTranscript,
    segments,
  } satisfies NormalizedTranscript
}
