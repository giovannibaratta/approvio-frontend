import React, { useEffect, useRef, useState } from "react"
import { useNavigate, Link as RouterLink } from "react-router-dom"
import { Box, CircularProgress, Typography, Paper, Button, Alert } from "@mui/material"
import { useAppDispatch } from "../store/hooks"
import { setAuthenticated } from "../store/authSlice"
import { getEntityInfo } from "../services/auth"
import { handleEither } from "../utils/either"
import { useNotification } from "../providers/notification/NotificationContext"

const AuthCallbackPage: React.FC = () => {
  const navigate = useNavigate()
  const dispatch = useAppDispatch()
  const notification = useNotification()
  const [error, setError] = useState<string | null>(null)

  const processingRef = useRef(false)

  useEffect(() => {
    if (processingRef.current) return
    processingRef.current = true

    const verifySession = async () => {
      const result = await getEntityInfo()

      handleEither(
        result,
        () => {
          dispatch(setAuthenticated(true))
          notification.showSuccess("Login successful!")
          navigate("/", { replace: true })
        },
        (errorMessage) => {
          setError(errorMessage)
          processingRef.current = false
        }
      )
    }

    verifySession()
  }, [dispatch, navigate, notification])

  return (
    <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "60vh" }}>
      <Paper elevation={3} sx={{ p: 4, maxWidth: "sm", mx: "auto", textAlign: "center" }}>
        {!error ? (
          <>
            <CircularProgress size={60} sx={{ mb: 3 }} />
            <Typography variant="h6" color="text.primary">
              Completing login...
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              Please wait while we verify your credentials.
            </Typography>
          </>
        ) : (
          <>
            <Typography variant="h5" color="error" sx={{ mb: 2, fontWeight: "bold" }}>
              Login Failed
            </Typography>
            <Alert severity="error" sx={{ mb: 4, textAlign: "left" }}>
              {error}
            </Alert>
            <Button
              component={RouterLink}
              to="/login"
              variant="contained"
              color="primary"
              fullWidth
            >
              Return to Login
            </Button>
          </>
        )}
      </Paper>
    </Box>
  )
}

export default AuthCallbackPage
