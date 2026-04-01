import {test, expect} from "@playwright/experimental-ct-react"
import UsersPage from "./UsersPage"
import {userSummaryResponse} from "@approvio/api/mocks"

test("UsersPage displays list of users", async ({mount, page}) => {
  const response = {
    users: [userSummaryResponse],
    pagination: {page: 1, limit: 10, total: 1}
  }

  // 1. Mock the API directly via Playwrights route interception
  await page.route("**/users?*", async route => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(response)
    })
  })

  // 2. Mount the component
  const component = await mount(<UsersPage />)

  // 3. Assert
  await expect(component.getByText(userSummaryResponse.displayName)).toBeVisible()
  await expect(component.getByText(userSummaryResponse.email)).toBeVisible()
})
