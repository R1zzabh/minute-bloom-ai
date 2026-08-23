import { ASK_AI_SYSTEM_PROMPT, SUMMARY_SYSTEM_PROMPT } from "@/lib/ai/prompts"

describe("prompt guardrails", () => {
  it("contains anti-hallucination instructions for summaries", () => {
    expect(SUMMARY_SYSTEM_PROMPT).toContain("Use only facts present")
    expect(SUMMARY_SYSTEM_PROMPT).toContain("Do not invent")
    expect(SUMMARY_SYSTEM_PROMPT).toContain("Use null")
    expect(SUMMARY_SYSTEM_PROMPT).toContain("If the transcript is empty")
  })

  it("keeps ask-ai grounded", () => {
    expect(ASK_AI_SYSTEM_PROMPT).toContain(
      "Answer only from the provided transcript"
    )
    expect(ASK_AI_SYSTEM_PROMPT).toContain("If the answer is absent")
  })
})
