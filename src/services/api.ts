const BASE_URL = import.meta.env.VITE_API_BASE_URL || "/api"

export interface DebugLoginRequest {
  email: string
}

export interface DebugLoginResponse {
  token: string
}

export async function debugLogin(email: string): Promise<DebugLoginResponse> {
  const payload: DebugLoginRequest = { email }
  try {
    const response = await fetch(`${BASE_URL}/debug/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    })

    if (!response.ok) {
      const errorData = await response
        .json()
        .catch(() => ({ message: "Login request failed with status: " + response.status, token: "" }))
      throw new Error(errorData.message || "Network response was not ok.")
    }
    return (await response.json()) as DebugLoginResponse
  } catch (error) {
    console.error("Error during debug login:", error)
    if (error instanceof Error) {
      throw error
    }
    throw new Error("An unknown error occurred during debug login")
  }
}
