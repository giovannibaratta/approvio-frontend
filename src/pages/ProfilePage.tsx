import React, {useEffect, useState} from "react"
import {handleEither} from "../utils/either"
import {Card, CardHeader, CardTitle, CardDescription, CardContent} from "@/components/ui/card"
import {Loader2, UserCircle, Users, User, Shield, Activity} from "lucide-react"
import {Alert, AlertDescription} from "@/components/ui/alert"
import {Badge} from "@/components/ui/badge"
import {getEntityInfo, listMyAuditLogs} from "../services/api"
import type {GetEntityInfoUserResponse, AuditLog} from "@approvio/api"
import {AssignedRolesTable} from "../components/shared/AssignedRolesTable"
import {AuditLogsTable} from "../components/shared/AuditLogsTable"
import {Link as RouterLink} from "react-router-dom"

const ProfilePage: React.FC = () => {
  const [profile, setProfile] = useState<GetEntityInfoUserResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([])
  const [loadingLogs, setLoadingLogs] = useState(true)

  const [cursorHistory, setCursorHistory] = useState<(string | undefined)[]>([undefined])
  const [currentPageIndex, setCurrentPageIndex] = useState(0)
  const [limit, setLimit] = useState(10)
  const [hasMore, setHasMore] = useState(false)
  const [nextCursor, setNextCursor] = useState<string | undefined>(undefined)

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

  useEffect(() => {
    if (!profile?.id) return

    const fetchLogs = async () => {
      setLoadingLogs(true)
      const result = await listMyAuditLogs({
        limit,
        cursor: cursorHistory[currentPageIndex]
      })
      handleEither(
        result,
        data => {
          setAuditLogs(data.auditLogs || [])
          setHasMore(data.pagination?.hasMore || false)
          setNextCursor(data.pagination && "nextCursor" in data.pagination ? data.pagination.nextCursor : undefined)
          setLoadingLogs(false)
        },
        () => {
          setLoadingLogs(false)
        }
      )
    }

    fetchLogs()
  }, [profile?.id, currentPageIndex, cursorHistory, limit])

  const handlePageChange = (newPageIndex: number) => {
    if (newPageIndex > currentPageIndex) {
      const newHistory = [...cursorHistory]
      if (newPageIndex >= newHistory.length) {
        newHistory.push(nextCursor)
        setCursorHistory(newHistory)
      }
    }
    setCurrentPageIndex(newPageIndex)
  }

  const handleRowsPerPageChange = (newLimit: number) => {
    setLimit(newLimit)
    setCursorHistory([undefined])
    setCurrentPageIndex(0)
    setNextCursor(undefined)
    setHasMore(false)
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
                <p className="mb-1 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Organization Role
                </p>
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
                    <Badge
                      variant="secondary"
                      className="py-1 font-mono text-xs transition-colors hover:bg-secondary/80"
                    >
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

        <div className="col-span-1 md:col-span-2">
          {auditLogs.length === 0 && !loadingLogs ? (
            <Card className="border-border/50 bg-background/50 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg font-semibold tracking-tight">
                  <Activity className="size-4 text-muted-foreground" />
                  My Recent Activity
                </CardTitle>
                <CardDescription>A log of your latest actions.</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm italic text-muted-foreground">No activity recorded yet.</p>
              </CardContent>
            </Card>
          ) : (
            <AuditLogsTable
              title="My Recent Activity"
              logs={auditLogs}
              loading={loadingLogs}
              page={currentPageIndex}
              rowsPerPage={limit}
              hasMore={hasMore}
              onPageChange={handlePageChange}
              onRowsPerPageChange={handleRowsPerPageChange}
            />
          )}
        </div>
      </div>
    </div>
  )
}

export default ProfilePage
