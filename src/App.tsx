import React from "react"
import {BrowserRouter as Router, Routes, Route, Link as RouterLink, Navigate, Outlet} from "react-router-dom"
import HomePage from "./pages/HomePage"
import LoginPage from "./pages/LoginPage"
import AuthCallbackPage from "./pages/AuthCallbackPage"
import UsersPage from "./pages/UsersPage"
import GroupsPage from "./pages/GroupsPage"
import CreateGroupPage from "./pages/CreateGroupPage"
import GroupDetailsPage from "./pages/GroupDetailsPage"
import ProfilePage from "./pages/ProfilePage"
import {Box, AppBar, Toolbar, Typography, Container, Link as MuiLink, Button, Divider} from "@mui/material"
import {useAppSelector, useAppDispatch} from "./store/hooks"
import {clearAuth, setAuthenticated} from "./store/authSlice"
import {getEntityInfo} from "./services/auth"
import {isRight} from "fp-ts/Either"
import {NotificationProvider} from "./providers/notification/NotificationProvider"

interface ProtectedRouteProps {
  isAuthenticated: boolean
  redirectPath?: string
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({isAuthenticated, redirectPath = "/login"}) => {
  if (!isAuthenticated) {
    return <Navigate to={redirectPath} replace />
  }
  return <Outlet />
}

const App: React.FC = () => {
  const isAuthenticated = useAppSelector(state => state.auth.isAuthenticated)
  const dispatch = useAppDispatch()

  React.useEffect(() => {
    const checkSession = async () => {
      const result = await getEntityInfo()
      if (isRight(result)) {
        dispatch(setAuthenticated(true))
      } else {
        dispatch(clearAuth())
      }
    }
    checkSession()
  }, [dispatch])

  const handleLogout = () => {
    dispatch(clearAuth())
  }

  return (
    <NotificationProvider>
      <Router>
        <Box sx={{display: "flex", flexDirection: "column", minHeight: "100vh", bgcolor: "background.default"}}>
          <AppBar position="sticky">
            <Container maxWidth="lg">
              <Toolbar sx={{display: "flex", justifyContent: "space-between", alignItems: "center"}}>
                <MuiLink
                  component={RouterLink}
                  to={isAuthenticated ? "/" : "/login"}
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
                  {isAuthenticated && (
                    <>
                      <Button component={RouterLink} to="/users" sx={{color: "common.white", mr: 1}}>
                        Users
                      </Button>
                      <Button component={RouterLink} to="/groups" sx={{color: "common.white", mr: 2}}>
                        Groups
                      </Button>
                      <Divider orientation="vertical" flexItem sx={{bgcolor: "primary.light", mr: 2}} />
                    </>
                  )}
                  {isAuthenticated && (
                    <>
                      <Button component={RouterLink} to="/me" sx={{color: "common.white", mr: 1}}>
                        Profile
                      </Button>
                      <Button
                        variant="outlined"
                        onClick={handleLogout}
                        sx={{
                        ml: 1,
                        color: "common.white",
                        borderColor: "common.white",
                        "&:hover": {borderColor: "primary.light", color: "primary.light"}
                      }}
                    >
                      Logout
                    </Button>
                    </>
                  )}
                </Box>
              </Toolbar>
            </Container>
          </AppBar>

          <Container component="main" maxWidth="lg" sx={{flexGrow: 1, p: 3}}>
            <Routes>
              <Route path="/login" element={<LoginPage />} />
              <Route path="/auth/callback" element={<AuthCallbackPage />} />
              <Route element={<ProtectedRoute isAuthenticated={isAuthenticated} />}>
                <Route path="/" element={<HomePage />} />
                <Route path="/users" element={<UsersPage />} />
                <Route path="/groups" element={<GroupsPage />} />
                <Route path="/groups/create" element={<CreateGroupPage />} />
                <Route path="/groups/:groupIdentifier" element={<GroupDetailsPage />} />
                <Route path="/me" element={<ProfilePage />} />
              </Route>
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
    </NotificationProvider>
  )
}

export default App
