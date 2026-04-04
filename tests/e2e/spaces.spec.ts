import {test, expect} from "@playwright/test"

test("can navigate to create space page and create a space", async ({page}) => {
  await page.goto("/spaces")

  // Wait for the table to load
  await page.waitForSelector("h1:has-text('Spaces')")

  // Click Create Space button
  const createButton = page.getByRole("link", {name: "Create Space"})
  await expect(createButton).toBeVisible()
  await createButton.click()

  // Verify we are on the create space page
  await expect(page).toHaveURL("/spaces/new")
  // Using heading to be more specific and avoid ambiguity with the button/step label
  await expect(page.getByRole("heading", {name: "Create Space", exact: false}).or(page.getByText("Create Space").first())).toBeVisible()

  // Fill the form
  await page.getByLabel("Space Name").fill("New Awesome Space")
  await page.getByLabel("Space Description (Optional)").fill("Description of the new space")

  // Click Create Space button in the form
  await page.getByRole("button", {name: "Create Space"}).click()

  // Should redirect back to /spaces and show success notification
  await expect(page).toHaveURL("/spaces")
  await expect(page.getByText("Space created successfully!")).toBeVisible()
})
