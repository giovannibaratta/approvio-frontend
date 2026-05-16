/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL: string
  readonly VITE_AUTH_LOGIN_URL?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
/**
 * Extends the global Window interface to include APP_CONFIG.
 * This allows us to access runtime configuration injected by the Docker container
 * (via config.js) without using TypeScript "as any" casting.
 */
interface Window {
  /**
   * Optional runtime configuration object.
   * If present, it contains environment variables injected at container startup.
   */
  APP_CONFIG?: Record<string, string | undefined>
}
