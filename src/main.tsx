import React from "react"
import ReactDOM from "react-dom/client"
import App from "./App.tsx"
import {ThemeProvider, createTheme} from "@mui/material/styles"
import CssBaseline from "@mui/material/CssBaseline"
import {Provider} from "react-redux"
import {store} from "./store/store"

const theme = createTheme({
  palette: {
    primary: {
      main: "#0277bd", // Light Blue 700
      light: "#03a9f4", // Light Blue 500
      dark: "#01579b" // Light Blue 900
    },
    secondary: {
      main: "#546e7a", // Blue Grey 600
      light: "#78909c", // Blue Grey 400
      dark: "#37474f" // Blue Grey 800
    },
    background: {
      default: "#eceff1", // Blue Grey 50
      paper: "#ffffff"
    },
    text: {
      primary: "rgba(0, 0, 0, 0.87)",
      secondary: "rgba(0, 0, 0, 0.6)",
      disabled: "rgba(0, 0, 0, 0.38)"
    },
    error: {
      main: "#d32f2f" // Red 700
    }
  },
  typography: {
    fontFamily: "Roboto, sans-serif"
  }
})

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <Provider store={store}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <App />
      </ThemeProvider>
    </Provider>
  </React.StrictMode>
)
