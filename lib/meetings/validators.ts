import { z } from "zod"

import {
  ACCEPTED_AUDIO_EXTENSIONS,
  ACCEPTED_AUDIO_MIME_TYPES,
  MAX_AUDIO_FILE_SIZE_BYTES,
} from "@/lib/constants"
import type { MeetingStatus } from "@/types/meeting"

export const uploadMeetingInputSchema = z.object({
  title: z.string().trim().min(1).max(160),
  description: z.string().trim().max(600).nullable(),
  language: z.string().trim().min(1).max(24).default("auto"),
  originalFileName: z.string().trim().min(1).max(255),
  mimeType: z.string().trim().min(1),
  sizeBytes: z.number().int().positive().max(MAX_AUDIO_FILE_SIZE_BYTES),
  storagePath: z.string().trim().min(1),
})

export const chatRequestSchema = z.object({
  question: z.string().trim().min(1).max(500),
})

export const exportFormatSchema = z.enum(["markdown", "text", "json"])

export function validateAudioFile(file: {
  name: string
  size: number
  type: string
}) {
  const extension = file.name.split(".").pop()?.toLowerCase() ?? ""

  if (
    !ACCEPTED_AUDIO_EXTENSIONS.includes(
      extension as (typeof ACCEPTED_AUDIO_EXTENSIONS)[number]
    )
  ) {
    return {
      valid: false,
      message:
        "Unsupported file extension. Use mp3, mp4, mpeg, mpga, m4a, wav, or webm.",
    }
  }

  if (
    !ACCEPTED_AUDIO_MIME_TYPES.includes(
      file.type as (typeof ACCEPTED_AUDIO_MIME_TYPES)[number]
    )
  ) {
    return {
      valid: false,
      message: "Unsupported audio MIME type.",
    }
  }

  if (file.size === 0) {
    return {
      valid: false,
      message: "The selected file is empty.",
    }
  }

  if (file.size > MAX_AUDIO_FILE_SIZE_BYTES) {
    return {
      valid: false,
      message: "This file exceeds the 25 MB upload limit.",
    }
  }

  return { valid: true as const }
}

const legalTransitions: Record<MeetingStatus, MeetingStatus[]> = {
  uploading: ["uploaded", "failed"],
  uploaded: ["transcribing", "failed"],
  transcribing: ["summarizing", "failed"],
  summarizing: ["completed", "failed"],
  completed: [],
  failed: ["transcribing", "summarizing"],
}

export function isLegalMeetingTransition(
  from: MeetingStatus,
  to: MeetingStatus
) {
  return legalTransitions[from].includes(to)
}
