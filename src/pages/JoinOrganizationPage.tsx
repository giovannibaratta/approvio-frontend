import {useEffect, useState, type FormEvent} from "react"
import {isLeft} from "fp-ts/Either"
import {Link, useLocation, useNavigate, useParams} from "react-router-dom"
import {Alert, AlertDescription} from "@/components/ui/alert"
import {Button} from "@/components/ui/button"
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from "@/components/ui/card"
import {Input} from "@/components/ui/input"
import {Label} from "@/components/ui/label"
import {acceptOrganizationInvitation, logout} from "@/services/api"
import {useAppSelector} from "@/store/hooks"
import {useNotification} from "@/providers/notification/NotificationContext"
import {clearPendingInvitation, readPendingInvitation, savePendingInvitation} from "@/services/pending-invitation"

export default function JoinOrganizationPage() {
  const {organizationId: linkedOrganizationId, invitationId: linkedInvitationId} = useParams()
  const {hash, pathname} = useLocation()
  const navigate = useNavigate()
  const notification = useNotification()
  const session = useAppSelector(state => state.auth.session)
  const [savedInvitation] = useState(() => {
    const invitation = readPendingInvitation()
    if (!invitation) return null
    if (linkedOrganizationId && linkedOrganizationId !== invitation.organizationId) return null
    if (linkedInvitationId && linkedInvitationId !== invitation.invitationId) return null
    return invitation
  })
  const [organizationId, setOrganizationId] = useState(linkedOrganizationId ?? savedInvitation?.organizationId ?? "")
  const [invitationId, setInvitationId] = useState(linkedInvitationId ?? savedInvitation?.invitationId ?? "")
  const [token, setToken] = useState(
    () => new URLSearchParams(hash.slice(1)).get("token") ?? savedInvitation?.token ?? ""
  )
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const requiresFreshSignIn = Boolean(session?.data.selectedOrganizationId)

  useEffect(() => {
    if (hash) navigate(pathname, {replace: true})
  }, [hash, pathname, navigate])

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (submitting) return
    const invitation = {organizationId: organizationId.trim(), invitationId: invitationId.trim(), token: token.trim()}
    if (!invitation.organizationId || !invitation.invitationId || !invitation.token) return

    if (!session || requiresFreshSignIn) {
      savePendingInvitation(invitation)
      if (requiresFreshSignIn) {
        setSubmitting(true)
        setError(null)
        const result = await logout()
        if (isLeft(result)) {
          setError(result.left.message)
          setSubmitting(false)
          return
        }
      }
      navigate("/login", {replace: true})
      return
    }

    setSubmitting(true)
    setError(null)
    const result = await acceptOrganizationInvitation(invitation)
    if (isLeft(result)) {
      if (["INVITATION_EXPIRED", "INVITATION_REVOKED", "INVITATION_ALREADY_ACCEPTED"].includes(result.left.code)) {
        clearPendingInvitation()
        setToken("")
      }
      setError(result.left.message)
      setSubmitting(false)
      return
    }

    clearPendingInvitation()
    notification.showSuccess("You joined the organization.")
    navigate("/organizations", {replace: true})
  }

  const action = requiresFreshSignIn ? "Sign out and continue" : session ? "Accept invitation" : "Continue to sign in"

  return (
    <Card className="mx-auto max-w-lg border-border/50 bg-background/50">
      <CardHeader>
        <CardTitle>Join an organization</CardTitle>
        <CardDescription>Use the invitation sent to your account.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={submit} className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          {requiresFreshSignIn && (
            <Alert>
              <AlertDescription>Sign in again to accept this invitation from your account.</AlertDescription>
            </Alert>
          )}
          <div className="space-y-2">
            <Label htmlFor="invite-organization">Organization ID</Label>
            <Input
              id="invite-organization"
              value={organizationId}
              onChange={event => setOrganizationId(event.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="invite-id">Invitation ID</Label>
            <Input
              id="invite-id"
              value={invitationId}
              onChange={event => setInvitationId(event.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="invite-token">Invitation token</Label>
            <Input
              id="invite-token"
              type="password"
              autoComplete="off"
              value={token}
              onChange={event => setToken(event.target.value)}
              required
            />
          </div>
          <div className="flex gap-2">
            <Button type="submit" disabled={submitting}>
              {action}
            </Button>
            <Button asChild variant="ghost">
              <Link to={session ? "/organizations" : "/login"} onClick={clearPendingInvitation}>
                Cancel
              </Link>
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
