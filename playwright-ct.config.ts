import {defineConfig, devices} from "@playwright/experimental-ct-react"
import {fileURLToPath} from "url"
import dotenv from "dotenv"
import path from "path"

// Re-create __dirname
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

dotenv.config({path: path.resolve(__dirname, ".env.testing")})

/**
 * See https://playwright.dev/docs/test-components
 */
export default defineConfig({
  testDir: "./src", // Component tests usually live next to the components
  testMatch: /.*\.test\.tsx?/, // Ensure this matches your file naming convention
  /* The directory where the item to be tested is located */
  snapshotDir: "./__snapshots__",
  /* Maximum time one test can run for. */
  timeout: 10 * 1000,
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
    /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
    trace: "on-first-retry",

    /* Port to use for the development server that serves components */
    ctPort: 3100,

    /* Vite specific configuration for component testing */
    ctViteConfig: {
      resolve: {
        alias: [
          // 1. Source alias
          {find: "@", replacement: path.resolve(__dirname, "./src")},
          // 2. Map SDK's deep imports to the fp-ts ESM directory (es6)
          // This captures "fp-ts/Anything.js" and "fp-ts/lib/Anything.js" and redirects it correctly
          {
            find: /^fp-ts\/(?:lib|es6)\/(.*)\.js$/,
            replacement: path.join(__dirname, "./node_modules/fp-ts/es6/$1.js")
          },
          {
            find: /^fp-ts\/(.*)\.js$/,
            replacement: path.join(__dirname, "./node_modules/fp-ts/es6/$1.js")
          }
        ]
      },
      // This forces Vite to pre-bundle fp-ts to avoid resolution race conditions
      optimizeDeps: {
        include: ["fp-ts"]
      }
      // If you use global CSS (Tailwind, etc.), you might need to import it here
      // or in the playwright/index.ts file.
    }
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
  ]
})
