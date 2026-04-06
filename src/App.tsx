import React from "react"
import {BrowserRouter as Router, Routes, Route, Link as RouterLink, Navigate, Outlet} from "react-router-dom"
import HomePage from "./pages/HomePage"
import LoginPage from "./pages/LoginPage"
import AuthCallbackPage from "./pages/AuthCallbackPage"
import UsersPage from "./pages/UsersPage"
import GroupsPage from "./pages/GroupsPage"
import SpacesPage from "./pages/SpacesPage"
import WorkflowTemplatesPage from "./pages/WorkflowTemplatesPage"
import WorkflowsPage from "./pages/WorkflowsPage"
import CreateGroupPage from "./pages/CreateGroupPage"
import CreateSpacePage from "./pages/CreateSpacePage"
import CompareWorkflowTemplatePage from "./pages/CompareWorkflowTemplatePage"
import CreateWorkflowTemplatePage from "./pages/CreateWorkflowTemplatePage"
import WorkflowTemplateDetailsPage from "./pages/WorkflowTemplateDetailsPage"
import WorkflowTemplateEditRulePage from "./pages/WorkflowTemplateEditRulePage"
import GroupDetailsPage from "./pages/GroupDetailsPage"
import ProfilePage from "./pages/ProfilePage"
import {Box, AppBar, Toolbar, Typography, Container, Link as MuiLink, Button, Divider} from "@mui/material"
import {useAppSelector, useAppDispatch} from "./store/hooks"
import {clearAuth, setAuthenticated, setInitialized} from "./store/authSlice"
import {getEntityInfo} from "./services/auth"
import {isRight} from "fp-ts/Either"
import {NotificationProvider} from "./providers/notification/NotificationProvider"

interface ProtectedRouteProps {
  isAuthenticated: boolean
  redirectPath?: string
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({isAuthenticated, redirectPath = "/login"}) => {
  if (!isAuthenticated) return <Navigate to={redirectPath} replace />
  return <Outlet />
}

const App: React.FC = () => {
  const isInitialized = useAppSelector(state => state.auth.isInitialized)
  const isAuthenticated = useAppSelector(state => state.auth.isAuthenticated)
  const dispatch = useAppDispatch()

  React.useEffect(() => {
    const checkSession = async () => {
      const result = await getEntityInfo()
      if (isRight(result)) dispatch(setAuthenticated(true))
      else dispatch(clearAuth())
      dispatch(setInitialized(true))
    }
    checkSession()
  }, [dispatch])

  const handleLogout = () => {
    dispatch(clearAuth())
  }

  if (!isInitialized) {
    return (
      <Box sx={{display: "flex", justifyContent: "center", alignItems: "center", height: "100vh"}}>
        <Typography variant="h6" color="textSecondary">
          Loading...
        </Typography>
      </Box>
    )
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
                <Route path="/groups/new" element={<CreateGroupPage />} />
                <Route path="/groups/:groupIdentifier" element={<GroupDetailsPage />} />
                <Route path="/me" element={<ProfilePage />} />
                <Route path="/spaces" element={<SpacesPage />} />
                <Route path="/spaces/new" element={<CreateSpacePage />} />
                <Route path="/workflow-templates" element={<WorkflowTemplatesPage />} />
                <Route path="/workflow-templates/new" element={<CreateWorkflowTemplatePage />} />
                <Route path="/workflow-templates/:templateIdentifier/edit-approval-rule" element={<WorkflowTemplateEditRulePage />} />
                <Route path="/workflow-templates/:templateIdentifier/compare" element={<CompareWorkflowTemplatePage />} />
                <Route path="/workflow-templates/:templateIdentifier" element={<WorkflowTemplateDetailsPage />} />
                <Route path="/workflows" element={<WorkflowsPage />} />
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
