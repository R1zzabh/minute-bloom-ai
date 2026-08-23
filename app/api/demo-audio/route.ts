const durationSeconds = 150
const sampleRate = 8_000
const channels = 1
const bitsPerSample = 8

function buildSilentWav() {
  const bytesPerSample = bitsPerSample / 8
  const frameCount = durationSeconds * sampleRate
  const dataSize = frameCount * channels * bytesPerSample
  const buffer = new ArrayBuffer(44 + dataSize)
  const view = new DataView(buffer)
  let offset = 0

  function writeString(value: string) {
    for (let index = 0; index < value.length; index += 1) {
      view.setUint8(offset + index, value.charCodeAt(index))
    }
    offset += value.length
  }

  writeString("RIFF")
  view.setUint32(offset, 36 + dataSize, true)
  offset += 4
  writeString("WAVE")
  writeString("fmt ")
  view.setUint32(offset, 16, true)
  offset += 4
  view.setUint16(offset, 1, true)
  offset += 2
  view.setUint16(offset, channels, true)
  offset += 2
  view.setUint32(offset, sampleRate, true)
  offset += 4
  view.setUint32(offset, sampleRate * channels * bytesPerSample, true)
  offset += 4
  view.setUint16(offset, channels * bytesPerSample, true)
  offset += 2
  view.setUint16(offset, bitsPerSample, true)
  offset += 2
  writeString("data")
  view.setUint32(offset, dataSize, true)
  offset += 4

  for (let index = offset; index < buffer.byteLength; index += 1) {
    view.setUint8(index, 128)
  }

  return buffer
}

export async function GET() {
  return new Response(buildSilentWav(), {
    headers: {
      "Content-Type": "audio/wav",
      "Cache-Control": "public, max-age=3600",
      "Content-Disposition": 'inline; filename="minutebloom-demo-audio.wav"',
    },
  })
}
