import React from "react"
import {Link as RouterLink} from "react-router-dom"
import {useAppSelector} from "../store/hooks"
import { API_BASE_URL } from "../constants"
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Shield } from "lucide-react"

const LoginPage: React.FC = () => {
  const isAuthenticated = useAppSelector(state => state.auth.isAuthenticated)

  console.log("LoginPage rendered. Authentication state:", isAuthenticated)

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center">
      <div className="w-full max-w-md">
        <div className="mb-8 flex justify-center">
          <div className="flex size-16 items-center justify-center rounded-xl border border-emerald-500/20 bg-emerald-500/10">
            <Shield className="size-8 text-emerald-500" />
          </div>
        </div>

        <Card className="border-border/50 bg-background/50 text-center backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-3xl font-semibold tracking-tight">Welcome to Approvio</CardTitle>
            <CardDescription className="mt-2 text-base text-muted-foreground">
              {!isAuthenticated
                ? "Please log in to access the application and manage your approval workflows."
                : "You are already logged in! Navigate to explore the application features."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* Visual spacer */}
            <div className="h-4" />
          </CardContent>
          <CardFooter className="flex justify-center pb-8">
            {!isAuthenticated ? (
              <Button asChild size="lg" className="w-full bg-emerald-600 px-8 text-white hover:bg-emerald-700 sm:w-auto">
                <a href={`${API_BASE_URL}/auth/web/login`}>
                  Login with SSO
                </a>
              </Button>
            ) : (
              <Button asChild size="lg" className="w-full px-8 sm:w-auto">
                <RouterLink to="/">
                  Go to Home
                </RouterLink>
              </Button>
            )}
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}

export default LoginPage
