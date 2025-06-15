import React, {useState} from "react"
import {debugLogin, type DebugLoginResponse} from "../services/api"
import {Box, TextField, Button, Typography, Paper, Alert, CircularProgress} from "@mui/material"
import {useAppDispatch} from "../store/hooks"
import {setToken as setAuthToken} from "../store/authSlice"
import {handleEither} from "../utils/either"
import { useNotification } from "../providers/notification/NotificationContext"

const DebugLoginPage: React.FC = () => {
  const [email, setEmail] = useState<string>("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [tokenLocal, setTokenLocal] = useState<string | null>(null)
  const dispatch = useAppDispatch()
  const notification = useNotification()

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setIsLoading(true)
    setError(null)
    setTokenLocal(null)

    if (!email.trim()) {
      setError("Email cannot be empty.")
      setIsLoading(false)
      return
    }

    const result = await debugLogin(email)

    handleEither(
      result,
      (loginResponse: DebugLoginResponse) => {
        setTokenLocal(loginResponse.token)
        dispatch(setAuthToken(loginResponse.token))
        notification.showSuccess("Login successful!")
      },
      (errorMessage: string) => {
        setError(errorMessage)
      }
    )

    setIsLoading(false)
  }

  return (
    <Box
      sx={{
        minHeight: "calc(100vh - 64px - 73px)",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        p: {xs: 2, sm: 3}
      }}
    >
      <Paper
        elevation={6}
        sx={{
          p: {xs: 3, md: 4},
          width: "100%",
          maxWidth: "500px",
          borderRadius: "8px",
          backgroundColor: "background.paper",
          color: "text.primary"
        }}
      >
        <Typography
          variant="h5"
          component="h1"
          sx={{fontWeight: "bold", mb: 2, textAlign: "center", color: "primary.dark"}}
        >
          Developer Debug Login
        </Typography>

        <Box component="form" onSubmit={handleSubmit} sx={{mt: 3}}>
          <TextField
            type="email"
            id="email"
            name="email"
            label="Email Address"
            variant="outlined"
            fullWidth
            value={email}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
            placeholder="your.email@example.com"
            disabled={isLoading}
            required
            sx={{
              mb: 3
            }}
            InputLabelProps={{shrink: true}}
          />

          <Button
            type="submit"
            disabled={isLoading}
            variant="contained"
            color="secondary"
            fullWidth
            size="large"
            sx={{
              py: 1.5
            }}
          >
            {isLoading ? <CircularProgress size={24} color="inherit" /> : "Login / Create Debug User"}
          </Button>
        </Box>

        {error && (
          <Alert severity="error" sx={{mt: 3}}>
            {error}
          </Alert>
        )}

        {tokenLocal && (
          <Box sx={{mt: 3, p: 2, backgroundColor: "grey.100", borderRadius: "4px"}}>
            <Typography variant="subtitle1" sx={{color: "text.primary", fontWeight: "medium", mb: 1}}>
              Login Successful!
            </Typography>
            <Box sx={{backgroundColor: "grey.200", p: 1.5, borderRadius: "4px"}}>
              <Typography variant="caption" display="block" sx={{color: "text.secondary", mb: 0.5}}>
                Authentication Token:
              </Typography>
              <Box
                component="pre"
                sx={{
                  color: "text.primary",
                  typography: "caption",
                  overflowX: "auto",
                  p: 1,
                  backgroundColor: "grey.300",
                  borderRadius: "4px",
                  maxHeight: "100px"
                }}
              >
                {tokenLocal}
              </Box>
            </Box>
          </Box>
        )}
      </Paper>
    </Box>
  )
}

export default DebugLoginPage
