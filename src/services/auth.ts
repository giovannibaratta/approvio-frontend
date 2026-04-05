import {type Either, left, right} from "fp-ts/Either"
import {fetchWithAuth} from "../utils/fetchWithAuth"
import { type FrontendError } from "./api"

const BASE_URL = import.meta.env.VITE_API_BASE_URL || "/api"

export interface EntityInfo {
  entityType: string
  groups: {groupId: string; groupName: string}[]
  email?: string
  name?: string
  id?: string
}


export async function getEntityInfo(): Promise<Either<FrontendError, EntityInfo>> {
  try {
    const response = await fetchWithAuth(`${BASE_URL}/auth/info`, {
      method: "GET"
    })

    if (!response.ok) {
      const errorData = await response
        .json()
        .catch(() => ({message: `Failed to fetch entity info: ${response.status}`, code: "UNKNOWN_ERROR"}))
      return left({
        message: errorData.message || `Network response was not ok (${response.status}).`,
        code: errorData.code || "UNKNOWN_ERROR"
      })
    }

    const result = (await response.json()) as EntityInfo
    return right(result)
  } catch (error) {
    if (error instanceof Error) {
      return left({ message: error.message, code: "UNKNOWN_ERROR" })
    }
    return left({ message: "An unknown error occurred while fetching entity info", code: "UNKNOWN_ERROR" })
  }
}
