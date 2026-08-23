import {
  getCanonicalAppOrigin,
  getCanonicalAppUrl,
  isLocalAliasHostname,
} from "@/lib/http/app-url"

describe("canonical app url helpers", () => {
  const originalEnv = { ...process.env }

  afterEach(() => {
    process.env = { ...originalEnv }
  })

  it("normalizes 127.0.0.1 to localhost", () => {
    process.env.NEXT_PUBLIC_APP_URL = "http://127.0.0.1:3000"

    expect(getCanonicalAppOrigin()).toBe("http://localhost:3000")
    expect(getCanonicalAppUrl("/auth/callback?next=/app")).toBe(
      "http://localhost:3000/auth/callback?next=/app"
    )
  })

  it("normalizes 0.0.0.0 to localhost", () => {
    process.env.NEXT_PUBLIC_APP_URL = "http://0.0.0.0:3000"

    expect(getCanonicalAppOrigin()).toBe("http://localhost:3000")
  })

  it("detects local alias hostnames", () => {
    expect(isLocalAliasHostname("127.0.0.1")).toBe(true)
    expect(isLocalAliasHostname("0.0.0.0")).toBe(true)
    expect(isLocalAliasHostname("localhost")).toBe(false)
  })
})
