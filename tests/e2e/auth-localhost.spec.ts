import { createClient } from "@supabase/supabase-js"
import { expect, test } from "@playwright/test"

function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const secret = process.env.SUPABASE_SECRET_KEY

  if (!url || !secret) {
    throw new Error("Live auth E2E requires Supabase environment variables.")
  }

  return createClient(url, secret, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
}

test.describe("localhost magic-link auth", () => {
  test.skip(
    process.env.RUN_LIVE_E2E !== "1",
    "RUN_LIVE_E2E=1 is required for live localhost auth coverage."
  )

  test("completes sign-in, refresh, sign-out, and signed-out protection", async ({
    page,
  }) => {
    test.setTimeout(180_000)

    const admin = createAdminClient()
    const email = `codex-auth-e2e-${Date.now()}@example.com`
    const nextAssetStatuses: number[] = []
    let userId: string | null = null

    page.on("response", (response) => {
      if (response.url().includes("/_next/")) {
        nextAssetStatuses.push(response.status())
      }
    })

    try {
      await page.goto("/sign-in")
      await expect(page).toHaveURL("http://localhost:3000/sign-in")

      await page.getByLabel("Work email").fill(email)
      await page.getByRole("button", { name: "Continue with email" }).click()

      await expect(page).toHaveURL("http://localhost:3000/sign-in")
      await expect(
        page.getByText(
          /check your email for the sign-in link, then open it in this same browser on localhost:3000\./i
        )
      ).toBeVisible()

      const { data, error } = await admin.auth.admin.generateLink({
        type: "magiclink",
        email,
        options: {
          redirectTo: "http://localhost:3000/auth/callback?next=/app",
        },
      })

      if (error) {
        throw error
      }

      userId = data.user?.id ?? null

      await page.goto(data.properties.action_link)
      await expect(page).toHaveURL("http://localhost:3000/app")
      await expect(page.getByText(email)).toBeVisible()
      await expect(
        page.getByRole("link", { name: "Dashboard" })
      ).toBeVisible()
      await expect(
        page.getByRole("button", { name: "Sign out" })
      ).toBeVisible()

      await page.reload()
      await expect(page).toHaveURL("http://localhost:3000/app")
      await expect(page.getByText(email)).toBeVisible()

      await page.getByRole("button", { name: "Sign out" }).click()
      await expect(page).toHaveURL("http://localhost:3000/sign-in?signed_out=1")
      await expect(page.getByText("You have been signed out.")).toBeVisible()

      await page.goto("/app")
      await expect(page).toHaveURL("http://localhost:3000/sign-in")

      expect(nextAssetStatuses).not.toContain(403)
    } finally {
      if (userId) {
        const { error } = await admin.auth.admin.deleteUser(userId)

        if (error) {
          throw error
        }
      }
    }
  })
})
