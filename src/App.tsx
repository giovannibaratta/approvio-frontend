import React from "react"
import {BrowserRouter as Router, Routes, Route, Link as RouterLink, Navigate, Outlet} from "react-router-dom"
import DebugLoginPage from "./pages/DebugPage"
import HomePage from "./pages/HomePage"
import LoginPage from "./pages/LoginPage"
import UsersPage from "./pages/UsersPage"
import GroupsPage from "./pages/GroupsPage"
import SpacesPage from "./pages/SpacesPage"
import WorkflowTemplatesPage from "./pages/WorkflowTemplatesPage"
import WorkflowsPage from "./pages/WorkflowsPage"
import WorkflowVotesPage from "./pages/WorkflowVotesPage"
import CreateGroupPage from "./pages/CreateGroupPage"
import GroupDetailsPage from "./pages/GroupDetailsPage"
import {Box, AppBar, Toolbar, Typography, Container, Link as MuiLink, Button, Divider} from "@mui/material"
import {useAppSelector, useAppDispatch} from "./store/hooks"
import {clearToken} from "./store/authSlice"
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
                      <Button component={RouterLink} to="/groups" sx={{color: "common.white", mr: 1}}>
                        Groups
                      </Button>
                      <Button component={RouterLink} to="/spaces" sx={{color: "common.white", mr: 1}}>
                        Spaces
                      </Button>
                      <Button component={RouterLink} to="/workflow-templates" sx={{color: "common.white", mr: 1}}>
                        Templates
                      </Button>
                      <Button component={RouterLink} to="/workflows" sx={{color: "common.white", mr: 2}}>
                        Workflows
                      </Button>
                      <Divider orientation="vertical" flexItem sx={{bgcolor: "primary.light", mr: 2}} />
                    </>
                  )}
                  {isAuthenticated && (
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
                  )}
                </Box>
              </Toolbar>
            </Container>
          </AppBar>

          <Container component="main" maxWidth="lg" sx={{flexGrow: 1, p: 3}}>
            <Routes>
              <Route path="/login" element={<LoginPage />} />
              <Route path="/debug" element={isDevelopment ? <DebugLoginPage /> : <Navigate to="/login" replace />} />
              <Route element={<ProtectedRoute isAuthenticated={isAuthenticated} />}>
                <Route path="/" element={<HomePage />} />
                <Route path="/users" element={<UsersPage />} />
                <Route path="/groups" element={<GroupsPage />} />
                <Route path="/groups/create" element={<CreateGroupPage />} />
                <Route path="/groups/:groupIdentifier" element={<GroupDetailsPage />} />
                <Route path="/spaces" element={<SpacesPage />} />
                <Route path="/workflow-templates" element={<WorkflowTemplatesPage />} />
                <Route path="/workflows" element={<WorkflowsPage />} />
                <Route path="/workflows/:workflowId/votes" element={<WorkflowVotesPage />} />
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
