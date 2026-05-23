import {
  type User,
  type Group,
  type AddGroupEntitiesRequest,
  type RemoveGroupEntitiesRequest,
  type GroupCreate,
  type SpaceCreate,
  type ListUsers200Response,
  type ListGroups200Response,
  type WorkflowVote,
  type ListGroupEntities200Response,
  type ListSpaces200Response,
  type ListWorkflowTemplates200Response,
  type ListWorkflowTemplatesParams,
  type ListWorkflows200Response,
  type WorkflowTemplateCreate,
  type WorkflowTemplateUpdate,
  type WorkflowTemplate,
  type Space,
  type WorkflowCreate,
  type Workflow,
  type AgentGet200Response,
  type CanVoteResponse,
  type WorkflowVoteRequest,
  type GetEntityInfoUserResponse,
  type ListRoleTemplates200Response,
  type RoleAssignmentRequest,
  type RoleRemovalRequest
} from "@approvio/api"
import {type Either, mapLeft, isRight} from "fp-ts/Either"
import {isApprovioError, WebAuthenticator, ApprovioUserClient, type ApprovioError} from "@approvio/ts-sdk"
import {API_BASE_URL} from "../constants"
import {store} from "../store/store"
import {clearAuth} from "../store/authSlice"

export interface ListWorkflowVotes200Response {
  votes: WorkflowVote[]
}

const authenticator = new WebAuthenticator()
const client = new ApprovioUserClient({endpoint: API_BASE_URL}, authenticator)

export interface FrontendError {
  code: string
  message: string
}

interface ListUsersRequest {
  page: number
  limit: number
  search?: string
}

export const handleApiError = (error: ApprovioError): FrontendError => {
  if (isApprovioError(error)) {
    if (error.status === 401)
      store.dispatch(clearAuth())
    return {
      code: error.code || "UNKNOWN_ERROR",
      message: error.message
    }
  }
  // Fallback: If the error is not a formal ApprovioError (e.g., a raw response or network error object)
  // but still contains a 401 status, ensure the local authentication state is cleared.
  if (error && typeof error === "object" && "status" in error && error.status === 401)
    store.dispatch(clearAuth())
  return {
    code: "UNKNOWN_ERROR",
    message: error.message
  }
}

export async function getEntityInfo(): Promise<Either<FrontendError, GetEntityInfoUserResponse>> {
  const result = await client.getEntityInfo()()
  return mapLeft(handleApiError)(result)
}

export async function logout(): Promise<Either<FrontendError, void>> {
  const result = await client.logout()()
  // Security guard: Only wipe local auth state on success. Since the access/refresh tokens
  // are stored in HttpOnly cookies, a failed API call (e.g. network/server error) means the
  // browser did not receive the Set-Cookie clear directives. Wiping auth state locally on
  // failure would leave valid cookies intact, leading to silent auto-relogin on next refresh.
  if (isRight(result))
    store.dispatch(clearAuth())
  return mapLeft(handleApiError)(result)
}

export async function listUsers(request: ListUsersRequest): Promise<Either<FrontendError, ListUsers200Response>> {
  const result = await client.listUsers(request)()
  return mapLeft(handleApiError)(result)
}

export async function listGroups(page: number, limit: number): Promise<Either<FrontendError, ListGroups200Response>> {
  const result = await client.listGroups({page, limit})()
  return mapLeft(handleApiError)(result)
}

export async function createGroup(groupData: GroupCreate): Promise<Either<FrontendError, string>> {
  const result = await client.createGroup(groupData)()
  return mapLeft(handleApiError)(result)
}

export async function listGroupEntities(
  groupId: string,
  page: number,
  limit: number
): Promise<Either<FrontendError, ListGroupEntities200Response>> {
  const result = await client.listGroupEntities(groupId, {page, limit})()
  return mapLeft(handleApiError)(result)
}

export async function addGroupEntities(
  groupId: string,
  payload: AddGroupEntitiesRequest
): Promise<Either<FrontendError, Group>> {
  const result = await client.addGroupEntities(groupId, payload)()
  return mapLeft(handleApiError)(result)
}

export async function getGroup(groupIdentifier: string): Promise<Either<FrontendError, Group>> {
  const result = await client.getGroup(groupIdentifier)()
  return mapLeft(handleApiError)(result)
}

export async function getUser(userId: string): Promise<Either<FrontendError, User>> {
  const result = await client.getUser(userId)()
  return mapLeft(handleApiError)(result)
}

export async function assignUserRoles(
  userId: string,
  payload: RoleAssignmentRequest
): Promise<Either<FrontendError, void>> {
  const result = await client.assignUserRoles(userId, payload)()
  return mapLeft(handleApiError)(result)
}

export async function removeUserRoles(
  userId: string,
  payload: RoleRemovalRequest
): Promise<Either<FrontendError, void>> {
  const result = await client.removeUserRoles(userId, payload)()
  return mapLeft(handleApiError)(result)
}

export async function listRoleTemplates(): Promise<Either<FrontendError, ListRoleTemplates200Response>> {
  const result = await client.listRoleTemplates()()
  return mapLeft(handleApiError)(result)
}

export async function removeGroupEntities(
  groupId: string,
  payload: RemoveGroupEntitiesRequest
): Promise<Either<FrontendError, Group>> {
  const result = await client.removeGroupEntities(groupId, payload)()
  return mapLeft(handleApiError)(result)
}

export async function getSpace(spaceIdentifier: string): Promise<Either<FrontendError, Space>> {
  const result = await client.getSpace(spaceIdentifier)()
  return mapLeft(handleApiError)(result)
}

export async function listSpaces(page: number, limit: number): Promise<Either<FrontendError, ListSpaces200Response>> {
  const result = await client.listSpaces({page, limit})()
  return mapLeft(handleApiError)(result)
}

export async function createSpace(spaceData: SpaceCreate): Promise<Either<FrontendError, void>> {
  const result = await client.createSpace(spaceData)()
  return mapLeft(handleApiError)(result)
}

export async function listWorkflowTemplates(
  params: ListWorkflowTemplatesParams
): Promise<Either<FrontendError, ListWorkflowTemplates200Response>> {
  const result = await client.listWorkflowTemplates(params)()
  return mapLeft(handleApiError)(result)
}

export async function listWorkflows(
  page: number,
  limit: number
): Promise<Either<FrontendError, ListWorkflows200Response>> {
  const result = await client.listWorkflows({page, limit})()
  return mapLeft(handleApiError)(result)
}

export async function getWorkflow(workflowId: string): Promise<Either<FrontendError, Workflow>> {
  const result = await client.getWorkflow(workflowId)()
  return mapLeft(handleApiError)(result)
}

export async function listWorkflowVotes(
  workflowId: string
): Promise<Either<FrontendError, ListWorkflowVotes200Response>> {
  const result = await client.listVotes(workflowId)()
  return mapLeft(handleApiError)(result)
}

export async function createWorkflow(workflowData: WorkflowCreate): Promise<Either<FrontendError, void>> {
  const result = await client.createWorkflow(workflowData)()
  return mapLeft(handleApiError)(result)
}

export async function createWorkflowTemplate(
  templateData: WorkflowTemplateCreate
): Promise<Either<FrontendError, WorkflowTemplate>> {
  const result = await client.createWorkflowTemplate(templateData)()
  return mapLeft(handleApiError)(result)
}

export async function getWorkflowTemplate(
  templateIdentifier: string
): Promise<Either<FrontendError, WorkflowTemplate>> {
  const result = await client.getWorkflowTemplate(templateIdentifier)()
  return mapLeft(handleApiError)(result)
}

export async function updateWorkflowTemplate(
  templateIdentifier: string,
  updateData: WorkflowTemplateUpdate
): Promise<Either<FrontendError, WorkflowTemplate>> {
  const result = await client.updateWorkflowTemplate(templateIdentifier, updateData)()
  return mapLeft(handleApiError)(result)
}

export async function getAgent(agentId: string): Promise<Either<FrontendError, AgentGet200Response>> {
  const result = await client.getAgent(agentId)()
  return mapLeft(handleApiError)(result)
}

export async function canVoteOnWorkflow(workflowId: string): Promise<Either<FrontendError, CanVoteResponse>> {
  const result = await client.canVoteOnWorkflow(workflowId)()
  return mapLeft(handleApiError)(result)
}

export async function voteOnWorkflow(
  workflowId: string,
  data: WorkflowVoteRequest
): Promise<Either<FrontendError, void>> {
  const result = await client.voteOnWorkflow(workflowId, data)()
  return mapLeft(handleApiError)(result)
}
