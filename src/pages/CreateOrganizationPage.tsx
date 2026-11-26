import {useState, type FormEvent} from "react"
import {isLeft} from "fp-ts/Either"
import {Link, useNavigate} from "react-router-dom"
import {Alert, AlertDescription} from "@/components/ui/alert"
import {Button} from "@/components/ui/button"
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from "@/components/ui/card"
import {Input} from "@/components/ui/input"
import {Label} from "@/components/ui/label"
import {createOrganization} from "@/services/api"
import {useNotification} from "@/providers/notification/NotificationContext"

export default function CreateOrganizationPage() {
  const navigate = useNavigate()
  const notification = useNotification()
  const [displayName, setDisplayName] = useState("")
  const [slug, setSlug] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (saving) return
    setSaving(true)
    setError(null)
    const result = await createOrganization({displayName: displayName.trim(), slug: slug.trim()})
    if (isLeft(result)) {
      setError(result.left.message)
      setSaving(false)
      return
    }

    notification.showSuccess(`${result.right.organization.displayName} was created.`)
    navigate("/organizations", {replace: true})
  }

  return (
    <Card className="mx-auto max-w-lg border-border/50 bg-background/50">
      <CardHeader>
        <CardTitle>Create an organization</CardTitle>
        <CardDescription>You’ll be the owner and can invite teammates once it’s set up.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={submit} className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          <div className="space-y-2">
            <Label htmlFor="organization-name">Organization name</Label>
            <Input
              id="organization-name"
              value={displayName}
              onChange={event => setDisplayName(event.target.value)}
              maxLength={255}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="organization-slug">Organization slug</Label>
            <Input
              id="organization-slug"
              value={slug}
              onChange={event => setSlug(event.target.value)}
              autoCapitalize="none"
              aria-describedby="slug-help"
              pattern="[a-z0-9][a-z0-9\-]{1,61}[a-z0-9]"
              minLength={3}
              maxLength={63}
              required
            />
            <p id="slug-help" className="text-sm text-muted-foreground">
              Use lowercase letters, numbers, or hyphens.
            </p>
          </div>
          <div className="flex gap-2">
            <Button disabled={saving || !displayName.trim()} type="submit">
              {saving ? "Creating…" : "Create organization"}
            </Button>
            <Button asChild variant="ghost">
              <Link to="/organizations">Cancel</Link>
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
