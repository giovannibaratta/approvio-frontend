import React, {useEffect, useState} from "react"
import {useParams} from "react-router-dom"
import {Alert, AlertDescription} from "@/components/ui/alert"
import {AlertCircle, ArrowLeft, Loader2, User as UserIcon, Users} from "lucide-react"
import {getUser} from "../services/api"
import {useNotification} from "../providers/notification/NotificationContext"
import {handleEither} from "../utils/either"
import type {User} from "@approvio/api"
import {LAYOUT, TYPOGRAPHY} from "@/lib/styles"
import {Link} from "react-router-dom"
import {type FrontendError} from "../services/api"
import {AssignedRolesTable} from "../components/shared/AssignedRolesTable"
import {Card, CardHeader, CardTitle, CardDescription, CardContent} from "@/components/ui/card"
import {Badge} from "@/components/ui/badge"

const UserDetailsPage: React.FC = () => {
  const {userId} = useParams<{userId: string}>()
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)

  const notification = useNotification()

  useEffect(() => {
    const fetchUser = async () => {
      if (!userId) return

      setLoading(true)
      setError(null)

      const result = await getUser(userId)

      handleEither(
        result,
        (response: User) => {
          setUser(response)
        },
        (error: FrontendError) => {
          setError(error.message)
          notification.showError(error.message)
        }
      )

      setLoading(false)
    }

    fetchUser()
  }, [userId, notification])

  const refetchUser = async () => {
    if (!userId) return
    const result = await getUser(userId)
    handleEither(
      result,
      (response: User) => {
        setUser(response)
      },
      () => {
        /* ignore */
      }
    )
  }

  if (error) {
    return (
      <div className={LAYOUT.SECTION_SPACING}>
        <div className="mb-4">
          <Link to="/users" className="flex items-center text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="mr-2 size-4" />
            Back to Users
          </Link>
        </div>
        <Alert variant="destructive">
          <AlertCircle className="size-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    )
  }

  if (loading || !user) {
    return (
      <div className="flex justify-center p-8">
        <Loader2 className="size-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className={LAYOUT.SECTION_SPACING}>
      <div className="mb-4">
        <Link to="/users" className="flex items-center text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="mr-2 size-4" />
          Back to Users
        </Link>
      </div>

      <div className="mb-8">
        <h1 className={TYPOGRAPHY.TITLE_LG}>{user.displayName}</h1>
        <p className={TYPOGRAPHY.DESCRIPTION_SM}>{user.email}</p>
      </div>

      <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-2">
        <Card className="col-span-1 border-border/50 bg-background/50 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg font-semibold tracking-tight">
              <UserIcon className="size-4 text-muted-foreground" />
              Personal Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="mb-1 text-xs font-medium uppercase tracking-wider text-muted-foreground">User ID</p>
              <p className="font-mono text-sm text-muted-foreground">{user.id}</p>
            </div>
            <div>
              <p className="mb-1 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Organization Role
              </p>
              <p className="text-sm font-medium capitalize">
                {user.orgRole === "admin" ? "Organization Admin" : "Standard User"}
              </p>
            </div>
            <div>
              <p className="mb-1 text-xs font-medium uppercase tracking-wider text-muted-foreground">Created At</p>
              <p className="text-sm text-muted-foreground">{new Date(user.createdAt).toLocaleString()}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="col-span-1 border-border/50 bg-background/50 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg font-semibold tracking-tight">
              <Users className="size-4 text-muted-foreground" />
              Group Memberships
            </CardTitle>
            <CardDescription>Groups define this user&apos;s access policies and approval authority.</CardDescription>
          </CardHeader>
          <CardContent>
            {user.groups && user.groups.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {user.groups.map(group => (
                  <Link key={group.groupId} to={`/groups/${group.groupId}`}>
                    <Badge
                      variant="secondary"
                      className="py-1 font-mono text-xs transition-colors hover:bg-secondary/80"
                    >
                      {group.groupName}
                    </Badge>
                  </Link>
                ))}
              </div>
            ) : (
              <p className="text-sm italic text-muted-foreground">This user is not a member of any groups.</p>
            )}
          </CardContent>
        </Card>
      </div>

      <AssignedRolesTable roles={user.roles} loading={loading} user={user} onRolesChange={refetchUser} />
    </div>
  )
}

export default UserDetailsPage
