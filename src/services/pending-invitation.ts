const INVITATION_STORAGE_KEY = "approvio.pending-invitation"
const INVITATION_HANDOFF_TTL_MS = 10 * 60 * 1000

export interface PendingInvitation {
  organizationId: string
  invitationId: string
  token: string
}

export function readPendingInvitation(): PendingInvitation | null {
  const stored = sessionStorage.getItem(INVITATION_STORAGE_KEY)
  if (!stored) return null

  const values = new URLSearchParams(stored)
  const expiresAt = Number(values.get("expiresAt"))
  const organizationId = values.get("organizationId")
  const invitationId = values.get("invitationId")
  const token = values.get("token")
  if (!organizationId || !invitationId || !token || !Number.isFinite(expiresAt) || expiresAt <= Date.now()) {
    clearPendingInvitation()
    return null
  }
  return {organizationId, invitationId, token}
}

export function savePendingInvitation(invitation: PendingInvitation) {
  // The SSO redirect unloads the app. Retain the token in this tab for the return trip.
  const expiresAt = String(Date.now() + INVITATION_HANDOFF_TTL_MS)
  sessionStorage.setItem(INVITATION_STORAGE_KEY, new URLSearchParams({...invitation, expiresAt}).toString())
}

export function clearPendingInvitation() {
  sessionStorage.removeItem(INVITATION_STORAGE_KEY)
}
