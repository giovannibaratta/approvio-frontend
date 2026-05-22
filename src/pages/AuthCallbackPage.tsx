import React, {useEffect, useRef, useState} from "react"
import {useNavigate, Link as RouterLink} from "react-router-dom"
import {useAppDispatch} from "../store/hooks"
import {setAuthenticated} from "../store/authSlice"
import {getEntityInfo} from "../services/api"
import {handleEither} from "../utils/either"
import {useNotification} from "../providers/notification/NotificationContext"
import {Card, CardContent} from "@/components/ui/card"
import {Button} from "@/components/ui/button"
import {Loader2, AlertCircle} from "lucide-react"
import {Alert, AlertDescription} from "@/components/ui/alert"
import {LAYOUT, TYPOGRAPHY} from "@/lib/styles"
import {cn} from "@/lib/utils"

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
        data => {
          dispatch(setAuthenticated({isAuthenticated: true, orgRole: data.orgRole}))
          notification.showSuccess("Login successful!")
          navigate("/", {replace: true})
        },
        error => {
          setError(error.message)
          processingRef.current = false
        }
      )
    }

    verifySession()
  }, [dispatch, navigate, notification])

  return (
    <div className={cn("min-h-[60vh]", LAYOUT.FLEX_CENTER)}>
      <Card className={cn("w-full max-w-sm text-center shadow-sm", LAYOUT.BACKDROP_CARD)}>
        <CardContent className="py-6">
          {!error ? (
            <div className="flex flex-col items-center justify-center space-y-4">
              <Loader2 className="size-12 animate-spin text-emerald-500" />
              <div className="space-y-1">
                <p className="text-lg font-medium">Completing login...</p>
                <p className={TYPOGRAPHY.DESCRIPTION_SM}>Please wait while we verify your credentials.</p>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center space-y-6">
              <div className="space-y-2">
                <h2 className={cn(TYPOGRAPHY.TITLE, "text-destructive")}>Login Failed</h2>
                <Alert variant="destructive" className="mt-4 text-left">
                  <AlertCircle className="size-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              </div>
              <Button asChild className="w-full">
                <RouterLink to="/login">Return to Login</RouterLink>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export default AuthCallbackPage
