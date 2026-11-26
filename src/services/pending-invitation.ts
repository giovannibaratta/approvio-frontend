const INVITATION_STORAGE_KEY = "approvio.pending-invitation"

export interface PendingInvitation {
  organizationId: string
  invitationId: string
  token: string
}

export function readPendingInvitation(): PendingInvitation | null {
  const values = new URLSearchParams(sessionStorage.getItem(INVITATION_STORAGE_KEY) ?? "")
  const organizationId = values.get("organizationId")
  const invitationId = values.get("invitationId")
  const token = values.get("token")
  return organizationId && invitationId && token ? {organizationId, invitationId, token} : null
}

export function savePendingInvitation(invitation: PendingInvitation) {
  // Keep the token in this tab only while the user completes SSO.
  sessionStorage.setItem(INVITATION_STORAGE_KEY, new URLSearchParams({...invitation}).toString())
}

export function clearPendingInvitation() {
  sessionStorage.removeItem(INVITATION_STORAGE_KEY)
}
