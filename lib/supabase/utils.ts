export function sanitizeErrorMessage(error: unknown) {
  if (error instanceof Error) {
    let sanitized = error.message
    const secrets = [
      process.env.OPENAI_API_KEY,
      process.env.GROQ_API_KEY,
      process.env.SUPABASE_SECRET_KEY,
      process.env.SUPABASE_SERVICE_ROLE_KEY,
      process.env.CRON_SECRET,
    ]
      .map((value) => value?.trim())
      .filter((value): value is string => Boolean(value))

    for (const secret of secrets) {
      sanitized = sanitized.replaceAll(secret, "[redacted]")
    }

    sanitized = sanitized
      .replace(/[\u0000-\u001f\u007f]+/g, " ")
      .replace(/\s+/g, " ")
      .trim()

    return sanitized.length > 0
      ? sanitized.slice(0, 240)
      : "Unexpected processing error."
  }

  return "Unexpected processing error."
}

export function getSupabaseAuthStorageKey(supabaseUrl: string) {
  const hostname = new URL(supabaseUrl).hostname
  const projectRef = hostname.split(".")[0]

  return `sb-${projectRef}-auth-token`
}

export function isSupabaseAuthCookieName(name: string, storageKey: string) {
  return name === storageKey || name.startsWith(`${storageKey}.`)
}
