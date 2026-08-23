import { expect, test } from "@playwright/test"

test("landing page renders both primary CTAs and theme toggle", async ({
  page,
}) => {
  await page.goto("/")

  await expect(
    page.getByRole("heading", { name: "Meetings end. Momentum starts." })
  ).toBeVisible()
  await expect(
    page.getByRole("link", { name: "Summarize a meeting" }).first()
  ).toBeVisible()
  await expect(
    page.getByRole("link", { name: "View sample workspace" })
  ).toBeVisible()
  await expect(page.getByRole("button", { name: "Toggle theme" })).toBeVisible()
})

test("demo workspace tabs render", async ({ page }) => {
  await page.goto("/demo")

  await expect(
    page.getByText("deterministic public fixture", { exact: false })
  ).toBeVisible()
  await page.getByRole("button", { name: "Transcript" }).click()
  await expect(
    page.getByRole("textbox", { name: "Search transcript" })
  ).toBeVisible()
  await page.getByRole("button", { name: "Action Items" }).click()
  await expect(
    page.getByRole("textbox", { name: "Search action items" })
  ).toBeVisible()
})
