---
name: sso-testing
description: "Expert guidance on mocking and testing the external SSO authentication flow in Approvio."
risk: safe
source: internal
date_added: "2026-05-04"
---

# SSO Testing Skill

Guidance on how to handle authentication in tests when the system relies on an external SSO mechanism.

## Overview

The Approvio frontend uses an external SSO mechanism. Users click "Login with SSO", are redirected to the backend (`/auth/web/login`), and then redirected back to the frontend (`/auth/callback`).

## E2E Testing Strategy (Playwright)

In E2E tests, we avoid navigating to a real backend to prevent leaving the Vite frontend origin, which would break MSW interception.

1.  **Environment Setup**: Ensure `VITE_AUTH_LOGIN_URL` is set to `/mock/auth/web/login` in `.env.testing`.
2.  **Request Interception**: Use `page.route` to intercept requests to the mock endpoint.
3.  **Client-side Redirect**: Respond with a script that performs a client-side redirect to `/auth/callback` to bypass WebKit redirect limitations.

### Implementation Example

```typescript
import {test, expect} from "@playwright/test"

test("login flow", async ({page}) => {
  // Intercept the mock SSO login URL
  await page.route("**/mock/auth/web/login", async route => {
    // Note: WebKit does not support fulfill() with a 302 status directly.
    // Instead, return an HTML payload that executes a client-side redirect.
    await route.fulfill({
      status: 200,
      contentType: "text/html",
      body: "<script>window.location.href = '/auth/callback';</script>"
    })
  })

  // Start login
  await page.goto("/login")
  await page.getByRole("link", {name: "Login with SSO"}).click()

  // Verify successful authentication
  await expect(page).toHaveURL(/.*\/$/)
})
```

## Local Development Mocks (MSW)

To mock SSO locally without a backend (using `yarn dev:mocks`):

1.  Set `VITE_AUTH_LOGIN_URL=/mock/auth/web/login` in your environment.
2.  The MSW handler will handle the redirect:

```typescript
// src/mocks/handlers.ts
http.get("*/mock/auth/web/login", () => {
  return HttpResponse.redirect("/auth/callback", 302)
})
```
