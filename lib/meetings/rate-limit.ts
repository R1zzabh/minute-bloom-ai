const buckets = new Map<string, { count: number; resetAt: number }>()

export function takeRateLimitToken(
  key: string,
  maxRequests: number,
  windowMs: number
) {
  const now = Date.now()
  const current = buckets.get(key)

  if (!current || current.resetAt <= now) {
    buckets.set(key, {
      count: 1,
      resetAt: now + windowMs,
    })
    return true
  }

  if (current.count >= maxRequests) {
    return false
  }

  current.count += 1
  return true
}
