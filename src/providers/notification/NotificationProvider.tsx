import { useState } from "react"
import { Snackbar, Alert } from "@mui/material"
import { NotificationContext } from "./NotificationContext"

interface NotificationProviderProps {
  children: React.ReactNode
}

export const NotificationProvider: React.FC<NotificationProviderProps> = ({ children }) => {
  const [open, setOpen] = useState(false)
  const [message, setMessage] = useState("")
  const [severity, setSeverity] = useState<"error" | "success">("error")

  const showError = (message: string) => {
    setMessage(message)
    setSeverity("error")
    setOpen(true)
  }

  const showSuccess = (message: string) => {
    setMessage(message)
    setSeverity("success")
    setOpen(true)
  }

  const handleClose = () => {
    setOpen(false)
  }

  return (
    <NotificationContext.Provider value={{ showError, showSuccess }}>
      {children}
      <Snackbar
        open={open}
        autoHideDuration={6000}
        onClose={handleClose}
        anchorOrigin={{ vertical: "top", horizontal: "right" }}
      >
        <Alert onClose={handleClose} severity={severity} sx={{ width: "100%" }}>
          {message}
        </Alert>
      </Snackbar>
    </NotificationContext.Provider>
  )
}
