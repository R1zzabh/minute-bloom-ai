export async function GET() {
  return Response.json({
    ok: true,
    service: "minute-bloom",
    timestamp: new Date().toISOString(),
  })
}
