import React, { useEffect, useState } from "react"
import { handleEither } from "../utils/either"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Loader2, UserCircle, Users, User, Shield } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Link as RouterLink } from "react-router-dom"
import { getEntityInfo } from "../services/api"
import type { GetEntityInfoUserResponse } from "@approvio/api"
import { AssignedRolesTable } from "../components/shared/AssignedRolesTable"

const ProfilePage: React.FC = () => {
  const [profile, setProfile] = useState<GetEntityInfoUserResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchProfile = async () => {
      const result = await getEntityInfo()
      handleEither(
        result,
        data => {
          setProfile(data)
          setLoading(false)
        },
        errorObj => {
          setError(errorObj.message)
          setLoading(false)
        }
      )
    }

    fetchProfile()
  }, [])

  if (loading) {
    return (
      <div className="mt-12 flex justify-center">
        <Loader2 className="size-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="mx-auto mt-8 max-w-2xl">
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    )
  }

  if (!profile) {
    return null
  }

  return (
    <div className="mx-auto mt-8 max-w-3xl space-y-6">
      <div className="mb-8 flex items-center gap-4">
        <div className="flex size-16 items-center justify-center rounded-xl border border-primary/20 bg-primary/10">
          <UserCircle className="size-8 text-primary" />
        </div>
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">My Profile</h1>
          <p className="mt-1 text-muted-foreground">Manage your identity and permissions.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <Card className="col-span-1 border-border/50 bg-background/50 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg font-semibold tracking-tight">
              <User className="size-4 text-muted-foreground" />
              Personal Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="mb-1 text-xs font-medium uppercase tracking-wider text-muted-foreground">Entity Type</p>
              <Badge variant="outline" className="capitalize">
                {profile.entityType}
              </Badge>
            </div>
            <div>
              <p className="mb-1 text-xs font-medium uppercase tracking-wider text-muted-foreground">ID</p>
              <p className="font-mono text-sm text-muted-foreground">{profile.id}</p>
            </div>
            {profile.entityType === "user" && (
              <div>
                <p className="mb-1 text-xs font-medium uppercase tracking-wider text-muted-foreground">Organization Role</p>
                <p className="font-medium capitalize">
                  {profile.orgRole === "admin" ? "Organization Admin" : "Standard User"}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="col-span-1 border-border/50 bg-background/50 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg font-semibold tracking-tight">
              <Users className="size-4 text-muted-foreground" />
              Group Memberships
            </CardTitle>
            <CardDescription>Groups define your access policies and approval authority.</CardDescription>
          </CardHeader>
          <CardContent>
            {profile.groups.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {profile.groups.map(group => (
                  <RouterLink key={group.groupId} to={`/groups/${group.groupId}`}>
                    <Badge variant="secondary" className="py-1 font-mono text-xs transition-colors hover:bg-secondary/80">
                      {group.groupName}
                    </Badge>
                  </RouterLink>
                ))}
              </div>
            ) : (
              <p className="text-sm italic text-muted-foreground">You are not a member of any groups.</p>
            )}
          </CardContent>
        </Card>

        <div className="col-span-1 md:col-span-2">
          {profile.roles && profile.roles.length > 0 ? (
            <AssignedRolesTable roles={profile.roles} loading={loading} />
          ) : (
            <Card className="border-border/50 bg-background/50 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg font-semibold tracking-tight">
                  <Shield className="size-4 text-muted-foreground" />
                  Roles
                </CardTitle>
                <CardDescription>Roles assigned to you for specific scopes.</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm italic text-muted-foreground">You do not have any roles assigned.</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}

export default ProfilePage
