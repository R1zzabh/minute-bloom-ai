import { validateStoredMeetingAudio } from "@/lib/meetings/audio"

function box(type: string, payload: number[] = []) {
  const size = 8 + payload.length
  const header = [
    (size >>> 24) & 0xff,
    (size >>> 16) & 0xff,
    (size >>> 8) & 0xff,
    size & 0xff,
    ...type.split("").map((char) => char.charCodeAt(0)),
  ]

  return [...header, ...payload]
}

function buildMp4(handlerType: "soun" | "vide") {
  const hdlrPayload = [
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    ...handlerType.split("").map((char) => char.charCodeAt(0)),
    0,
    0,
    0,
    0,
  ]

  return new Uint8Array([
    ...box("ftyp", [0, 0, 0, 0]),
    ...box("moov", [
      ...box("trak", [...box("mdia", [...box("hdlr", hdlrPayload)])]),
    ]),
  ])
}

describe("stored audio validation", () => {
  it("accepts mp4 files with an audio track", () => {
    expect(() =>
      validateStoredMeetingAudio(
        {
          originalFileName: "demo.mp4",
          mimeType: "video/mp4",
        },
        512,
        buildMp4("soun")
      )
    ).not.toThrow()
  })

  it("rejects mp4 files without an audio track", () => {
    expect(() =>
      validateStoredMeetingAudio(
        {
          originalFileName: "demo.mp4",
          mimeType: "video/mp4",
        },
        512,
        buildMp4("vide")
      )
    ).toThrow("usable audio track")
  })
})
