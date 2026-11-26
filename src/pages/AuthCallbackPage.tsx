import React from "react"
import {Navigate, Link as RouterLink} from "react-router-dom"
import {readPendingInvitation} from "../services/pending-invitation"
import {useAppSelector} from "../store/hooks"
import {Card, CardContent} from "@/components/ui/card"
import {Button} from "@/components/ui/button"
import {AlertCircle} from "lucide-react"
import {Alert, AlertDescription} from "@/components/ui/alert"
import {LAYOUT, TYPOGRAPHY} from "@/lib/styles"
import {cn} from "@/lib/utils"

const AuthCallbackPage: React.FC = () => {
  const session = useAppSelector(state => state.auth.session)
  if (session && readPendingInvitation()) return <Navigate to="/join" replace />
  if (session) return <Navigate to={session.data.selectedOrganizationId ? "/" : "/organizations"} replace />

  return (
    <div className={cn("min-h-[60vh]", LAYOUT.FLEX_CENTER)}>
      <Card className={cn("w-full max-w-sm text-center shadow-sm", LAYOUT.BACKDROP_CARD)}>
        <CardContent className="py-6">
          <div className="flex flex-col items-center justify-center space-y-6">
            <div className="space-y-2">
              <h2 className={cn(TYPOGRAPHY.TITLE, "text-destructive")}>Login Failed</h2>
              <Alert variant="destructive" className="mt-4 text-left">
                <AlertCircle className="size-4" />
                <AlertDescription>
                  Your browser session could not be verified. Sign in again to continue.
                </AlertDescription>
              </Alert>
            </div>
            <Button asChild className="w-full">
              <RouterLink to="/login">Return to Login</RouterLink>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default AuthCallbackPage
