import {test, expect} from "@playwright/test"

test("user can logout and then login successfully navigating the mock SSO flow", async ({page}) => {
  const frontendBaseUrl = process.env.VITE_BASE_URL || "http://127.0.0.1:5138"

  // Intercept the backend SSO login URL and redirect the browser back to the frontend callback URL
  await page.route("**/auth/web/login*", async route => {
    // WebKit doesn't support route.fulfill with a 302 status directly, so we use a client-side redirect
    await route.fulfill({
      status: 200,
      contentType: "text/html",
      body: `<script>window.location.href = '${frontendBaseUrl}/auth/callback';</script>`
    })
  })

  // 1. Visit the homepage. MSW mocks the user as logged in by default.
  await page.goto("/")

  // 2. Click the Logout button in the header
  const logoutButton = page.getByRole("button", {name: "Logout"})
  await expect(logoutButton).toBeVisible()
  await logoutButton.click()

  // 3. We should be redirected to the login page
  await expect(page).toHaveURL(/.*\/login/)
  await expect(page.getByText("Welcome to Approvio")).toBeVisible()

  // 4. Verify both providers are rendered and click Google login
  await expect(page.getByRole("link", {name: "Sign in with Okta SSO"})).toBeVisible()
  const googleLoginButton = page.getByRole("link", {name: "Sign in with Google"})
  await expect(googleLoginButton).toBeVisible()
  await googleLoginButton.click()

  // 5. It should go to /auth/callback briefly, which triggers getEntityInfo, then to /
  await expect(page).toHaveURL(/.*\/$/)

  // 6. Verify we are logged in by checking the presence of authenticated UI elements
  await expect(page.getByRole("link", {name: "Profile"})).toBeVisible()
  await expect(page.getByRole("button", {name: "Logout"})).toBeVisible()

  // Capture a screenshot to visually verify the frontend changes as requested
  await page.screenshot({path: "playwright/screenshots/login-success.png", fullPage: true})
})
