import { hasConfiguredSupabase } from "@/lib/env"
import { createStoragePath, sanitizeFileName } from "@/lib/utils"
import { createAdminSupabaseClient } from "@/lib/supabase/admin"
import { createServerSupabaseClient } from "@/lib/supabase/server"
import { sanitizeErrorMessage } from "@/lib/supabase/utils"
import type { Database } from "@/types/database"
import {
  createMeetingRequestSchema,
  updateActionItemSchema,
  uploadMeetingInputSchema,
} from "@/lib/meetings/validators"

const bucketName = "meeting-audio"

export async function createMeetingRecord(
  userId: string,
  input: Parameters<typeof createMeetingRequestSchema.parse>[0]
) {
  const validated = createMeetingRequestSchema.parse(input)
  const meetingId = crypto.randomUUID()
  const storagePath = createStoragePath(
    userId,
    meetingId,
    sanitizeFileName(validated.originalFileName)
  )
  const title =
    validated.title?.trim() ||
    validated.originalFileName.replace(/\.[^.]+$/, "").slice(0, 160)

  const record = uploadMeetingInputSchema.parse({
    ...validated,
    title,
    description: validated.description ?? null,
    storagePath,
  })

  if (!hasConfiguredSupabase()) {
    throw new Error("Supabase is not configured for the live workspace.")
  }

  const supabase = await createServerSupabaseClient()
  const { data, error } = await supabase
    .from("meetings")
    .insert({
      id: meetingId,
      user_id: userId,
      title: record.title,
      description: record.description,
      language: record.language,
      original_file_name: record.originalFileName,
      storage_path: record.storagePath,
      mime_type: record.mimeType,
      size_bytes: record.sizeBytes,
      status: "uploading",
      progress: 0,
    })
    .select("id, storage_path, status")
    .single()

  if (error || !data) {
    throw new Error("Unable to create meeting.")
  }

  return data
}

export async function deleteMeetingForUser(meetingId: string, userId: string) {
  if (!hasConfiguredSupabase()) {
    throw new Error("Supabase is not configured for the live workspace.")
  }

  const supabase = await createServerSupabaseClient()
  const admin = createAdminSupabaseClient()
  const { data, error } = await supabase
    .from("meetings")
    .select("storage_path")
    .eq("id", meetingId)
    .eq("user_id", userId)
    .maybeSingle()

  if (error) {
    throw new Error("Unable to delete meeting.")
  }

  if (!data) {
    return
  }

  const { error: storageError } = await admin.storage
    .from(bucketName)
    .remove([data.storage_path])

  if (
    storageError &&
    !storageError.message.toLowerCase().includes("not found") &&
    !storageError.message.toLowerCase().includes("no such object")
  ) {
    throw new Error("Unable to delete the private audio object.")
  }

  const { error: deleteError } = await supabase
    .from("meetings")
    .delete()
    .eq("id", meetingId)
    .eq("user_id", userId)

  if (deleteError) {
    throw new Error("Unable to delete meeting row.")
  }
}

export async function updateMeetingForUser(
  meetingId: string,
  userId: string,
  input: Database["public"]["Tables"]["meetings"]["Update"]
) {
  if (!hasConfiguredSupabase()) {
    throw new Error("Supabase is not configured for the live workspace.")
  }

  const supabase = await createServerSupabaseClient()
  const payload = input

  const { data, error } = await supabase
    .from("meetings")
    .update(payload)
    .eq("id", meetingId)
    .eq("user_id", userId)
    .select("id")
    .maybeSingle()

  if (error) {
    throw new Error("Unable to update meeting.")
  }

  return data
}

export async function updateActionItemForUser(
  meetingId: string,
  actionItemId: string,
  userId: string,
  input: Parameters<typeof updateActionItemSchema.parse>[0]
) {
  const validated = updateActionItemSchema.parse(input)

  if (!hasConfiguredSupabase()) {
    throw new Error("Supabase is not configured for the live workspace.")
  }

  const supabase = await createServerSupabaseClient()
  const { data, error } = await supabase
    .from("action_items")
    .update({
      task: validated.task,
      owner: validated.owner,
      due_date: validated.dueDate,
      priority: validated.priority,
      status: validated.status,
    })
    .eq("id", actionItemId)
    .eq("meeting_id", meetingId)
    .eq("user_id", userId)
    .select("id")
    .maybeSingle()

  if (error) {
    throw new Error("Unable to update action item.")
  }

  return data
}

export function toSafeProcessingError(error: unknown) {
  return sanitizeErrorMessage(error)
}
