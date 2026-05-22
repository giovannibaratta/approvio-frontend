import React, { useEffect, useState } from "react"
import { handleEither } from "../utils/either"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Loader2, UserCircle, Users, User, Shield } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Link as RouterLink } from "react-router-dom"
import { getGroup, getSpace, getWorkflowTemplate, getEntityInfo } from "../services/api"
import { isRight } from "fp-ts/Either"
import type { RoleOperationItem, GetEntityInfoUserResponse } from "@approvio/api"

const ProfilePage: React.FC = () => {
  const [profile, setProfile] = useState<GetEntityInfoUserResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [resolvedNames, setResolvedNames] = useState<Record<string, string>>({})

  useEffect(() => {
    const fetchProfile = async () => {
      const result = await getEntityInfo()
      handleEither(
        result,
        async data => {
          setProfile(data)
          setLoading(false)

          if (data.roles && data.roles.length > 0) {
            // Pre-populate resolvedNames with groups user belongs to
            const initialNames: Record<string, string> = {}
            if (data.groups) {
              data.groups.forEach(g => {
                initialNames[g.groupId] = g.groupName
              })
            }
            setResolvedNames(initialNames)

            // Resolve name for each role's scope
            const promises = data.roles.map(async role => {
              const scope = role.scope
              if (scope.type === "group" && scope.groupId) {
                const gid = scope.groupId
                if (!initialNames[gid]) {
                  const res = await getGroup(gid)
                  if (isRight(res)) {
                    return { id: gid, name: res.right.name }
                  }
                }
              } else if (scope.type === "space" && scope.spaceId) {
                const sid = scope.spaceId
                const res = await getSpace(sid)
                if (isRight(res)) {
                  return { id: sid, name: res.right.name }
                }
              } else if (scope.type === "workflow_template" && scope.workflowTemplateId) {
                const wtid = scope.workflowTemplateId
                const res = await getWorkflowTemplate(wtid)
                if (isRight(res)) {
                  return { id: wtid, name: res.right.name }
                }
              }
              return null
            })

            const fetched = await Promise.all(promises)
            setResolvedNames(prev => {
              const next = { ...prev }
              fetched.forEach(item => {
                if (item) {
                  next[item.id] = item.name
                }
              })
              return next
            })
          }
        },
        errorObj => {
          setError(errorObj.message)
          setLoading(false)
        }
      )
    }

    fetchProfile()
  }, [])

  const getTargetInfo = (role: RoleOperationItem) => {
    const scope = role.scope
    if (scope.type === "group" && scope.groupId) {
      return {
        name: resolvedNames[scope.groupId] || scope.groupId,
        link: `/groups/${scope.groupId}`
      }
    }
    if (scope.type === "space" && scope.spaceId) {
      return {
        name: resolvedNames[scope.spaceId] || scope.spaceId,
        link: "/spaces"
      }
    }
    if (scope.type === "workflow_template" && scope.workflowTemplateId) {
      return {
        name: resolvedNames[scope.workflowTemplateId] || scope.workflowTemplateId,
        link: `/workflow-templates/${scope.workflowTemplateId}`
      }
    }
    return null
  }

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

        <Card className="col-span-1 border-border/50 bg-background/50 backdrop-blur-sm md:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg font-semibold tracking-tight">
              <Shield className="size-4 text-muted-foreground" />
              Roles
            </CardTitle>
            <CardDescription>Roles assigned to you for specific scopes.</CardDescription>
          </CardHeader>
          <CardContent>
            {profile.roles && profile.roles.length > 0 ? (
              <div className="flex flex-col gap-4">
                {profile.roles.map((role, index) => {
                  const targetInfo = getTargetInfo(role)
                  return (
                    <div key={index} className="flex flex-col gap-2 rounded-lg border p-3 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <div className="font-medium">{role.roleName}</div>
                        {targetInfo && (
                          <div className="mt-0.5 text-xs text-muted-foreground">
                            Target:{" "}
                            {targetInfo.link ? (
                              <RouterLink to={targetInfo.link} className="font-medium text-primary hover:underline">
                                {targetInfo.name}
                              </RouterLink>
                            ) : (
                              <span>{targetInfo.name}</span>
                            )}
                          </div>
                        )}
                      </div>
                      <Badge variant="outline" className="w-fit">
                        Scope: {role.scope.type}
                      </Badge>
                    </div>
                  )
                })}
              </div>
            ) : (
              <p className="text-sm italic text-muted-foreground">You do not have any roles assigned.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default ProfilePage
