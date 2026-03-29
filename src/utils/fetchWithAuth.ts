import {store} from "../store/store"
import {clearAuth} from "../store/authSlice"

const BASE_URL = import.meta.env.VITE_API_BASE_URL || "/api"

let isRefreshing = false
let refreshSubscribers: ((success: boolean) => void)[] = []

const subscribeTokenRefresh = (cb: (success: boolean) => void) => {
  refreshSubscribers.push(cb)
}

const onRefreshed = (success: boolean) => {
  refreshSubscribers.forEach(cb => cb(success))
  refreshSubscribers = []
}

export async function fetchWithAuth(url: string, options: RequestInit = {}): Promise<Response> {
  const headers = new Headers(options.headers || {})

  if (!headers.has("Content-Type")) headers.set("Content-Type", "application/json")

  // Include credentials for HttpOnly cookies
  const requestOptions: RequestInit = {
    ...options,
    headers,
    credentials: "include"
  }

  const response = await fetch(url, requestOptions)

  if (response.status === 401) {
    const retryOriginalRequest = new Promise<Response>(resolve => {
      subscribeTokenRefresh(async success => {
        if (!success) {
          resolve(response) // Resolve with the original 401 response if refresh failed
          return
        }
        resolve(await fetch(url, requestOptions))
      })
    })

    if (!isRefreshing) {
      isRefreshing = true
      try {
        console.log("Attempting to refresh authentication...")
        const refreshRes = await fetch(`${BASE_URL}/auth/web/refresh`, {
          method: "POST",
          credentials: "include"
        })

        if (!refreshRes.ok) throw new Error("Refresh failed")

        isRefreshing = false
        onRefreshed(true)
      } catch {
        console.error("Authentication refresh failed. Logging out.")
        isRefreshing = false
        store.dispatch(clearAuth())
        onRefreshed(false)
      }
    }

    return retryOriginalRequest
  }

  return response
}
