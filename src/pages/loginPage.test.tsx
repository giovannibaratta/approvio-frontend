import {test, expect} from "@playwright/experimental-ct-react"
import {LoginPageTestWrapper} from "./loginPage.test.fixtures"
import {type AuthProvider} from "@approvio/api"

test.describe("LoginPage Component Tests", () => {
  const mockProviders: AuthProvider[] = [
    {
      id: "google",
      displayName: "Google",
      loginUrl: "/auth/web/login?provider=google"
    },
    {
      id: "okta",
      displayName: "Okta SSO",
      loginUrl: "/auth/web/login?provider=okta"
    }
  ]

  test("renders login options including Google and Okta providers", async ({mount, page}) => {
    await page.route("**/auth/providers", async route => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(mockProviders)
      })
    })

    const component = await mount(<LoginPageTestWrapper />)

    await expect(component.getByText("Welcome to Approvio")).toBeVisible()
    await expect(component.getByText("Sign in with Google")).toBeVisible()
    await expect(component.getByText("Sign in with Okta SSO")).toBeVisible()
  })

  test("renders error state when provider fetch fails and allows retry", async ({mount, page}) => {
    let callCount = 0

    await page.route("**/auth/providers", async route => {
      callCount++
      if (callCount === 1) {
        await route.fulfill({
          status: 500,
          contentType: "application/json",
          body: JSON.stringify({code: "INTERNAL_ERROR", message: "Provider service unreachable"})
        })
      } else {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify(mockProviders)
        })
      }
    })

    const component = await mount(<LoginPageTestWrapper />)

    await expect(component.getByText("Provider service unreachable")).toBeVisible()
    const retryButton = component.getByRole("button", {name: "Retry"})
    await expect(retryButton).toBeVisible()

    await retryButton.click()

    await expect(component.getByText("Sign in with Google")).toBeVisible()
    await expect(component.getByText("Sign in with Okta SSO")).toBeVisible()
  })

  test("renders empty state when no providers configured", async ({mount, page}) => {
    await page.route("**/auth/providers", async route => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify([])
      })
    })

    const component = await mount(<LoginPageTestWrapper />)

    await expect(
      component.getByText("No identity providers are currently configured. Please contact your administrator.")
    ).toBeVisible()
  })
})
