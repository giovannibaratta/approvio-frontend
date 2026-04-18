import { useMemo, useCallback } from "react"
import { Toaster, toast } from "sonner"
import { NotificationContext } from "./NotificationContext"

interface NotificationProviderProps {
  children: React.ReactNode
}

export const NotificationProvider: React.FC<NotificationProviderProps> = ({ children }) => {
  const showError = useCallback((message: string) => {
    toast.error(message)
  }, [])

  const showSuccess = useCallback((message: string) => {
    toast.success(message)
  }, [])

  const value = useMemo(() => ({ showError, showSuccess }), [showError, showSuccess])

  return (
    <NotificationContext.Provider value={value}>
      {children}
      <Toaster position="top-right" richColors />
    </NotificationContext.Provider>
  )
}
