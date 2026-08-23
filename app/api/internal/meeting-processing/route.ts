import { sanitizeErrorMessage } from "@/lib/supabase/utils"
import { getRuntimeConfiguration } from "@/lib/env"
import {
  claimMeetingProcessingJob,
  completeMeetingProcessingJob,
  failMeetingProcessingJob,
} from "@/lib/meetings/jobs"
import { processMeetingJob } from "@/lib/meetings/processing"
import { hasWorkerAuthorization } from "@/lib/http/origin"
import { pruneExpiredRateLimits } from "@/lib/meetings/rate-limit"
import { createAdminSupabaseClient } from "@/lib/supabase/admin"

export const maxDuration = 300

async function handleWorkerRequest(request: Request) {
  const runtime = getRuntimeConfiguration()

  if (!runtime.liveProcessingConfigured) {
    return Response.json(
      { error: "Live processing is not configured." },
      { status: 503 }
    )
  }

  if (!hasWorkerAuthorization(request)) {
    return Response.json({ error: "Unauthorized" }, { status: 401 })
  }

  const admin = createAdminSupabaseClient()
  const workerId = crypto.randomUUID()
  const processedMeetingIds: string[] = []
  const startedAt = Date.now()

  await pruneExpiredRateLimits()

  while (Date.now() - startedAt < 240_000 && processedMeetingIds.length < 2) {
    const job = await claimMeetingProcessingJob(workerId)

    if (!job) {
      break
    }

    try {
      await processMeetingJob({
        meetingId: job.meeting_id,
        userId: job.user_id,
      })
      await completeMeetingProcessingJob(job.meeting_id, workerId)
      processedMeetingIds.push(job.meeting_id)
    } catch (error) {
      const safeError = sanitizeErrorMessage(error)

      await admin
        .from("meetings")
        .update({
          status: "failed",
          processing_error: safeError,
        })
        .eq("id", job.meeting_id)
        .eq("user_id", job.user_id)

      await failMeetingProcessingJob({
        meetingId: job.meeting_id,
        workerId,
        attemptCount: job.attempt_count,
        maxAttempts: job.max_attempts,
        errorMessage: safeError,
      })
    }
  }

  return Response.json({
    ok: true,
    processed: processedMeetingIds.length,
    meetingIds: processedMeetingIds,
  })
}

export async function GET(request: Request) {
  return handleWorkerRequest(request)
}

export async function POST(request: Request) {
  return handleWorkerRequest(request)
}
