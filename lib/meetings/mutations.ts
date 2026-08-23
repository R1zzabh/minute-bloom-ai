import { demoMeeting } from "@/fixtures/demo-meeting"
import { hasConfiguredSupabase } from "@/lib/env"
import { createAdminSupabaseClient } from "@/lib/supabase/admin"
import { createServerSupabaseClient } from "@/lib/supabase/server"
import { sanitizeErrorMessage } from "@/lib/supabase/utils"
import { uploadMeetingInputSchema } from "@/lib/meetings/validators"

const bucketName = "meeting-audio"

export async function createMeetingRecord(
  userId: string,
  input: Parameters<typeof uploadMeetingInputSchema.parse>[0]
) {
  const validated = uploadMeetingInputSchema.parse(input)

  if (!hasConfiguredSupabase()) {
    return demoMeeting
  }

  const supabase = await createServerSupabaseClient()
  const { data, error } = await supabase
    .from("meetings")
    .insert({
      user_id: userId,
      title: validated.title,
      description: validated.description,
      language: validated.language,
      original_file_name: validated.originalFileName,
      storage_path: validated.storagePath,
      mime_type: validated.mimeType,
      size_bytes: validated.sizeBytes,
      status: "uploading",
      progress: 0,
    })
    .select("id")
    .single()

  if (error || !data) {
    throw new Error("Unable to create meeting.")
  }

  return data
}

export async function deleteMeetingForUser(meetingId: string, userId: string) {
  if (!hasConfiguredSupabase()) {
    return
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

  await admin.storage.from(bucketName).remove([data.storage_path])

  const { error: deleteError } = await supabase
    .from("meetings")
    .delete()
    .eq("id", meetingId)
    .eq("user_id", userId)

  if (deleteError) {
    throw new Error("Unable to delete meeting row.")
  }
}

export function toSafeProcessingError(error: unknown) {
  return sanitizeErrorMessage(error)
}
