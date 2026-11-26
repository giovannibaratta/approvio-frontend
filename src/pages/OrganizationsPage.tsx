import {useEffect, useState} from "react"
import {isLeft} from "fp-ts/Either"
import type {OrganizationList} from "@approvio/api"
import {Link, useNavigate} from "react-router-dom"
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from "@/components/ui/card"
import {Alert, AlertDescription} from "@/components/ui/alert"
import {Button} from "@/components/ui/button"
import {listOwnOrganizations, logout, switchOrganization} from "@/services/api"
import {useAppSelector} from "@/store/hooks"
import {clearPendingInvitation} from "@/services/pending-invitation"

export default function OrganizationsPage() {
  const navigate = useNavigate()
  const session = useAppSelector(state => state.auth.session)
  const selectedId = session?.data.selectedOrganizationId
  const [organizations, setOrganizations] = useState<OrganizationList | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [switching, setSwitching] = useState(false)
  const [requiresFreshSignIn, setRequiresFreshSignIn] = useState(false)

  useEffect(() => {
    let current = true
    void listOwnOrganizations(page).then(result => {
      if (!current) return
      if (isLeft(result)) {
        if (selectedId && result.left.status === 401) setRequiresFreshSignIn(true)
        else setError(result.left.message)
      } else setOrganizations(result.right)
      setLoading(false)
    })

    return () => {
      current = false
    }
  }, [page, selectedId])

  async function signOutToSwitch() {
    setSwitching(true)
    setError(null)
    const result = await logout()
    if (isLeft(result)) {
      setError(result.left.message)
      setSwitching(false)
      return
    }
    clearPendingInvitation()
    navigate("/login", {replace: true})
  }

  async function select(organizationId: string) {
    if (!session) return
    setSwitching(true)
    setError(null)
    const result = await switchOrganization(organizationId, session.etag)
    if (isLeft(result)) {
      if (result.left.code === "ORGANIZATION_CONTEXT_CHANGED" || result.left.status === 412) {
        window.location.reload()
        return
      }
      setError(result.left.message)
      setSwitching(false)
      return
    }
    window.location.replace("/")
  }

  return (
    <Card className="mx-auto max-w-2xl border-border/50 bg-background/50">
      <CardHeader>
        <CardTitle>Choose an organization</CardTitle>
        <CardDescription>Open the workspace you want to use.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        {loading && (
          <p role="status" className="text-sm text-muted-foreground">
            Loading organizations…
          </p>
        )}
        {!loading && organizations?.items.length === 0 && (
          <p className="text-sm text-muted-foreground">You don’t belong to an organization yet.</p>
        )}
        {!loading && organizations && organizations.items.length > 0 && (
          <ul className="divide-y rounded-md border border-border/50">
            {organizations.items.map(organization => (
              <li key={organization.id} className="flex flex-wrap items-center justify-between gap-3 p-3">
                <div>
                  <p className="font-medium">{organization.displayName}</p>
                  <p className="text-sm text-muted-foreground">
                    {organization.slug} · {organization.status}
                  </p>
                </div>
                {organization.id === selectedId ? (
                  <Button asChild variant="outline">
                    <Link to="/">Continue</Link>
                  </Button>
                ) : (
                  <Button
                    disabled={switching || organization.status !== "active"}
                    onClick={() => void select(organization.id)}
                  >
                    Open <span className="sr-only">{organization.displayName}</span>
                  </Button>
                )}
              </li>
            ))}
          </ul>
        )}
        {organizations && organizations.total > organizations.limit && (
          <div className="flex justify-between">
            <Button
              variant="outline"
              disabled={loading || switching || page <= 1}
              onClick={() => {
                setLoading(true)
                setPage(page - 1)
              }}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              disabled={loading || switching || page * organizations.limit >= organizations.total}
              onClick={() => {
                setLoading(true)
                setPage(page + 1)
              }}
            >
              Next
            </Button>
          </div>
        )}
        {requiresFreshSignIn && (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">Sign in again to load your organization list.</p>
            <Button disabled={switching} onClick={() => void signOutToSwitch()}>
              Sign out to switch
            </Button>
          </div>
        )}
        {!selectedId && (
          <Button asChild>
            <Link to="/organizations/new">Create organization</Link>
          </Button>
        )}
        <Button asChild variant="outline">
          <Link to="/join">Join with an invitation</Link>
        </Button>
        {selectedId && (
          <Button asChild variant="ghost">
            <Link to="/">Back to workspace</Link>
          </Button>
        )}
      </CardContent>
    </Card>
  )
}
