import React from "react"
import ReactDOM from "react-dom/client"
import App from "./App.tsx"
import {Provider} from "react-redux"
import {store} from "./store/store"
import {NotificationProvider} from "./providers/notification/NotificationProvider"
import "./index.css"

// Conditionally start MSW in development and test mode
async function enableMocking() {
  if (import.meta.env.VITE_USE_MOCKS !== "true") return

  console.log("Mock Service Worker is enabled. Starting worker...")

  // Import the worker and handlers dynamically to avoid loading them in production
  const {worker} = await import("./mocks/browser")

  return worker.start({
    serviceWorker: {
      url: "/mockServiceWorker.js",
      options: {
        scope: "/",
        // Reuse an existing worker if one is already registered at root
        // to avoid conflicts in parallel testing environments.
        findWorker: (registration: any) => registration.active?.scriptURL.includes("mockServiceWorker.js")
      } as any
    },
    onUnhandledRequest: "bypass"
  })
}

enableMocking().then(() => {
  ReactDOM.createRoot(document.getElementById("root")!).render(
    <React.StrictMode>
      <Provider store={store}>
        <NotificationProvider>
          <App />
        </NotificationProvider>
      </Provider>
    </React.StrictMode>
  )
})
