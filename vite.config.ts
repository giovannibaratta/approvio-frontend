import {defineConfig, loadEnv} from "vite"
import react from "@vitejs/plugin-react"
import fs from "fs"
import path from "path"

// https://vite.dev/config/
export default defineConfig(({mode}) => {
  const env = loadEnv(mode, process.cwd(), "")
  const appEnv = env.VITE_APP_ENV || mode

  return {
    plugins: [
      react(),
      {
        name: "conditional-csp",
        transformIndexHtml(html) {
          // Conditionally remove CSP for development and testing to allow mocks,
          // local backend connections, and cross-origin API calls.
          // This addresses local testing restrictions while keeping production secure.
          if (appEnv === "testing" || appEnv === "development") {
            return html.replace(/<meta http-equiv="Content-Security-Policy".*?\/>/, "")
          }

          return html
        }
      },
      {
        name: "remove-msw-from-build",
        apply: "build", // Only runs during "npm run build"
        closeBundle() {
          const filePath = path.resolve(__dirname, "dist/mockServiceWorker.js")
          if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath)
            console.log("Successfully removed MSW worker from production build.")
          }
        }
      }
    ],
    resolve: {
      preserveSymlinks: true,
      alias: [
        {find: /^fp-ts\/(.*)\.js$/, replacement: "fp-ts/$1"},
        {find: /^@\//, replacement: `${path.resolve(__dirname, "src")}/`}
      ]
    },
    server: {
      port: Number(process.env.VITE_PORT || "5173"),
      strictPort: true,
      host: true
    },
    optimizeDeps: {
      // Forces Vite to treat the SDK as source code,
      // preserving proper class inheritance and 'this' context.
      exclude: ["@approvio/ts-sdk"]
    },
    build: {
      minify: "esbuild",
      // Explicitly disable source maps in production to prevent original source code
      // exposure in the browser, reducing the attack surface.
      sourcemap: false
    },
    esbuild: {
      // Removes console.log and console.debug in production
      drop: mode === "production" ? ["console", "debugger"] : []
    }
  }
})
