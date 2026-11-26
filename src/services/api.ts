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
  type RoleRemovalRequest,
  type ListAuditLogsParams,
  type ListMyAuditLogsParams,
  type ListAuditLogs200Response,
  type OrganizationCreate,
  type OrganizationList,
  type WebSessionContext,
  type AuthProvider
} from "@approvio/api"
import {type Either, left, mapLeft, isLeft, isRight} from "fp-ts/Either"
import type {TaskEither} from "fp-ts/TaskEither"
import {
  isApprovioError,
  WebAuthenticator,
  ApprovioUserClient,
  ApprovioPlatformClient,
  OrganizationContextChangedError,
  type ApprovioError,
  type Versioned
} from "@approvio/ts-sdk"
import {API_BASE_URL} from "../constants"
import {store} from "../store/store"
import type {PendingInvitation} from "./pending-invitation"
import {clearAuth, setSession} from "../store/authSlice"

export interface ListWorkflowVotes200Response {
  votes: WorkflowVote[]
}

const authenticator = new WebAuthenticator()
const config = {endpoint: API_BASE_URL}
const platform = new ApprovioPlatformClient(config, authenticator)

class TenantClient extends ApprovioUserClient {
  getVersionedUser(userId: string) {
    return this.getVersioned<User>(this.organizationPath(`/users/${encodeURIComponent(userId)}`))
  }

  getVersionedWorkflowTemplate(identifier: string) {
    return this.getVersioned<WorkflowTemplate>(
      this.organizationPath(`/workflow-templates/${encodeURIComponent(identifier)}`)
    )
  }
}

function tenantClient(organizationId: string) {
  return new TenantClient(config, authenticator, organizationId)
}

export interface FrontendError {
  code: string
  message: string
  status?: number
}

interface ListUsersRequest {
  page: number
  limit: number
  search?: string
}

function mapApiError(error: ApprovioError): FrontendError {
  return {
    code:
      error instanceof OrganizationContextChangedError
        ? "ORGANIZATION_CONTEXT_CHANGED"
        : isApprovioError(error)
          ? error.code || "UNKNOWN_ERROR"
          : "UNKNOWN_ERROR",
    message: error.message,
    status: "status" in error ? error.status : undefined
  }
}

async function tenantRequest<T>(
  request: (client: TenantClient) => TaskEither<ApprovioError, T>
): Promise<Either<FrontendError, T>> {
  const {session} = store.getState().auth
  const organizationId = session?.data.selectedOrganizationId
  if (!organizationId) return left({code: "ORGANIZATION_REQUIRED", message: "Select an organization first."})

  const result = await request(tenantClient(organizationId))()
  if (isLeft(result) && store.getState().auth.session === session) {
    const error = mapApiError(result.left)
    if (error.code === "ORGANIZATION_CONTEXT_CHANGED") window.location.reload()
    else if (error.status === 401) store.dispatch(clearAuth())
  }
  return mapLeft(mapApiError)(result)
}

async function readBrowserSession(): Promise<Either<FrontendError, Versioned<WebSessionContext>>> {
  const result = await platform.getWebSession()()
  if (isLeft(result)) return left(mapApiError(result.left))
  const organizationId = result.right.data.selectedOrganizationId
  const entity = organizationId ? await tenantClient(organizationId).getEntityInfo()() : null
  store.dispatch(setSession({session: result.right, orgRole: entity && isRight(entity) ? entity.right.orgRole : null}))
  return result
}

let browserSessionRequest: ReturnType<typeof readBrowserSession> | undefined

export function loadBrowserSession() {
  browserSessionRequest ??= readBrowserSession().finally(() => {
    browserSessionRequest = undefined
  })
  return browserSessionRequest
}

export async function listOwnOrganizations(page = 1): Promise<Either<FrontendError, OrganizationList>> {
  return mapLeft(mapApiError)(await platform.listOwnOrganizations({page, limit: 25})())
}

export async function createOrganization(input: OrganizationCreate) {
  return mapLeft(mapApiError)(await platform.createOrganization(input)())
}

export async function acceptOrganizationInvitation({organizationId, invitationId, token}: PendingInvitation) {
  return mapLeft(mapApiError)(await tenantClient(organizationId).acceptInvitation(invitationId, {token})())
}

export async function switchOrganization(
  organizationId: string,
  etag: string
): Promise<Either<FrontendError, Versioned<WebSessionContext>>> {
  return mapLeft(mapApiError)(await platform.switchWebOrganization({organizationId}, etag)())
}

export async function getEntityInfo(): Promise<Either<FrontendError, GetEntityInfoUserResponse>> {
  return tenantRequest(client => client.getEntityInfo())
}

export async function logout(): Promise<Either<FrontendError, void>> {
  const result = await platform.logout()()
  // Security guard: Only wipe local auth state on success. Since the access/refresh tokens
  // are stored in HttpOnly cookies, a failed API call (e.g. network/server error) means the
  // browser did not receive the Set-Cookie clear directives. Wiping auth state locally on
  // failure would leave valid cookies intact, leading to silent auto-relogin on next refresh.
  if (isRight(result)) store.dispatch(clearAuth())
  return mapLeft(mapApiError)(result)
}

export async function listUsers(request: ListUsersRequest): Promise<Either<FrontendError, ListUsers200Response>> {
  return tenantRequest(client => client.listUsers(request))
}

export async function listGroups(page: number, limit: number): Promise<Either<FrontendError, ListGroups200Response>> {
  return tenantRequest(client => client.listGroups({page, limit}))
}

export async function createGroup(groupData: GroupCreate): Promise<Either<FrontendError, string>> {
  return tenantRequest(client => client.createGroup(groupData))
}

export async function listGroupEntities(
  groupId: string,
  page: number,
  limit: number
): Promise<Either<FrontendError, ListGroupEntities200Response>> {
  return tenantRequest(client => client.listGroupEntities(groupId, {page, limit}))
}

export async function addGroupEntities(
  groupId: string,
  payload: AddGroupEntitiesRequest
): Promise<Either<FrontendError, Group>> {
  return tenantRequest(client => client.addGroupEntities(groupId, payload))
}

export async function getGroup(groupIdentifier: string): Promise<Either<FrontendError, Group>> {
  return tenantRequest(client => client.getGroup(groupIdentifier))
}

export async function getUser(userId: string): Promise<Either<FrontendError, User>> {
  return tenantRequest(client => client.getUser(userId))
}

export async function assignUserRoles(
  userId: string,
  payload: RoleAssignmentRequest,
  etag: string
): Promise<Either<FrontendError, void>> {
  return tenantRequest(client => client.assignUserRoles(userId, payload, etag))
}

export async function removeUserRoles(
  userId: string,
  payload: RoleRemovalRequest,
  etag: string
): Promise<Either<FrontendError, void>> {
  return tenantRequest(client => client.removeUserRoles(userId, payload, etag))
}

export async function listRoleTemplates(): Promise<Either<FrontendError, ListRoleTemplates200Response>> {
  return tenantRequest(client => client.listRoleTemplates())
}

export async function removeGroupEntities(
  groupId: string,
  payload: RemoveGroupEntitiesRequest
): Promise<Either<FrontendError, Group>> {
  return tenantRequest(client => client.removeGroupEntities(groupId, payload))
}

export async function getSpace(spaceIdentifier: string): Promise<Either<FrontendError, Space>> {
  return tenantRequest(client => client.getSpace(spaceIdentifier))
}

export async function listSpaces(page: number, limit: number): Promise<Either<FrontendError, ListSpaces200Response>> {
  return tenantRequest(client => client.listSpaces({page, limit}))
}

export async function createSpace(spaceData: SpaceCreate): Promise<Either<FrontendError, void>> {
  return tenantRequest(client => client.createSpace(spaceData))
}

export async function listWorkflowTemplates(
  params: ListWorkflowTemplatesParams
): Promise<Either<FrontendError, ListWorkflowTemplates200Response>> {
  return tenantRequest(client => client.listWorkflowTemplates(params))
}

export async function listWorkflows(
  page: number,
  limit: number
): Promise<Either<FrontendError, ListWorkflows200Response>> {
  return tenantRequest(client => client.listWorkflows({page, limit}))
}

export async function getWorkflow(workflowId: string): Promise<Either<FrontendError, Workflow>> {
  return tenantRequest(client => client.getWorkflow(workflowId))
}

export async function listWorkflowVotes(
  workflowId: string
): Promise<Either<FrontendError, ListWorkflowVotes200Response>> {
  return tenantRequest(client => client.listVotes(workflowId))
}

export async function createWorkflow(workflowData: WorkflowCreate): Promise<Either<FrontendError, void>> {
  return tenantRequest(client => client.createWorkflow(workflowData))
}

export async function createWorkflowTemplate(
  templateData: WorkflowTemplateCreate
): Promise<Either<FrontendError, WorkflowTemplate>> {
  return tenantRequest(client => client.createWorkflowTemplate(templateData))
}

export async function getWorkflowTemplate(
  templateIdentifier: string
): Promise<Either<FrontendError, WorkflowTemplate>> {
  return tenantRequest(client => client.getWorkflowTemplate(templateIdentifier))
}

export async function updateWorkflowTemplate(
  templateIdentifier: string,
  updateData: WorkflowTemplateUpdate,
  etag: string
): Promise<Either<FrontendError, WorkflowTemplate>> {
  return tenantRequest(client => client.updateWorkflowTemplate(templateIdentifier, updateData, etag))
}

export async function getAgent(agentId: string): Promise<Either<FrontendError, AgentGet200Response>> {
  return tenantRequest(client => client.getAgent(agentId))
}

export async function canVoteOnWorkflow(workflowId: string): Promise<Either<FrontendError, CanVoteResponse>> {
  return tenantRequest(client => client.canVoteOnWorkflow(workflowId))
}

export async function voteOnWorkflow(
  workflowId: string,
  data: WorkflowVoteRequest
): Promise<Either<FrontendError, void>> {
  return tenantRequest(client => client.voteOnWorkflow(workflowId, data))
}

export async function listAuditLogs(
  params?: ListAuditLogsParams
): Promise<Either<FrontendError, ListAuditLogs200Response>> {
  return tenantRequest(client => client.listAuditLogs(params))
}

export async function listMyAuditLogs(
  params?: ListMyAuditLogsParams
): Promise<Either<FrontendError, ListAuditLogs200Response>> {
  return tenantRequest(client => client.listMyAuditLogs(params))
}

export async function getAuthProviders(): Promise<Either<FrontendError, AuthProvider[]>> {
  return mapLeft(mapApiError)(await platform.getAuthProviders()())
}

export async function getVersionedUser(userId: string) {
  return tenantRequest(client => client.getVersionedUser(userId))
}

export async function getVersionedWorkflowTemplate(identifier: string) {
  return tenantRequest(client => client.getVersionedWorkflowTemplate(identifier))
}
