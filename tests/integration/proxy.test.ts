import { NextRequest } from "next/server"
import { beforeEach, describe, expect, it, vi } from "vitest"

const mocks = vi.hoisted(() => ({
  updateSession: vi.fn(),
}))

vi.mock("@/lib/supabase/middleware", () => ({
  updateSession: mocks.updateSession,
}))

import { config, proxy } from "@/proxy"

describe("proxy auth bypass and canonical host redirects", () => {
  beforeEach(() => {
    mocks.updateSession.mockReset()
    mocks.updateSession.mockResolvedValue(new Response(null, { status: 200 }))
  })

  it("redirects 127.0.0.1 document requests to localhost", async () => {
    const response = await proxy(
      new NextRequest("http://127.0.0.1:3000/sign-in", {
        headers: {
          accept: "text/html",
          host: "127.0.0.1:3000",
        },
      })
    )

    expect(response.headers.get("location")).toBe("http://localhost:3000/sign-in")
    expect(mocks.updateSession).not.toHaveBeenCalled()
  })

  it("does not redirect non-document requests on 127.0.0.1", async () => {
    await proxy(
      new NextRequest("http://127.0.0.1:3000/sign-in", {
        headers: {
          accept: "application/json",
          host: "127.0.0.1:3000",
          "sec-fetch-dest": "empty",
        },
      })
    )

    expect(mocks.updateSession).toHaveBeenCalledTimes(1)
  })

  it("does not redirect the callback exchange host handling", async () => {
    await proxy(
      new NextRequest("http://127.0.0.1:3000/auth/callback?code=123", {
        headers: {
          accept: "text/html",
          host: "127.0.0.1:3000",
        },
      })
    )

    expect(mocks.updateSession).toHaveBeenCalledTimes(1)
  })

  it("bypasses next static assets entirely", async () => {
    const response = await proxy(
      new NextRequest("http://localhost:3000/_next/static/chunks/app.js")
    )

    expect(response.status).toBe(200)
    expect(mocks.updateSession).not.toHaveBeenCalled()
  })

  it("bypasses next font assets entirely", async () => {
    const response = await proxy(
      new NextRequest("http://localhost:3000/_nextjs_font/example.woff2")
    )

    expect(response.status).toBe(200)
    expect(mocks.updateSession).not.toHaveBeenCalled()
  })

  it("keeps next internals out of the matcher", () => {
    expect(config.matcher).toEqual([
      "/((?!_next/|_nextjs_font/|favicon.ico|robots.txt|sitemap.xml|manifest.json|manifest.webmanifest|site.webmanifest|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js|map|woff|woff2|ttf|otf)$).*)",
    ])
  })
})
