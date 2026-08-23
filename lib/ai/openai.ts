import OpenAI from "openai"

import { getServerEnv } from "@/lib/env"

let cachedClient: OpenAI | null = null

export function getOpenAIClient() {
  if (!cachedClient) {
    const env = getServerEnv()

    if (!env.OPENAI_API_KEY) {
      throw new Error("OPENAI_API_KEY is not configured.")
    }

    cachedClient = new OpenAI({
      apiKey: env.OPENAI_API_KEY,
    })
  }

  return cachedClient
}

export function getTranscriptionModel() {
  const env = getServerEnv()
  return env.OPENAI_TRANSCRIPTION_MODEL ?? "gpt-4o-transcribe-diarize"
}

export function getSummaryModel() {
  const env = getServerEnv()
  return env.OPENAI_SUMMARY_MODEL ?? "gpt-4.1-mini"
}
