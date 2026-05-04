import {test, expect} from "@playwright/test"

test("user can logout and then login successfully navigating the mock SSO flow", async ({page}) => {
  // Intercept the mock SSO login URL and redirect the browser back to the callback URL
  await page.route("**/mock/auth/web/login", async (route) => {
    // WebKit doesn't support route.fulfill with a 302 status, so we use a client-side redirect
    await route.fulfill({
      status: 200,
      contentType: "text/html",
      body: "<script>window.location.href = '/auth/callback';</script>"
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
  await expect(page.getByText("Please log in to access the application")).toBeVisible()

  // 4. Click the login button. It should navigate to the mock SSO endpoint and then redirect to /auth/callback
  const loginButton = page.getByRole("link", {name: "Login with SSO"})
  await expect(loginButton).toBeVisible()
  await loginButton.click()

  // 5. It should go to /auth/callback briefly, which triggers getEntityInfo, then to /
  await expect(page).toHaveURL(/.*\/$/)

  // 6. Verify we are logged in by checking the presence of authenticated UI elements
  await expect(page.getByRole("link", {name: "Profile"})).toBeVisible()
  await expect(page.getByRole("button", {name: "Logout"})).toBeVisible()

  // Capture a screenshot to visually verify the frontend changes as requested
  await page.screenshot({ path: "playwright/screenshots/login-success.png", fullPage: true })
})
