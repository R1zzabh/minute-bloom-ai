import type { NextConfig } from "next"

const supabaseHost =
  process.env.NEXT_PUBLIC_SUPABASE_URL?.trim()
    .replace(/\/$/, "")
    .replace(/^https?:\/\//, "") ?? "*.supabase.co"
const isHttpsApp =
  process.env.NEXT_PUBLIC_APP_URL?.trim().startsWith("https://")
const connectSrc = [
  "'self'",
  `https://${supabaseHost}`,
  "https://api.openai.com",
]

if (process.env.NODE_ENV === "development") {
  connectSrc.push("ws:", "wss:")
}

const csp = [
  "default-src 'self'",
  "base-uri 'self'",
  "frame-ancestors 'none'",
  "form-action 'self'",
  "img-src 'self' data: blob: https:",
  "media-src 'self' blob: data: https:",
  `connect-src ${connectSrc.join(" ")}`,
  "font-src 'self' https: data:",
  "object-src 'none'",
  "style-src 'self' 'unsafe-inline' https:",
  `script-src 'self' 'unsafe-inline'${process.env.NODE_ENV === "development" ? " 'unsafe-eval'" : ""}`,
].join("; ")

const securityHeaders = [
  {
    key: "Content-Security-Policy",
    value: csp,
  },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=()",
  },
  {
    key: "Referrer-Policy",
    value: "strict-origin-when-cross-origin",
  },
  {
    key: "X-Content-Type-Options",
    value: "nosniff",
  },
  {
    key: "X-Frame-Options",
    value: "DENY",
  },
]

if (isHttpsApp) {
  securityHeaders.push({
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  })
}

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
    ]
  },
}

export default nextConfig
