import { useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { useAppSelector } from "../store/hooks"

export const useAuthToken = (): string => {
  const authToken = useAppSelector(state => state.auth.token)
  const navigate = useNavigate()

  useEffect(() => {
    if (!authToken) {
      navigate("/login", { replace: true })
    }
  }, [authToken, navigate])

  // If authToken is null here, it means useEffect hasn't redirected yet,
  // or the component is rendered before the redirect. Throwing an error
  // ensures type safety and indicates a critical application state inconsistency.
  // In a well-configured React Router setup with ProtectedRoutes, this line should ideally not be hit.
  if (!authToken) {
    throw new Error("Authentication token is missing. This hook should only be used within protected routes.")
  }

  return authToken
}
