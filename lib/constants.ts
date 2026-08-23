export const MAX_AUDIO_FILE_SIZE_BYTES = 25 * 1024 * 1024
export const RESUMABLE_UPLOAD_THRESHOLD_BYTES = 6 * 1024 * 1024

export const ACCEPTED_AUDIO_EXTENSIONS = [
  "mp3",
  "mp4",
  "mpeg",
  "mpga",
  "m4a",
  "wav",
  "webm",
] as const

export const ACCEPTED_AUDIO_MIME_TYPES = [
  "audio/mpeg",
  "audio/mp4",
  "audio/mpga",
  "audio/m4a",
  "audio/wav",
  "audio/webm",
  "video/mp4",
] as const

export const ACTIVE_MEETING_STATUSES = [
  "uploading",
  "uploaded",
  "transcribing",
  "summarizing",
] as const

export const TERMINAL_MEETING_STATUSES = ["completed", "failed"] as const
