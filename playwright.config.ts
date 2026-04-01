import {defineConfig, devices} from "@playwright/test"
import {fileURLToPath} from "url"
import dotenv from "dotenv"
import path from "path"

// Re-create __dirname
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

dotenv.config({path: path.resolve(__dirname, ".env.testing")})

const webPort = Number(process.env.VITE_PORT)
const baseURL = process.env.VITE_BASE_URL

if (!baseURL) throw new Error("VITE_BASE_URL is not defined in .env.testing")
if (!webPort) throw new Error("VITE_PORT is not defined in .env.testing")

const webServerCommand = "yarn dev"

/**
 * See https://playwright.dev/docs/test-configuration.
 */
export default defineConfig({
  testDir: "./tests/e2e",
  /* Run tests in files in parallel */
  fullyParallel: true,
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,
  /* Retry on CI only */
  retries: process.env.CI ? 2 : 0,
  /* Opt out of parallel tests on CI. */
  workers: process.env.CI ? 1 : undefined,
  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: "html",
  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    /* Base URL to use in actions like `await page.goto('')`. */
    baseURL,

    /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
    trace: "on-first-retry"
  },

  /* Configure projects for major browsers */
  projects: [
    {
      name: "chromium",
      use: {...devices["Desktop Chrome"]}
    },

    {
      name: "firefox",
      use: {...devices["Desktop Firefox"]}
    },

    {
      name: "webkit",
      use: {...devices["Desktop Safari"]}
    }

    /* Test against mobile viewports. */
    // {
    //   name: 'Mobile Chrome',
    //   use: { ...devices['Pixel 5'] },
    // },
    // {
    //   name: 'Mobile Safari',
    //   use: { ...devices['iPhone 12'] },
    // },

    /* Test against branded browsers. */
    // {
    //   name: 'Microsoft Edge',
    //   use: { ...devices['Desktop Edge'], channel: 'msedge' },
    // },
    // {
    //   name: 'Google Chrome',
    //   use: { ...devices['Desktop Chrome'], channel: 'chrome' },
    // },
  ],

  /* Run your local dev server before starting the tests */
  webServer: {
    command: webServerCommand,
    port: webPort,
    reuseExistingServer: !process.env.CI
  }
})
