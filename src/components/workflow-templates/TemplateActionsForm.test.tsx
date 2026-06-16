import {test, expect} from "@playwright/experimental-ct-react"
import {TestWrapper} from "./TemplateActionsForm.test.fixtures"

test("TemplateActionsForm deduplicates emails and flags identical actions", async ({mount}) => {
  const component = await mount(<TestWrapper />)

  // Add Email Action
  await component.getByRole("button", {name: "Email Action"}).click()
  await expect(component.getByTestId("actions-count")).toHaveText("1")

  // Add recipient
  const input = component.getByPlaceholder("user@example.com")
  await input.fill("test@example.com")
  await component.getByRole("button", {name: "Add"}).click()
  await expect(component.getByText("test@example.com")).toBeVisible()

  // Try to add same recipient again
  await input.fill("test@example.com")
  await component.getByRole("button", {name: "Add"}).click()
  // Should still only have one instance of the email
  const emails = component.locator("text=test@example.com")
  await expect(emails).toHaveCount(1)

  // Add another Email Action
  await component.getByRole("button", {name: "Email Action"}).click()
  await expect(component.getByTestId("actions-count")).toHaveText("2")

  // Add same recipient to second email action
  const inputs = component.getByPlaceholder("user@example.com")
  await inputs.nth(1).fill("test@example.com")
  await component.getByRole("button", {name: "Add"}).nth(1).click()

  // Now we have two identical Email Actions. It should be INVALID.
  await expect(component.getByTestId("is-valid")).toHaveText("INVALID")
  await expect(component.getByText("Duplicate Action")).toHaveCount(2)

  // Remove one and it should be VALID
  await component.locator("button:has(svg.lucide-trash2)").first().click()

  // Wait a bit for state update
  await expect(component.getByTestId("actions-count")).toHaveText("1")
  await expect(component.getByTestId("is-valid")).toHaveText("VALID")
  await expect(component.getByText("Duplicate Action")).toBeHidden()
})
