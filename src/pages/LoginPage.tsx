import React, {useCallback, useEffect, useState} from "react"
import {Link as RouterLink} from "react-router-dom"
import {useAppSelector} from "../store/hooks"
import {API_BASE_URL} from "../constants"
import {getAuthProviders} from "../services/api"
import {handleEither} from "../utils/either"
import {type AuthProvider} from "@approvio/api"
import {Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter} from "@/components/ui/card"
import {Button} from "@/components/ui/button"
import {Alert, AlertDescription} from "@/components/ui/alert"
import {Skeleton} from "@/components/ui/skeleton"
import {Shield, AlertCircle, RefreshCw} from "lucide-react"
import {ProviderSignInButton} from "@/components/auth/ProviderSignInButton"

function resolveLoginHref(loginUrl: string): string {
  if (loginUrl.startsWith("http://") || loginUrl.startsWith("https://")) {
    return loginUrl
  }
  return `${API_BASE_URL}${loginUrl}`
}

const LoginPage: React.FC = () => {
  const isAuthenticated = useAppSelector(state => state.auth.isAuthenticated)
  const [providers, setProviders] = useState<AuthProvider[]>([])
  const [isLoading, setIsLoading] = useState(!isAuthenticated)
  const [error, setError] = useState<string | null>(null)

  const fetchProviders = useCallback(async () => {
    if (isAuthenticated) return
    setIsLoading(true)
    setError(null)

    const result = await getAuthProviders()
    handleEither(
      result,
      data => {
        setProviders(data)
        setIsLoading(false)
      },
      err => {
        setError(err.message || "Failed to load authentication providers")
        setIsLoading(false)
      }
    )
  }, [isAuthenticated])

  useEffect(() => {
    fetchProviders()
  }, [fetchProviders])

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
                ? "Select an identity provider to sign in and manage your approval workflows."
                : "You are already logged in! Navigate to explore the application features."}
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            {!isAuthenticated ? (
              isLoading ? (
                <div className="space-y-3 py-2" data-testid="login-providers-loading">
                  <Skeleton className="h-11 w-full rounded-lg" />
                  <Skeleton className="h-11 w-full rounded-lg" />
                </div>
              ) : error ? (
                <div className="space-y-4 py-2">
                  <Alert variant="destructive" className="text-left">
                    <AlertCircle className="size-4" />
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={fetchProviders}
                    className="inline-flex items-center gap-2"
                  >
                    <RefreshCw className="size-3.5" />
                    Retry
                  </Button>
                </div>
              ) : providers.length === 0 ? (
                <div className="py-4 text-sm text-muted-foreground">
                  No identity providers are currently configured. Please contact your administrator.
                </div>
              ) : (
                <div className="flex flex-col gap-3 py-2" data-testid="login-providers-list">
                  {providers.map(provider => (
                    <ProviderSignInButton
                      key={provider.id}
                      providerId={provider.id}
                      displayName={provider.displayName}
                      href={resolveLoginHref(provider.loginUrl)}
                    />
                  ))}
                </div>
              )
            ) : null}
          </CardContent>

          {isAuthenticated && (
            <CardFooter className="flex justify-center pb-8">
              <Button asChild size="lg" className="w-full px-8 sm:w-auto">
                <RouterLink to="/">Go to Home</RouterLink>
              </Button>
            </CardFooter>
          )}
        </Card>
      </div>
    </div>
  )
}

export default LoginPage
