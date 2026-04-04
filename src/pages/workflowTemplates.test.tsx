import {test, expect} from "@playwright/experimental-ct-react"
import CreateWorkflowTemplatePage from "./CreateWorkflowTemplatePage"

test("CreateWorkflowTemplatePage allows navigation, validation, and cancellation", async ({mount, page}) => {
  await page.route("**/spaces?*", async route => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({data: [{id: "space-1", name: "Test Space"}], pagination: {page: 1, limit: 10, total: 1}})
    })
  })

  let createCalled = false
  await page.route("**/workflow-templates*", async route => {
    if (route.request().method() === "POST") {
      createCalled = true
      await route.fulfill({ status: 200, body: JSON.stringify({id: "new-id"}) })
    } else {
      await route.fallback()
    }
  })

  const component = await mount(
    <CreateWorkflowTemplatePage />
  )
  await expect(component).toBeVisible()

  // Test 1: Cancel Dialog
  await component.getByRole("button", {name: "Cancel"}).click()
  await expect(page.getByText("Discard unsaved changes?")).toBeVisible()
  await page.getByRole("button", {name: "Keep Editing"}).click()
  await expect(page.getByText("Discard unsaved changes?")).toBeHidden()

  // Test 2: Fill out form and navigate
  await component.getByLabel("Template Name").fill("My Template")
  // Select space from autocomplete
  await component.getByLabel("Space").click()
  await page.getByRole("option", {name: "Test Space"}).click()

  await component.getByRole("button", {name: "Next"}).click()

  // Step 2: Approval Rule
  await expect(page.getByText("Approval Rule in JSON")).toBeVisible()
  // Wait for simple code editor to be visible, it renders as a textarea inside a container
  await component.locator("textarea").fill('{ "type": "GROUP_REQUIREMENT", "minCount": 1, "groupId": "123" }')

  await component.getByRole("button", {name: "Next"}).click()

  // Step 3: Review & Create
  await expect(page.getByText("Review Details")).toBeVisible()

  // Test back button
  await component.getByRole("button", {name: "Back"}).click()
  await expect(page.getByText("Approval Rule in JSON")).toBeVisible()
  await component.getByRole("button", {name: "Next"}).click()

  // Submit
  await component.getByRole("button", {name: "Create Template"}).click()
  expect(createCalled).toBe(true)
})
