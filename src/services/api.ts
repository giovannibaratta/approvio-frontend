import {
  type User,
  type Group,
  type Pagination,
  type GroupMembership,
  type AddGroupEntitiesRequest,
  type RemoveGroupEntitiesRequest,
  type GroupCreate,
  type ListUsers200Response,
  type ListGroups200Response
} from "@approvio/api"
import {type Either, left, right} from "fp-ts/Either"
import {fetchWithAuth} from "../utils/fetchWithAuth"

export interface PaginatedGroupEntitiesResponse {
  entities: GroupMembership[]
  pagination: Pagination
}

const BASE_URL = import.meta.env.VITE_API_BASE_URL || "/api"

interface ListUsersRequest {
  page: number
  limit: number
  search?: string
}

export async function listUsers(request: ListUsersRequest): Promise<Either<string, ListUsers200Response>> {
  const queryParams = new URLSearchParams({
    page: request.page.toString(),
    limit: request.limit.toString(),
    ...(request.search && {search: request.search})
  })

  try {
    const response = await fetchWithAuth(`${BASE_URL}/users?${queryParams.toString()}`, {
      method: "GET"
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({message: `Failed to fetch users: ${response.status}`}))
      return left(errorData.message || `Network response was not ok (${response.status}).`)
    }

    const result = (await response.json()) as ListUsers200Response
    return right(result)
  } catch (error) {
    if (error instanceof Error) {
      return left(error.message)
    }
    return left("An unknown error occurred while fetching users")
  }
}

export async function listGroups(page: number, limit: number): Promise<Either<string, ListGroups200Response>> {
  const queryParams = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString()
  })

  try {
    const response = await fetchWithAuth(`${BASE_URL}/groups?${queryParams.toString()}`, {
      method: "GET"
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({message: `Failed to fetch groups: ${response.status}`}))
      return left(errorData.message || `Network response was not ok (${response.status}).`)
    }

    const result = (await response.json()) as ListGroups200Response
    return right(result)
  } catch (error) {
    if (error instanceof Error) {
      return left(error.message)
    }
    return left("An unknown error occurred while fetching groups")
  }
}

export async function createGroup(groupData: GroupCreate): Promise<Either<string, string>> {
  try {
    const response = await fetchWithAuth(`${BASE_URL}/groups`, {
      method: "POST",
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
  limit: number
): Promise<Either<string, PaginatedGroupEntitiesResponse>> {
  const queryParams = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString()
  })

  try {
    const response = await fetchWithAuth(`${BASE_URL}/groups/${groupId}/entities?${queryParams.toString()}`, {
      method: "GET"
    })

    if (!response.ok) {
      const errorData = await response
        .json()
        .catch(() => ({message: `Failed to fetch group entities: ${response.status}`}))
      return left(errorData.message || `Network response was not ok (${response.status}).`)
    }

    const apiResponse = (await response.json()) as PaginatedGroupEntitiesResponse
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
  payload: AddGroupEntitiesRequest
): Promise<Either<string, Group>> {
  try {
    const response = await fetchWithAuth(`${BASE_URL}/groups/${groupId}/entities`, {
      method: "POST",
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

    const updatedGroup = (await response.json()) as Group
    return right(updatedGroup)
  } catch (error) {
    if (error instanceof Error) {
      return left(error.message)
    }
    return left(`An unknown error occurred while adding entities to group ${groupId}`)
  }
}

export async function getGroup(groupIdentifier: string): Promise<Either<string, Group>> {
  try {
    const response = await fetchWithAuth(`${BASE_URL}/groups/${groupIdentifier}`, {
      method: "GET"
    })

    if (!response.ok) {
      const errorData = await response
        .json()
        .catch(() => ({message: `Failed to fetch group ${groupIdentifier} details: ${response.status}`}))
      return left(errorData.message || `Network response was not ok (${response.status}).`)
    }

    const result = (await response.json()) as Group
    return right(result)
  } catch (error) {
    if (error instanceof Error) {
      return left(error.message)
    }
    return left(`An unknown error occurred while fetching group ${groupIdentifier} details`)
  }
}

export async function getUser(userId: string): Promise<Either<string, User>> {
  try {
    const response = await fetchWithAuth(`${BASE_URL}/users/${userId}`, {
      method: "GET"
    })

    if (!response.ok) {
      const errorData = await response
        .json()
        .catch(() => ({message: `Failed to fetch user ${userId} details: ${response.status}`}))
      return left(errorData.message || `Network response was not ok (${response.status}).`)
    }

    const result = (await response.json()) as User
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
  payload: RemoveGroupEntitiesRequest
): Promise<Either<string, Group>> {
  try {
    const response = await fetchWithAuth(`${BASE_URL}/groups/${groupId}/entities`, {
      method: "DELETE",
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

    const updatedGroup = (await response.json()) as Group
    return right(updatedGroup)
  } catch (error) {
    if (error instanceof Error) {
      return left(error.message)
    }
    return left(`An unknown error occurred while removing entities from group ${groupId}`)
  }
}
