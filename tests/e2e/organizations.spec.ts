import {expect, test} from "@playwright/test"

test("creates an organization from an account with no memberships", async ({page}) => {
  // Given
  await page.addInitScript(() => {
    sessionStorage.setItem("mock-organization", "")
    if (sessionStorage.getItem("mock-organizations") === null) sessionStorage.setItem("mock-organizations", "[]")
  })
  await page.goto("/")
  await expect(page.getByText("You don’t belong to an organization yet.")).toBeVisible()

  // When
  await page.getByRole("link", {name: "Create organization"}).click()
  await page.getByLabel("Organization name").fill("Acme Approvals")
  await page.getByLabel("Organization slug").fill("acme-approvals")
  await page.getByRole("button", {name: "Create organization"}).click()

  // Expect
  await expect(page).toHaveURL("/organizations")
  await expect(page.getByRole("button", {name: "Open Acme Approvals"})).toBeVisible()
})

test("keeps the invitation through sign-in and lets the user enter the joined organization", async ({
  page,
  baseURL
}) => {
  // Given
  const organizationId = "01910000-0000-7000-8000-000000000002"
  const invitationId = "01910000-0000-7000-8000-000000000003"
  await page.addInitScript(() => {
    if (sessionStorage.getItem("onboarding-test-started") === null) {
      sessionStorage.setItem("onboarding-test-started", "true")
      sessionStorage.setItem("mock-signed-out", "true")
      sessionStorage.setItem("mock-organizations", "[]")
    }
  })
  await page.route("**/auth/web/login*", route =>
    route.fulfill({
      status: 200,
      contentType: "text/html",
      body: `<script>location.href = "${new URL("/auth/callback", baseURL).href}"</script>`
    })
  )
  await page.goto(`/join/${organizationId}/${invitationId}#token=valid-invite-token`)

  // When
  await expect(page).toHaveURL(`/join/${organizationId}/${invitationId}`)
  await page.getByRole("button", {name: "Continue to sign in"}).click()
  await page.getByRole("link", {name: "Sign in with Google"}).click()
  await expect(page).toHaveURL("/join")
  await page.getByRole("button", {name: "Accept invitation"}).click()

  // Expect
  await expect(page).toHaveURL("/organizations")
  await page.getByRole("button", {name: "Open Invited workspace"}).click()
  await expect(page).toHaveURL("/")
  await expect(page.getByRole("link", {name: "Profile"})).toBeVisible()
})
