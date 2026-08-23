import { z } from "zod"

import {
  ACCEPTED_AUDIO_EXTENSIONS,
  ACCEPTED_AUDIO_MIME_TYPES,
  MAX_AUDIO_FILE_SIZE_BYTES,
} from "@/lib/constants"
import type { MeetingStatus } from "@/types/meeting"

export const meetingStatusSchema = z.enum([
  "uploading",
  "uploaded",
  "transcribing",
  "summarizing",
  "completed",
  "failed",
])

export const actionItemPrioritySchema = z.enum(["low", "medium", "high"])
export const actionItemStatusSchema = z.enum(["open", "in_progress", "done"])

export const createMeetingRequestSchema = z.object({
  title: z.string().trim().max(160).optional(),
  description: z.string().trim().max(600).nullish(),
  language: z.string().trim().min(1).max(24).default("auto"),
  originalFileName: z.string().trim().min(1).max(255),
  mimeType: z.string().trim().min(1),
  sizeBytes: z.number().int().positive().max(MAX_AUDIO_FILE_SIZE_BYTES),
})

export const uploadMeetingInputSchema = createMeetingRequestSchema.extend({
  title: z.string().trim().min(1).max(160),
  description: z.string().trim().max(600).nullable(),
  storagePath: z.string().trim().min(1),
})

export const chatRequestSchema = z.object({
  question: z.string().trim().min(1).max(500),
})

export const exportFormatSchema = z.enum(["markdown", "text", "json"])

export const updateMeetingMetadataSchema = z
  .object({
    title: z.string().trim().min(1).max(160).optional(),
    description: z.string().trim().max(600).nullable().optional(),
    language: z.string().trim().min(1).max(24).optional(),
  })
  .refine((value) => Object.keys(value).length > 0, {
    message: "At least one meeting field must be updated.",
  })

export const updateActionItemSchema = z
  .object({
    task: z.string().trim().min(1).max(240).optional(),
    owner: z.string().trim().max(120).nullable().optional(),
    dueDate: z.string().date().nullable().optional(),
    priority: actionItemPrioritySchema.optional(),
    status: actionItemStatusSchema.optional(),
  })
  .refine((value) => Object.keys(value).length > 0, {
    message: "At least one action item field must be updated.",
  })

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
