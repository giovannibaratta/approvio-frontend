// playwright/index.tsx
import {Provider} from "react-redux"
import {BrowserRouter} from "react-router-dom"
import {clearAuth, setSession} from "../src/store/authSlice"
import {store} from "../src/store/store"
import {NotificationProvider} from "../src/providers/notification/NotificationProvider"
import "../src/index.css"

// This is the magic part for Playwright CT
// It allows you to wrap every 'mount' call with your providers automatically
import {beforeMount} from "@playwright/experimental-ct-react/hooks"

beforeMount<{signedOut?: boolean}>(async ({App, hooksConfig}) => {
  if (hooksConfig?.signedOut) store.dispatch(clearAuth())
  else
    store.dispatch(
      setSession({
        session: {data: {selectedOrganizationId: "01910000-0000-7000-8000-000000000001"}, etag: '"test-session"'},
        orgRole: "admin"
      })
    )
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
