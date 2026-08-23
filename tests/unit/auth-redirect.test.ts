import { getSafePostAuthPath } from "@/lib/auth/redirect"

describe("safe post-auth redirect handling", () => {
  it("keeps safe internal paths with query and hash", () => {
    expect(
      getSafePostAuthPath(
        "/app/meetings?id=123#summary",
        "https://minute-bloom.example/auth/callback"
      )
    ).toBe("/app/meetings?id=123#summary")
  })

  it("falls back for malicious redirect inputs", () => {
    const requestUrl = "https://minute-bloom.example/auth/callback"

    expect(getSafePostAuthPath("https://evil.example", requestUrl)).toBe("/app")
    expect(getSafePostAuthPath("//evil.example", requestUrl)).toBe("/app")
    expect(getSafePostAuthPath("/%2fevil.example", requestUrl)).toBe("/app")
    expect(getSafePostAuthPath("/\\evil", requestUrl)).toBe("/app")
    expect(getSafePostAuthPath("/%5cevil", requestUrl)).toBe("/app")
    expect(getSafePostAuthPath("/app%00", requestUrl)).toBe("/app")
  })
})
