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
import CreateWorkflowPage from "./pages/CreateWorkflowPage"
import GroupDetailsPage from "./pages/GroupDetailsPage"
import ProfilePage from "./pages/ProfilePage"
import WorkflowDetailsPage from "./pages/WorkflowDetailsPage"
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
      <div className="flex h-screen items-center justify-center bg-background text-foreground">
        <p className="animate-pulse text-muted-foreground">Initializing...</p>
      </div>
    )
  }

  return (
    <NotificationProvider>
      <Router>
        <div className="flex min-h-screen flex-col bg-background font-sans text-foreground antialiased selection:bg-emerald-500/30">
          <header className="sticky top-0 z-40 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="container mx-auto flex h-14 max-w-7xl items-center justify-between px-4">
              <RouterLink
                to={isAuthenticated ? "/" : "/login"}
                className="flex items-center gap-2 font-semibold tracking-tight transition-colors hover:text-emerald-500"
              >
                <div className="flex size-6 items-center justify-center rounded-md bg-emerald-500">
                  <span className="font-mono text-xs font-bold text-white">A</span>
                </div>
                <span>Approvio</span>
              </RouterLink>

              <nav className="flex items-center gap-6">
                {isAuthenticated && (
                  <>
                    <RouterLink to="/users" className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">
                      Users
                    </RouterLink>
                    <RouterLink to="/groups" className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">
                      Groups
                    </RouterLink>
                    <RouterLink to="/spaces" className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">
                      Spaces
                    </RouterLink>
                    <RouterLink to="/workflow-templates" className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">
                      Templates
                    </RouterLink>
                    <RouterLink to="/workflows" className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">
                      Workflows
                    </RouterLink>
                    <div className="h-4 w-px bg-border/50" />
                  </>
                )}
                {isAuthenticated && (
                  <div className="flex items-center gap-4">
                    <RouterLink to="/me" className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">
                      Profile
                    </RouterLink>
                    <button
                      onClick={handleLogout}
                      className="rounded-md border border-border/50 px-3 py-1.5 text-sm font-medium transition-colors hover:bg-muted/50"
                    >
                      Logout
                    </button>
                  </div>
                )}
              </nav>
            </div>
          </header>

          <main className="container mx-auto max-w-7xl flex-1 p-4 md:p-6 lg:p-8">
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
                <Route path="/workflows/new" element={<CreateWorkflowPage />} />
                <Route path="/workflows/:workflowId" element={<WorkflowDetailsPage />} />
              </Route>
            </Routes>
          </main>

          <footer className="border-t border-border/40 py-6 md:py-0">
            <div className="container mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-4 text-xs text-muted-foreground md:h-16 md:flex-row">
              <p>&copy; {new Date().getFullYear()} Approvio. Building trust through verified workflows.</p>
              <div className="flex gap-4">
                <span className="font-mono text-[10px] opacity-50">v0.1.0-alpha</span>
              </div>
            </div>
          </footer>
        </div>
      </Router>
    </NotificationProvider>
  )
}

export default App
