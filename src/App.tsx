import React from "react"
import {BrowserRouter as Router, Routes, Route, Link as RouterLink, Navigate} from "react-router-dom"
import DebugLoginPage from "./pages/DebugPage"
import HomePage from "./pages/HomePage"
import {Box, AppBar, Toolbar, Typography, Container, Link as MuiLink, Button} from "@mui/material"
import {useAppSelector, useAppDispatch} from "./store/hooks"
import {clearToken} from "./store/authSlice"

const App: React.FC = () => {
  const isDevelopment = import.meta.env.VITE_APP_ENV === "development"
  const isAuthenticated = useAppSelector(state => state.auth.isAuthenticated)
  const token = useAppSelector(state => state.auth.token)
  const dispatch = useAppDispatch()

  React.useEffect(() => {
    if (token) {
      console.log("Auth Token from Redux:", token)
    }
  }, [token])

  const handleLogout = () => {
    dispatch(clearToken())
  }

  return (
    <Router>
      <Box sx={{display: "flex", flexDirection: "column", minHeight: "100vh", bgcolor: "background.default"}}>
        <AppBar position="sticky">
          <Container maxWidth="lg">
            <Toolbar sx={{display: "flex", justifyContent: "space-between", alignItems: "center"}}>
              <MuiLink
                component={RouterLink}
                to="/"
                sx={{
                  typography: "h6",
                  fontWeight: "bold",
                  color: "common.white",
                  textDecoration: "none",
                  "&:hover": {color: "primary.light"}
                }}
              >
                Approvio Frontend
              </MuiLink>
              <Box sx={{display: "flex", alignItems: "center"}}>
                {isDevelopment && !isAuthenticated && (
                  <Button component={RouterLink} to="/debug" variant="contained" color="secondary" sx={{ml: 2}}>
                    Debug Login
                  </Button>
                )}
                {isAuthenticated && (
                  <Button
                    variant="outlined"
                    onClick={handleLogout}
                    sx={{
                      ml: 2,
                      color: "common.white",
                      borderColor: "common.white",
                      "&:hover": {borderColor: "primary.light", color: "primary.light"}
                    }}
                  >
                    Logout
                  </Button>
                )}
              </Box>
            </Toolbar>
          </Container>
        </AppBar>

        <Container component="main" maxWidth="lg" sx={{flexGrow: 1, p: 3}}>
          <Routes>
            <Route path="/" element={<HomePage />} />
            {isDevelopment ? (
              <Route path="/debug" element={<DebugLoginPage />} />
            ) : (
              <Route path="/debug" element={<Navigate to="/" replace />} />
            )}
          </Routes>
        </Container>

        <Box
          component="footer"
          sx={{
            bgcolor: "secondary.dark",
            color: "common.white",
            textAlign: "center",
            p: 3,
            mt: "auto"
          }}
        >
          <Typography variant="body2">&copy; {new Date().getFullYear()} Approvio. All rights reserved.</Typography>
        </Box>
      </Box>
    </Router>
  )
}

export default App
