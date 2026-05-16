/**
 * Retrieves an environment variable, prioritizing runtime configuration over build-time variables.
 *
 * 1. It first checks `window.APP_CONFIG` (injected at runtime in Docker).
 * 2. It falls back to `import.meta.env` (embedded at build-time by Vite).
 *
 * This allows the same Docker image to be used across different environments by simply
 * providing different environment variables to the container.
 */
export const getEnvVar = (key: keyof ImportMetaEnv): string => {
  // 1. Check for runtime configuration (the "dynamic" way)
  if (typeof window !== "undefined" && window.APP_CONFIG?.[key]) {
    return window.APP_CONFIG[key]!
  }

  // 2. Fallback to build-time environment variables (the "static" Vite way)
  const value = import.meta.env[key]
  if (!value) throw new Error(`Environment variable ${key} is missing!`)
  return value
}

export const API_BASE_URL = getEnvVar("VITE_API_BASE_URL")
export const AUTH_LOGIN_URL =
  (typeof window !== "undefined" && window.APP_CONFIG?.VITE_AUTH_LOGIN_URL) ||
  import.meta.env.VITE_AUTH_LOGIN_URL ||
  `${API_BASE_URL}/auth/web/login`
