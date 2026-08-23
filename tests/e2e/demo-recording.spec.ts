import { expect, test } from "@playwright/test"

test("record demo fixture flow", async ({ page }) => {
  await page.goto("/")
  await page.getByRole("link", { name: "View sample workspace" }).click()
  await expect(page).toHaveURL(/\/demo$/)
  await page.getByRole("button", { name: "Transcript" }).click()
  await page.getByRole("button", { name: "Action Items" }).click()
  await page.getByRole("button", { name: "Ask AI" }).click()
})
