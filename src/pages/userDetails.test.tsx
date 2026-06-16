import {test, expect} from "@playwright/experimental-ct-react"
import {UserDetailsTestWrapper} from "./userDetails.test.fixtures"
import {userWithGroupsAndRolesResponse} from "@approvio/api/mocks"

test.describe("UserDetailsPage & Role Management", () => {
  test("renders user details, cards, and handles role management editing", async ({mount, page}) => {
    const mockUser = userWithGroupsAndRolesResponse

    // 1. Mock API Route for fetching user details
    await page.route("**/users/*", async route => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(mockUser)
      })
    })

    // 2. Mock API Route for resolving scope targets
    await page.route("**/groups/*", async route => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({id: "group-1", name: "Engineering Team"})
      })
    })

    // 3. Mock API Route for listing role templates inside Manage Dialog
    await page.route("**/roles", async route => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          roles: [
            {name: "GroupManager", scope: "group"},
            {name: "SpaceManager", scope: "space"}
          ]
        })
      })
    })

    // 4. Mock API Route for saving updated user roles
    let saveRolesCalled = false
    await page.route("**/users/*/roles", async route => {
      if (route.request().method() === "PUT") {
        saveRolesCalled = true
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({success: true})
        })
      } else {
        await route.fallback()
      }
    })

    // 5. Mount the test wrapper component
    const component = await mount(<UserDetailsTestWrapper />)

    // 6. Assert standard page elements
    await expect(component.getByRole("heading", {name: "User with Groups and Roles"})).toBeVisible()
    await expect(component.getByText("groups-roles@localhost.com")).toBeVisible()

    // Assert Personal Information Card
    await expect(component.getByText("User ID")).toBeVisible()
    await expect(component.getByText("f3c8b4df-6d75-4309-844a-9c7efc8bf141")).toBeVisible()
    await expect(component.getByText("Standard User")).toBeVisible()

    // Assert Group Membership Card
    await expect(component.getByText("Engineering Team")).toBeVisible()

    // Assert Roles Table renders resolved link correctly
    await expect(component.getByRole("table")).toBeVisible()

    // 7. Test Role Management Dialog Opening
    const manageButton = component.getByRole("button", {name: "Manage Roles"})
    await expect(manageButton).toBeVisible()
    await manageButton.click()

    // Dialog Header should be visible
    await expect(page.getByText("Manage Roles for User with Groups and Roles")).toBeVisible()

    // Add a new role assignment
    const addRoleButton = page.getByRole("button", {name: "Add Role Assignment"})
    await expect(addRoleButton).toBeVisible()
    await addRoleButton.click()

    // Select a role from the dropdown
    await page.getByText("Select a role").click()
    await page.getByRole("option", {name: "GroupManager (group)"}).click()

    // Save Changes (this should make the PUT call)
    const saveButton = page.getByRole("button", {name: "Save Changes"})
    await expect(saveButton).toBeVisible()
    await saveButton.click()

    // Assert Save API call was successfully invoked
    await expect.poll(() => saveRolesCalled).toBe(true)
  })
})
