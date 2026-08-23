export function sanitizeErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message
      .replaceAll(process.env.OPENAI_API_KEY ?? "", "[redacted]")
      .replaceAll(process.env.SUPABASE_SERVICE_ROLE_KEY ?? "", "[redacted]")
      .slice(0, 240)
  }

  return "Unexpected processing error."
}
