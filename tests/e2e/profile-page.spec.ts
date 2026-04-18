import {test, expect} from "@playwright/test"

test("authenticated profile page shows user info", async ({page}) => {
  await page.goto("/me")

  // Wait for the app to resolve session and render profile content
  await expect(page.getByRole("heading", { name: "My Profile" })).toBeVisible({ timeout: 15000 })

  await expect(page.getByText("Email", { exact: true })).toBeVisible()
  await expect(page.getByText("test@example.com")).toBeVisible()

  await expect(page.getByText("Name", { exact: true })).toBeVisible()
  await expect(page.getByText("Test User")).toBeVisible()

  await expect(page.getByText("You are not a member of any groups.")).toBeVisible()
})
