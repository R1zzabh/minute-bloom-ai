import {
  ACCEPTED_AUDIO_EXTENSIONS,
  ACCEPTED_AUDIO_MIME_TYPES,
  MAX_AUDIO_FILE_SIZE_BYTES,
} from "@/lib/constants"
import type { MeetingRecord } from "@/types/meeting"

function readBoxType(bytes: Uint8Array, offset: number) {
  return String.fromCharCode(
    bytes[offset],
    bytes[offset + 1],
    bytes[offset + 2],
    bytes[offset + 3]
  )
}

function readBox(bytes: Uint8Array, offset: number, limit: number) {
  if (offset + 8 > limit) {
    return null
  }

  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength)
  let size = view.getUint32(offset)
  let headerSize = 8

  if (size === 1) {
    if (offset + 16 > limit) {
      return null
    }

    size = Number(view.getBigUint64(offset + 8))
    headerSize = 16
  } else if (size === 0) {
    size = limit - offset
  }

  if (size < headerSize || offset + size > limit) {
    return null
  }

  return {
    type: readBoxType(bytes, offset + 4),
    headerSize,
    start: offset,
    contentStart: offset + headerSize,
    end: offset + size,
  }
}

function findMp4AudioTrack(bytes: Uint8Array) {
  const stack = [{ start: 0, end: bytes.byteLength, parentType: "" }]

  while (stack.length > 0) {
    const region = stack.pop()

    if (!region) {
      continue
    }

    let offset = region.start

    while (offset + 8 <= region.end) {
      const box = readBox(bytes, offset, region.end)

      if (!box) {
        throw new Error("Corrupted MP4 container.")
      }

      if (box.type === "hdlr" && region.parentType === "mdia") {
        if (box.contentStart + 12 > box.end) {
          throw new Error("Corrupted MP4 handler box.")
        }

        const handlerType = readBoxType(bytes, box.contentStart + 8)

        if (handlerType === "soun") {
          return true
        }
      }

      if (["moov", "trak", "mdia"].includes(box.type)) {
        stack.push({
          start: box.contentStart,
          end: box.end,
          parentType: box.type,
        })
      }

      offset = box.end
    }
  }

  return false
}

function getAudioExtension(fileName: string) {
  return fileName.split(".").pop()?.toLowerCase() ?? ""
}

export function validateStoredMeetingAudio(
  meeting: Pick<MeetingRecord, "originalFileName" | "mimeType">,
  sizeBytes: number,
  bytes: Uint8Array
) {
  const extension = getAudioExtension(meeting.originalFileName)

  if (sizeBytes === 0) {
    throw new Error("The uploaded audio file is empty.")
  }

  if (sizeBytes > MAX_AUDIO_FILE_SIZE_BYTES) {
    throw new Error(
      "Stored audio exceeds the supported 25 MB processing limit."
    )
  }

  if (
    !ACCEPTED_AUDIO_EXTENSIONS.includes(
      extension as (typeof ACCEPTED_AUDIO_EXTENSIONS)[number]
    )
  ) {
    throw new Error(
      "Unsupported file extension. Use mp3, mp4, mpeg, mpga, m4a, wav, or webm."
    )
  }

  if (
    !ACCEPTED_AUDIO_MIME_TYPES.includes(
      meeting.mimeType as (typeof ACCEPTED_AUDIO_MIME_TYPES)[number]
    )
  ) {
    throw new Error("Unsupported audio MIME type.")
  }

  if (extension === "mp4" || meeting.mimeType === "video/mp4") {
    const hasAudioTrack = findMp4AudioTrack(bytes)

    if (!hasAudioTrack) {
      throw new Error("This MP4 file does not contain a usable audio track.")
    }
  }
}
