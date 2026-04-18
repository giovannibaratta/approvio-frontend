// playwright/index.tsx
import {Provider} from "react-redux"
import {BrowserRouter} from "react-router-dom"
import {store} from "../src/store/store"
import {NotificationProvider} from "../src/providers/notification/NotificationProvider"
import "../src/index.css"

// This is the magic part for Playwright CT
// It allows you to wrap every 'mount' call with your providers automatically
import {beforeMount} from "@playwright/experimental-ct-react/hooks"

beforeMount(async ({App}) => {
  return (
    <Provider store={store}>
      <BrowserRouter>
        <NotificationProvider>
          <App />
        </NotificationProvider>
      </BrowserRouter>
    </Provider>
  )
})
