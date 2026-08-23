const CONTROL_CHARACTER_PATTERN = /[\u0000-\u001f\u007f]/
const BACKSLASH_PATTERN = /\\/

export function getSafePostAuthPath(
  candidate: string | null | undefined,
  requestUrl: string
) {
  if (!candidate) {
    return "/app"
  }

  if (CONTROL_CHARACTER_PATTERN.test(candidate)) {
    return "/app"
  }

  if (BACKSLASH_PATTERN.test(candidate)) {
    return "/app"
  }

  if (!candidate.startsWith("/") || candidate.startsWith("//")) {
    return "/app"
  }

  let decodedCandidate = candidate

  try {
    decodedCandidate = decodeURIComponent(candidate)
  } catch {
    return "/app"
  }

  if (
    CONTROL_CHARACTER_PATTERN.test(decodedCandidate) ||
    BACKSLASH_PATTERN.test(decodedCandidate) ||
    !decodedCandidate.startsWith("/") ||
    decodedCandidate.startsWith("//")
  ) {
    return "/app"
  }

  const request = new URL(requestUrl)
  const nextUrl = new URL(decodedCandidate, request.origin)

  if (nextUrl.origin !== request.origin) {
    return "/app"
  }

  return `${nextUrl.pathname}${nextUrl.search}${nextUrl.hash}`
}
