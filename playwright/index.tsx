// playwright/index.tsx
import {Provider} from "react-redux"
import {ThemeProvider, createTheme} from "@mui/material/styles"
import CssBaseline from "@mui/material/CssBaseline"
import {BrowserRouter} from "react-router-dom"
import {store} from "../src/store/store"
import {NotificationProvider} from "../src/providers/notification/NotificationProvider"

// Define your theme once here
const theme = createTheme({
  palette: {
    primary: {main: "#0277bd"},
    secondary: {main: "#546e7a"}
  }
})

// This is the magic part for Playwright CT
// It allows you to wrap every 'mount' call with your providers automatically
import {beforeMount} from "@playwright/experimental-ct-react/hooks"

beforeMount(async ({App}) => {
  return (
    <Provider store={store}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <BrowserRouter>
          <NotificationProvider>
            <App />
          </NotificationProvider>
        </BrowserRouter>
      </ThemeProvider>
    </Provider>
  )
})
