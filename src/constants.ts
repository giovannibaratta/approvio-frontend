export const getEnvVar = (key: keyof ImportMetaEnv): string => {
  const value = import.meta.env[key]
  if (!value) throw new Error(`Environment variable ${key} is missing!`)
  return value
}

export const API_BASE_URL = getEnvVar("VITE_API_BASE_URL")
