import { createClient } from "@supabase/supabase-js"
import { expect, test } from "@playwright/test"

const projectRef = "knlounxdcfqbbpflaivj"
const authCookieName = `sb-${projectRef}-auth-token`
const liveFixtures = [
  {
    label: "standard",
    path: "/tmp/minutebloom-upload-fixtures/sample-5s-360p.mp4",
    expectedMode: "Standard",
  },
  {
    label: "resumable",
    path: "/tmp/minutebloom-upload-fixtures/sample-5s-360p-x7.mp4",
    expectedMode: "Resumable",
  },
] as const

function base64UrlEncode(value: string) {
  return Buffer.from(value, "utf8")
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "")
}

async function createLiveAuthCookieValue() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const publishable = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
  const secret = process.env.SUPABASE_SECRET_KEY

  if (!url || !publishable || !secret) {
    throw new Error("Live upload E2E requires Supabase environment variables.")
  }

  const email = "codex-upload-test@example.com"
  const password = "MinuteBloomUploadTest!234"
  const admin = createClient(url, secret, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
  const { data: list, error: listError } = await admin.auth.admin.listUsers({
    page: 1,
    perPage: 1000,
  })

  if (listError) {
    throw listError
  }

  const existing = list.users.find((user) => user.email === email)

  if (!existing) {
    const { error } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    })

    if (error) {
      throw error
    }
  } else {
    const { error } = await admin.auth.admin.updateUserById(existing.id, {
      password,
      email_confirm: true,
    })

    if (error) {
      throw error
    }
  }

  const client = createClient(url, publishable, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
  const { data, error } = await client.auth.signInWithPassword({
    email,
    password,
  })

  if (error || !data.session) {
    throw error ?? new Error("Unable to create a live upload session.")
  }

  return `base64-${base64UrlEncode(JSON.stringify(data.session))}`
}

test.describe("live mp4 uploads", () => {
  test.skip(
    process.env.RUN_LIVE_E2E !== "1",
    "RUN_LIVE_E2E=1 is required for real Supabase/live-provider upload coverage."
  )

  for (const fixture of liveFixtures) {
    test(`${fixture.label} mp4 reaches processing`, async ({
      context,
      page,
    }) => {
      test.setTimeout(180_000)

      const cookieValue = await createLiveAuthCookieValue()

      await context.addCookies([
        {
          name: authCookieName,
          value: cookieValue,
          url: "http://localhost:3000",
          path: "/",
        },
      ])

      const browserMessages: string[] = []
      const pageErrors: string[] = []
      const networkEvents: string[] = []

      page.on("console", (message) => {
        const line = `[console:${message.type()}] ${message.text()}`
        browserMessages.push(line)
        console.log(line)
      })

      page.on("pageerror", (error) => {
        const line = `[pageerror] ${error.stack ?? error.message}`
        pageErrors.push(line)
        console.log(line)
      })

      page.on("requestfailed", (request) => {
        const line = `[requestfailed] ${request.method()} ${request.url()} ${request.failure()?.errorText ?? "unknown"}`
        networkEvents.push(line)
        console.log(line)
      })

      page.on("response", async (response) => {
        const url = response.url()

        if (
          !url.includes("/api/meetings") &&
          !url.includes("/storage/v1") &&
          !url.includes("/upload/resumable")
        ) {
          return
        }

        const line = `[response] ${response.status()} ${response.request().method()} ${url}`
        networkEvents.push(line)
        console.log(line)
      })

      await page.goto("/app/meetings/new")
      await expect(page).toHaveURL(/\/app\/meetings\/new$/)

      const fileChooser = page.locator('input[type="file"]')
      await fileChooser.setInputFiles(fixture.path)

      await expect(
        page.getByText(fixture.expectedMode, { exact: true })
      ).toBeVisible()

      await page.getByRole("button", { name: "Start upload" }).click()

      const toast = page.locator("[data-sonner-toast]")
      const errorToast = toast.filter({
        hasText: "Cannot read properties of undefined (reading 'replace')",
      })

      if (await errorToast.count()) {
        throw new Error(
          [
            "Upload reproduced the replace error toast.",
            ...pageErrors,
            ...browserMessages,
            ...networkEvents,
          ].join("\n")
        )
      }

      await expect(page).toHaveURL(/\/app\/meetings\/[0-9a-f-]+$/)
      await expect(
        page.getByText(
          /upload complete\. minutebloom is processing the meeting\./i
        )
      ).toBeVisible({ timeout: 30_000 })
      await expect(
        page.getByText(/transcribing|summarizing|completed/i)
      ).toBeVisible({
        timeout: 30_000,
      })
    })
  }
})
