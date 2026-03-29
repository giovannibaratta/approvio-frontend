import React from "react"
import {Typography, Paper, Box, Button} from "@mui/material"
import {Link as RouterLink} from "react-router-dom"
import {useAppSelector} from "../store/hooks"
import { API_BASE_URL } from "../constants"

const LoginPage: React.FC = () => {
  const isAuthenticated = useAppSelector(state => state.auth.isAuthenticated)

  console.log("LoginPage rendered. Authentication state:", isAuthenticated)

  return (
    <Box sx={{display: "flex", justifyContent: "center", alignItems: "center", minHeight: "60vh"}}>
      <Paper elevation={3} sx={{p: 4, maxWidth: "md", mx: "auto", bgcolor: "background.paper", textAlign: "center"}}>
        <Typography variant="h4" component="h1" sx={{fontWeight: "bold", color: "text.primary", mb: 3}}>
          Welcome to Approvio
        </Typography>

        {!isAuthenticated ? (
          <>
            <Typography variant="body1" color="text.secondary" sx={{mb: 3}}>
              Please log in to access the application and manage your approval workflows.
            </Typography>
            <Button
              href={`${API_BASE_URL}/auth/web/login`}
              variant="contained"
              color="primary"
              size="large"
              sx={{mt: 2}}
            >
              Login with SSO
            </Button>
          </>
        ) : (
          <>
            <Typography variant="body1" color="text.secondary" sx={{mb: 3}}>
              You are already logged in! Navigate to explore the application features.
            </Typography>
            <Button
              component={RouterLink}
              to="/"
              variant="contained"
              color="primary"
              sx={{mt: 2}}
            >
              Go to Home
            </Button>
          </>
        )}
      </Paper>
    </Box>
  )
}

export default LoginPage
