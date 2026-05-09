import {createContext, useContext} from "react"

export const NotificationContext = createContext<NotificationContextType | undefined>(undefined)

export interface NotificationContextType {
  showError: (message: string) => void
  showSuccess: (message: string) => void
}

export const useNotification = () => {
  const context = useContext(NotificationContext)
  if (!context) {
    throw new Error("useNotification must be used within a NotificationProvider")
  }
  return context
}
