import {
  type User,
  type Group,
  type AddGroupEntitiesRequest,
  type RemoveGroupEntitiesRequest,
  type GroupCreate,
  type ListUsers200Response,
  type ListGroups200Response,
  type ListGroupEntities200Response
} from "@approvio/api"
import {type Either, mapLeft} from "fp-ts/Either"
import {isApprovioError, WebAuthenticator, ApprovioUserClient, type ApprovioError} from "@approvio/ts-sdk"
import {API_BASE_URL} from "../constants"

const authenticator = new WebAuthenticator()
const client = new ApprovioUserClient({endpoint: API_BASE_URL}, authenticator)

type ErrorMessage = string

interface ListUsersRequest {
  page: number
  limit: number
  search?: string
}

const handleApiError = (error: ApprovioError): ErrorMessage => {
  if (isApprovioError(error)) return error.message
  return error.message
}

export async function listUsers(request: ListUsersRequest): Promise<Either<ErrorMessage, ListUsers200Response>> {
  const result = await client.listUsers(request)()
  return mapLeft(handleApiError)(result)
}

export async function listGroups(page: number, limit: number): Promise<Either<ErrorMessage, ListGroups200Response>> {
  const result = await client.listGroups({page, limit})()
  return mapLeft(handleApiError)(result)
}

export async function createGroup(groupData: GroupCreate): Promise<Either<ErrorMessage, string>> {
  const result = await client.createGroup(groupData)()
  return mapLeft(handleApiError)(result)
}

export async function listGroupEntities(
  groupId: string,
  page: number,
  limit: number
): Promise<Either<ErrorMessage, ListGroupEntities200Response>> {
  const result = await client.listGroupEntities(groupId, {page, limit})()
  return mapLeft(handleApiError)(result)
}

export async function addGroupEntities(
  groupId: string,
  payload: AddGroupEntitiesRequest
): Promise<Either<ErrorMessage, Group>> {
  const result = await client.addGroupEntities(groupId, payload)()
  return mapLeft(handleApiError)(result)
}

export async function getGroup(groupIdentifier: string): Promise<Either<ErrorMessage, Group>> {
  const result = await client.getGroup(groupIdentifier)()
  return mapLeft(handleApiError)(result)
}

export async function getUser(userId: string): Promise<Either<ErrorMessage, User>> {
  const result = await client.getUser(userId)()
  return mapLeft(handleApiError)(result)
}

export async function removeGroupEntities(
  groupId: string,
  payload: RemoveGroupEntitiesRequest
): Promise<Either<string, Group>> {
  const result = await client.removeGroupEntities(groupId, payload)()
  return mapLeft(handleApiError)(result)
}
