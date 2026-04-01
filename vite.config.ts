import {defineConfig} from "vite"
import react from "@vitejs/plugin-react"
import fs from "fs"
import path from "path"

// https://vite.dev/config/
export default defineConfig(({mode}) => {
  return {
    plugins: [
      react(),
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
        { find: /^fp-ts\/(.*)\.js$/, replacement: "fp-ts/$1" }
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
      minify: "esbuild"
    },
    esbuild: {
      // Removes console.log and console.debug in production
      drop: mode === "production" ? ["console", "debugger"] : []
    }
  }
})
