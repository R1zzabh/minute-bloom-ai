const LOCAL_ALIAS_HOSTS = new Set(["127.0.0.1", "0.0.0.0"])

function normalizeAppUrl(value: string | undefined) {
  const normalized = value?.trim() || "http://localhost:3000"
  const url = new URL(normalized)

  if (LOCAL_ALIAS_HOSTS.has(url.hostname)) {
    url.protocol = "http:"
    url.hostname = "localhost"
    url.port = url.port || "3000"
  }

  url.pathname = "/"
  url.search = ""
  url.hash = ""

  return url
}

export function getCanonicalAppOrigin() {
  return normalizeAppUrl(process.env.NEXT_PUBLIC_APP_URL)
    .toString()
    .replace(/\/$/, "")
}

export function getCanonicalAppUrl(pathname = "/") {
  return new URL(pathname, getCanonicalAppOrigin()).toString()
}

export function isLocalAliasHostname(hostname: string) {
  return LOCAL_ALIAS_HOSTS.has(hostname)
}
