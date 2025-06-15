import {
  type User,
  type Group,
  type Pagination,
  type GroupMembership,
  type AddGroupEntitiesRequest,
  type RemoveGroupEntitiesRequest,
  type GroupCreate,
  type ListUsers200Response,
  type ListGroups200Response,
} from "@approvio/api"
import { type Either, left, right } from "fp-ts/Either"

export interface PaginatedGroupEntitiesResponse {
  entities: GroupMembership[]
  pagination: Pagination
}

export interface DebugLoginRequest {
  email: string
}

export interface DebugLoginResponse {
  token: string
}

const BASE_URL = import.meta.env.VITE_API_BASE_URL || "/api"

interface ListUsersRequest {
  page: number
  limit: number
  search?: string
}

export async function debugLogin(email: string): Promise<Either<string, DebugLoginResponse>> {
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
        .catch(() => ({ message: "Login request failed with status: " + response.status }))
      return left(errorData.message || "Network response was not ok.")
    }

    const result = await response.json() as DebugLoginResponse
    return right(result)
  } catch (error) {
    if (error instanceof Error) {
      return left(error.message)
    }
    return left("An unknown error occurred during login")
  }
}

export async function listUsers(authToken: string, request: ListUsersRequest): Promise<Either<string, ListUsers200Response>> {
  const queryParams = new URLSearchParams({
    page: request.page.toString(),
    limit: request.limit.toString(),
    ...(request.search && { search: request.search })
  })

  try {
    const response = await fetch(`${BASE_URL}/users?${queryParams.toString()}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${authToken}`
      }
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: `Failed to fetch users: ${response.status}` }))
      return left(errorData.message || `Network response was not ok (${response.status}).`)
    }

    const result = await response.json() as ListUsers200Response
    return right(result)
  } catch (error) {
    if (error instanceof Error) {
      return left(error.message)
    }
    return left("An unknown error occurred while fetching users")
  }
}

export async function listGroups(
  page: number,
  limit: number,
  authToken: string | null
): Promise<Either<string, ListGroups200Response>> {
  if (!authToken) {
    return left("Authentication token is required.")
  }

  const queryParams = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString()
  })

  try {
    const response = await fetch(`${BASE_URL}/groups?${queryParams.toString()}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${authToken}`
      }
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: `Failed to fetch groups: ${response.status}` }))
      return left(errorData.message || `Network response was not ok (${response.status}).`)
    }

    const result = await response.json() as ListGroups200Response
    return right(result)
  } catch (error) {
    if (error instanceof Error) {
      return left(error.message)
    }
    return left("An unknown error occurred while fetching groups")
  }
}

export async function createGroup(groupData: GroupCreate, authToken: string | null): Promise<Either<string, string>> {
  if (!authToken) {
    return left("Authentication token is required.")
  }

  try {
    const response = await fetch(`${BASE_URL}/groups`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${authToken}`
      },
      body: JSON.stringify(groupData)
    })

    if (!response.ok) {
      let errorMessage = `Network response was not ok (${response.status}).`
      try {
        const errorData = await response.json()
        errorMessage = errorData.message || errorData.detail || errorMessage
      } catch {
        // Ignore if error response is not JSON or if response body is empty (e.g. for 201)
      }
      return left(errorMessage)
    }

    const locationHeader = response.headers.get("Location")
    if (!locationHeader) {
      return left("Location header is missing")
    }

    const url = new URL(locationHeader)
    const groupId = url.pathname.split("/").pop()

    if (groupId === undefined) {
      return left("Group ID not found in Location header.")
    }

    return right(groupId)
  } catch (error) {
    if (error instanceof Error) {
      return left(error.message)
    }
    return left("An unknown error occurred while creating the group")
  }
}

export async function listGroupEntities(
  groupId: string,
  page: number,
  limit: number,
  authToken: string | null
): Promise<Either<string, PaginatedGroupEntitiesResponse>> {
  if (!authToken) {
    return left("Authentication token is required.")
  }

  const queryParams = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString()
  })

  try {
    const response = await fetch(`${BASE_URL}/groups/${groupId}/entities?${queryParams.toString()}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${authToken}`
      }
    })

    if (!response.ok) {
      const errorData = await response
        .json()
        .catch(() => ({ message: `Failed to fetch group entities: ${response.status}` }))
      return left(errorData.message || `Network response was not ok (${response.status}).`)
    }

    const apiResponse = await response.json() as PaginatedGroupEntitiesResponse
    return right(apiResponse)
  } catch (error) {
    if (error instanceof Error) {
      return left(error.message)
    }
    return left(`An unknown error occurred while fetching entities for group ${groupId}`)
  }
}

export async function addGroupEntities(
  groupId: string,
  payload: AddGroupEntitiesRequest,
  authToken: string | null
): Promise<Either<string, Group>> {
  if (!authToken) {
    return left("Authentication token is required.")
  }

  try {
    const response = await fetch(`${BASE_URL}/groups/${groupId}/entities`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${authToken}`
      },
      body: JSON.stringify(payload)
    })

    if (!response.ok) {
      let errorMessage = `Network response was not ok (${response.status}).`
      try {
        const errorData = await response.json()
        errorMessage = errorData.message || errorData.detail || errorMessage
      } catch {
        // Ignore if error response is not JSON or if response body is empty
      }
      return left(errorMessage)
    }

    const updatedGroup = await response.json() as Group
    return right(updatedGroup)
  } catch (error) {
    if (error instanceof Error) {
      return left(error.message)
    }
    return left(`An unknown error occurred while adding entities to group ${groupId}`)
  }
}

export async function getGroup(groupIdentifier: string, authToken: string | null): Promise<Either<string, Group>> {
  if (!authToken) {
    return left("Authentication token is required.")
  }

  try {
    const response = await fetch(`${BASE_URL}/groups/${groupIdentifier}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${authToken}`
      }
    })

    if (!response.ok) {
      const errorData = await response
        .json()
        .catch(() => ({ message: `Failed to fetch group ${groupIdentifier} details: ${response.status}` }))
      return left(errorData.message || `Network response was not ok (${response.status}).`)
    }

    const result = await response.json() as Group
    return right(result)
  } catch (error) {
    if (error instanceof Error) {
      return left(error.message)
    }
    return left(`An unknown error occurred while fetching group ${groupIdentifier} details`)
  }
}

export async function getUser(userId: string, authToken: string | null): Promise<Either<string, User>> {
  if (!authToken) {
    return left("Authentication token is required.")
  }

  try {
    const response = await fetch(`${BASE_URL}/users/${userId}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${authToken}`
      }
    })

    if (!response.ok) {
      const errorData = await response
        .json()
        .catch(() => ({ message: `Failed to fetch user ${userId} details: ${response.status}` }))
      return left(errorData.message || `Network response was not ok (${response.status}).`)
    }

    const result = await response.json() as User
    return right(result)
  } catch (error) {
    if (error instanceof Error) {
      return left(error.message)
    }
    return left(`An unknown error occurred while fetching user ${userId} details`)
  }
}

export async function removeGroupEntities(
  groupId: string,
  payload: RemoveGroupEntitiesRequest,
  authToken: string | null
): Promise<Either<string, Group>> {
  if (!authToken) {
    return left("Authentication token is required.")
  }

  try {
    const response = await fetch(`${BASE_URL}/groups/${groupId}/entities`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${authToken}`
      },
      body: JSON.stringify(payload)
    })

    if (!response.ok) {
      let errorMessage = `Network response was not ok (${response.status}).`
      try {
        const errorData = await response.json()
        errorMessage = errorData.message || errorData.detail || errorMessage
      } catch {
        // Ignore if error response is not JSON or if response body is empty
      }
      return left(errorMessage)
    }

    const updatedGroup = await response.json() as Group
    return right(updatedGroup)
  } catch (error) {
    if (error instanceof Error) {
      return left(error.message)
    }
    return left(`An unknown error occurred while removing entities from group ${groupId}`)
  }
}
