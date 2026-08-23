import { sanitizeErrorMessage } from "@/lib/supabase/utils"

describe("sanitizeErrorMessage", () => {
  const originalEnv = { ...process.env }

  afterEach(() => {
    process.env = { ...originalEnv }
  })

  it("redacts configured non-empty secrets", () => {
    process.env.OPENAI_API_KEY = "sk-secret"
    process.env.GROQ_API_KEY = "gsk-secret"
    process.env.SUPABASE_SECRET_KEY = "sb-secret"
    process.env.CRON_SECRET = "cron-secret"

    const message = sanitizeErrorMessage(
      new Error("Failed sk-secret and gsk-secret and sb-secret and cron-secret")
    )

    expect(message).not.toContain("sk-secret")
    expect(message).not.toContain("gsk-secret")
    expect(message).not.toContain("sb-secret")
    expect(message).not.toContain("cron-secret")
    expect(message).toContain("[redacted]")
  })

  it("ignores empty secret values and preserves readable messages", () => {
    process.env.OPENAI_API_KEY = "   "
    process.env.SUPABASE_SECRET_KEY = ""

    expect(sanitizeErrorMessage(new Error("Readable failure"))).toBe(
      "Readable failure"
    )
  })

  it("collapses control characters and whitespace after redaction", () => {
    process.env.OPENAI_API_KEY = "sk-secret"

    expect(
      sanitizeErrorMessage(new Error("Bad\n\tfailure sk-secret\u0000 details"))
    ).toBe("Bad failure [redacted] details")
  })
})
