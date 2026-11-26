import {expect, test} from "@playwright/test"

test("creates an organization from an account with no memberships", async ({page}) => {
  // Given
  await page.addInitScript(() => {
    sessionStorage.setItem("mock-organization", "")
    if (sessionStorage.getItem("mock-organizations") === null) sessionStorage.setItem("mock-organizations", "[]")
  })
  await page.goto("/")
  await expect(page.getByText("You don’t belong to an organization yet.")).toBeVisible()

  // When
  await page.getByRole("link", {name: "Create organization"}).click()
  await page.getByLabel("Organization name").fill("Acme Approvals")
  await page.getByLabel("Organization slug").fill("acme-approvals")
  await page.getByRole("button", {name: "Create organization"}).click()

  // Expect
  await expect(page).toHaveURL("/organizations")
  await expect(page.getByRole("button", {name: "Open Acme Approvals"})).toBeVisible()
})
