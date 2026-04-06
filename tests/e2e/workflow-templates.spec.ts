import {test, expect} from "@playwright/test"

test("can navigate to edit rules page from workflow template details", async ({page}) => {
  // Navigation to details page
  // The app will use internal MSW mocks (src/mocks/handlers.ts)
  await page.goto("/workflow-templates/3fa85f64-5717-4562-b3fc-2c963f66afa6")

  // Verify header on details page
  // The Typography uses variant="h4" but component="h1"
  await expect(page.getByRole("heading", { name: "Test Template" })).toBeVisible({timeout: 10000})

  // Verify Edit button presence (from TemplateDetailsRule)
  const editButton = page.locator('[aria-label="Edit Approval Rule"]')

  await expect(editButton).toBeVisible({timeout: 10000})
  await editButton.click()

  // Verify navigation to Edit page
  await expect(page.getByTestId("edit-rule-header")).toBeVisible({timeout: 10000})
  await expect(page.getByTestId("edit-rule-header")).toContainText("Edit Approval Rule")
})
