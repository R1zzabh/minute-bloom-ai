import { after } from "next/server"

import {
  PROCESSING_JOB_LEASE_SECONDS,
  PROCESSING_JOB_MAX_ATTEMPTS,
  PROCESSING_RETRY_BACKOFF_SECONDS,
} from "@/lib/constants"
import { getServerEnv, hasConfiguredSupabaseAdmin } from "@/lib/env"
import { createAdminSupabaseClient } from "@/lib/supabase/admin"
import type { Database } from "@/types/database"

type ClaimedMeetingJob = {
  id: string
  meeting_id: string
  user_id: string
  attempt_count: number
  max_attempts: number
}

export function getRetryBackoffSeconds(attemptCount: number) {
  return (
    PROCESSING_RETRY_BACKOFF_SECONDS[
      Math.min(
        Math.max(attemptCount - 1, 0),
        PROCESSING_RETRY_BACKOFF_SECONDS.length - 1
      )
    ] ??
    PROCESSING_RETRY_BACKOFF_SECONDS.at(-1) ??
    3600
  )
}

export async function enqueueMeetingProcessingJob(input: {
  meetingId: string
  userId: string
  resetAttempts?: boolean
}) {
  if (!hasConfiguredSupabaseAdmin()) {
    throw new Error("Live processing is not configured.")
  }

  const admin = createAdminSupabaseClient()
  const now = new Date().toISOString()
  const payload: Database["public"]["Tables"]["meeting_processing_jobs"]["Insert"] =
    {
      meeting_id: input.meetingId,
      user_id: input.userId,
      status: "queued",
      max_attempts: PROCESSING_JOB_MAX_ATTEMPTS,
      available_at: now,
      lease_expires_at: null,
      locked_by: null,
      last_error: null,
      requested_at: now,
      finished_at: null,
      ...(input.resetAttempts
        ? {
            attempt_count: 0,
            started_at: null,
          }
        : {}),
    }

  const { error } = await admin
    .from("meeting_processing_jobs")
    .upsert(payload, { onConflict: "meeting_id" })

  if (error) {
    throw new Error("Unable to enqueue the meeting for processing.")
  }
}

export async function claimMeetingProcessingJob(workerId: string) {
  if (!hasConfiguredSupabaseAdmin()) {
    return null
  }

  const admin = createAdminSupabaseClient()
  const { data, error } = await admin.rpc("claim_meeting_processing_job", {
    p_worker_id: workerId,
    p_lease_seconds: PROCESSING_JOB_LEASE_SECONDS,
  })

  if (error) {
    throw new Error("Unable to claim a queued meeting job.")
  }

  const [job] = (data ?? []) as ClaimedMeetingJob[]
  return job ?? null
}

export async function completeMeetingProcessingJob(
  meetingId: string,
  workerId: string
) {
  if (!hasConfiguredSupabaseAdmin()) {
    return
  }

  const admin = createAdminSupabaseClient()
  await admin
    .from("meeting_processing_jobs")
    .update({
      status: "completed",
      finished_at: new Date().toISOString(),
      available_at: new Date().toISOString(),
      lease_expires_at: null,
      locked_by: null,
      last_error: null,
    })
    .eq("meeting_id", meetingId)
    .eq("locked_by", workerId)
}

export async function failMeetingProcessingJob(input: {
  meetingId: string
  workerId: string
  attemptCount: number
  maxAttempts: number
  errorMessage: string
}) {
  if (!hasConfiguredSupabaseAdmin()) {
    return
  }

  const admin = createAdminSupabaseClient()
  const shouldRetry = input.attemptCount < input.maxAttempts
  const availableAt = new Date(
    Date.now() + getRetryBackoffSeconds(input.attemptCount) * 1000
  ).toISOString()

  await admin
    .from("meeting_processing_jobs")
    .update({
      status: shouldRetry ? "queued" : "failed",
      available_at: shouldRetry ? availableAt : new Date().toISOString(),
      lease_expires_at: null,
      locked_by: null,
      last_error: input.errorMessage,
      finished_at: shouldRetry ? null : new Date().toISOString(),
    })
    .eq("meeting_id", input.meetingId)
    .eq("locked_by", input.workerId)
}

export function scheduleMeetingWorker(requestUrl: string) {
  const secret = getServerEnv().CRON_SECRET

  if (!secret) {
    return
  }

  const triggerUrl = new URL("/api/internal/meeting-processing", requestUrl)

  after(async () => {
    try {
      await fetch(triggerUrl, {
        method: "GET",
        headers: {
          authorization: `Bearer ${secret}`,
        },
        cache: "no-store",
      })
    } catch {
      // The cron route is the durable recovery path if the best-effort trigger fails.
    }
  })
}
