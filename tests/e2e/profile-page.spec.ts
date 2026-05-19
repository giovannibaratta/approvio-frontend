import {test, expect} from "@playwright/test"

test("authenticated profile page shows user info", async ({page}) => {
  await page.goto("/me")

  // Wait for the app to resolve session and render profile content
  await expect(page.getByRole("heading", {name: "My Profile"})).toBeVisible({timeout: 15000})

  await expect(page.getByText("Entity Type", {exact: true})).toBeVisible()
  await expect(page.getByText("user", {exact: true})).toBeVisible()

  await expect(page.getByText("ID", {exact: true})).toBeVisible()
  await expect(page.getByText("1", {exact: true})).toBeVisible()

  await expect(page.getByText("You are not a member of any groups.")).toBeVisible()

  // Verify Roles list has the correct roles and targets resolved
  await expect(page.getByText("GroupReadOnly")).toBeVisible()
  const targetLink = page.getByRole("link", {name: "Test Group"})
  await expect(targetLink).toBeVisible()
  await expect(targetLink).toHaveAttribute("href", "/groups/some-group-id")
})
