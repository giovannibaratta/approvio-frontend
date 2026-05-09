import {type FrontendError} from "../services/api"
import React, {useCallback, useEffect, useState} from "react"
import {useParams} from "react-router-dom"
import {getGroup, listGroupEntities, getUser} from "../services/api"
import {handleEither} from "../utils/either"
import ManageMembershipDialog from "../components/groups/ManageMembershipDialog"
import {isRight} from "fp-ts/Either"
import {useNotification} from "../providers/notification/NotificationContext"

import type {Group, ListGroupEntities200Response, Pagination} from "@approvio/api"
import type {User} from "@approvio/api"
import type {GroupMembership} from "@approvio/api"

import {Card, CardHeader, CardTitle, CardDescription, CardContent} from "@/components/ui/card"
import {Users, Loader2, Calendar, Edit3, Settings} from "lucide-react"
import {Alert, AlertDescription} from "@/components/ui/alert"
import {Skeleton} from "@/components/ui/skeleton"
import {Table, TableBody, TableCell, TableHead, TableHeader, TableRow} from "@/components/ui/table"
import {Button} from "@/components/ui/button"
import {cn} from "@/lib/utils"
import {LAYOUT, TYPOGRAPHY} from "@/lib/styles"
import {PaginationUI} from "../components/common/PaginationUI"

interface MemberDetails extends GroupMembership {
  userDetails?: User
  loadingUserDetails: boolean
}

const GroupDetailsPage: React.FC = () => {
  const {groupIdentifier} = useParams<{groupIdentifier: string}>()
  const [group, setGroup] = useState<Group | null>(null)
  const [members, setMembers] = useState<MemberDetails[]>([])
  const [pagination, setPagination] = useState<Pagination | null>(null)
  const [loadingGroup, setLoadingGroup] = useState<boolean>(true)
  const [loadingMembers, setLoadingMembers] = useState<boolean>(true)
  const [errorGroup, setErrorGroup] = useState<string | null>(null)
  const [errorMembers, setErrorMembers] = useState<string | null>(null)
  const [page, setPage] = useState<number>(0) // MUI TablePagination is 0-indexed
  const [rowsPerPage, setRowsPerPage] = useState<number>(10)
  const [manageMembershipDialogOpen, setManageMembershipDialogOpen] = useState<boolean>(false)

  const notification = useNotification()

  useEffect(() => {
    const fetchGroupDetails = async () => {
      if (!groupIdentifier) {
        setLoadingGroup(false)
        return
      }
      setLoadingGroup(true)
      setErrorGroup(null)

      const result = await getGroup(groupIdentifier)

      handleEither(
        result,
        (groupData: Group) => {
          setGroup(groupData)
        },
        (error: FrontendError) => {
          setErrorGroup(error.message)
          notification.showError(error.message)
        }
      )

      setLoadingGroup(false)
    }

    fetchGroupDetails()
  }, [groupIdentifier, notification])

  const fetchGroupMembers = useCallback(async () => {
    if (!groupIdentifier) {
      setLoadingMembers(false)
      setMembers([])
      setPagination(null)
      return
    }
    setLoadingMembers(true)
    setErrorMembers(null)
    setMembers([])
    setPagination(null)

    const result = await listGroupEntities(groupIdentifier, page + 1, rowsPerPage)

    handleEither(
      result,
      async (response: ListGroupEntities200Response) => {
        const membersWithLoadingState: MemberDetails[] = response.entities.map(member => ({
          ...member,
          userDetails: undefined,
          loadingUserDetails: member.entity.entityType === "human"
        }))

        setMembers(membersWithLoadingState)
        setPagination(response.pagination)

        const humanMembers = membersWithLoadingState.filter(member => member.entity.entityType === "human")
        if (humanMembers.length > 0) {
          const userDetailsPromises = humanMembers.map(async member => {
            const userResult = await getUser(member.entity.entityId)
            return isRight(userResult) ? userResult.right : null
          })

          const fetchedUserDetails = await Promise.all(userDetailsPromises)

          setMembers(currentMembers =>
            currentMembers.map(member => {
              const userDetail = fetchedUserDetails.find(details => details?.id === member.entity.entityId)
              return {
                ...member,
                userDetails: userDetail || undefined,
                loadingUserDetails: false
              }
            })
          )
        }
      },
      (error: FrontendError) => {
        setErrorMembers(error.message)
        notification.showError(error.message)
        setMembers([])
        setPagination(null)
      }
    )

    setLoadingMembers(false)
  }, [groupIdentifier, page, rowsPerPage, notification])

  useEffect(() => {
    fetchGroupMembers()
  }, [groupIdentifier, page, rowsPerPage, fetchGroupMembers])

  const handleChangeRowsPerPage = (newRowsPerPage: number) => {
    setRowsPerPage(newRowsPerPage)
    setPage(0) // Reset to first page
  }

  const handleMembersUpdated = () => {
    fetchGroupMembers()

    if (groupIdentifier) {
      getGroup(groupIdentifier).then(result => {
        handleEither(
          result,
          (groupData: Group) => setGroup(groupData),
          (error: FrontendError) => notification.showError(`Error refreshing group details: ${error.message}`)
        )
      })
    }
  }

  if (loadingGroup) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <Loader2 className="size-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (errorGroup) {
    return (
      <Alert variant="destructive" className="m-4">
        <AlertDescription>{errorGroup}</AlertDescription>
      </Alert>
    )
  }

  if (!group) {
    return (
      <Alert className="m-4 border-amber-500/50 bg-amber-500/10">
        <AlertDescription className="text-amber-600">Group not found.</AlertDescription>
      </Alert>
    )
  }

  return (
    <div className={cn(LAYOUT.PAGE_WIDTH, LAYOUT.SECTION_SPACING)}>
      {/* Top Section: Group Details */}
      <Card className={LAYOUT.BACKDROP_CARD}>
        <CardHeader className="flex flex-row items-center gap-4 pb-6">
          <div className="flex size-12 items-center justify-center rounded-xl border border-blue-500/20 bg-blue-500/10">
            <Users className="size-6 text-blue-500" />
          </div>
          <div>
            <CardTitle className={TYPOGRAPHY.TITLE_LG}>{group.name}</CardTitle>
            <CardDescription className={cn("mt-1", TYPOGRAPHY.DESCRIPTION_BASE)}>
              {group.description || "No description available"}
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="rounded-md border border-border/40 bg-muted/30 p-4">
              <div className="mb-2 flex items-center gap-2">
                <Users className="size-4 text-muted-foreground" />
                <p className={TYPOGRAPHY.LABEL_MUTED}>Entities</p>
              </div>
              <p className={TYPOGRAPHY.TITLE_LG}>{group.entitiesCount}</p>
            </div>

            <div className="rounded-md border border-border/40 bg-muted/30 p-4">
              <div className="mb-2 flex items-center gap-2">
                <Calendar className="size-4 text-muted-foreground" />
                <p className={TYPOGRAPHY.LABEL_MUTED}>Created</p>
              </div>
              <p className={TYPOGRAPHY.LABEL}>{new Date(group.createdAt).toLocaleDateString()}</p>
            </div>

            <div className="rounded-md border border-border/40 bg-muted/30 p-4">
              <div className="mb-2 flex items-center gap-2">
                <Edit3 className="size-4 text-muted-foreground" />
                <p className={TYPOGRAPHY.LABEL_MUTED}>Last Update</p>
              </div>
              <p className={TYPOGRAPHY.LABEL}>{new Date(group.updatedAt).toLocaleDateString()}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Bottom Section: Members Table */}
      <Card className={LAYOUT.BACKDROP_CARD}>
        <CardHeader className={LAYOUT.FLEX_BETWEEN}>
          <CardTitle className={TYPOGRAPHY.TITLE}>Members</CardTitle>
          <Button onClick={() => setManageMembershipDialogOpen(true)} variant="outline">
            <Settings className="mr-2 size-4" />
            Manage Membership
          </Button>
        </CardHeader>

        <CardContent>
          {errorMembers && (
            <Alert variant="destructive" className="mb-4">
              <AlertDescription>{errorMembers}</AlertDescription>
            </Alert>
          )}

          {loadingMembers ? (
            <div className="space-y-2">
              {Array.from({length: 3}).map((_, index) => (
                <Skeleton key={index} className="h-12 w-full" />
              ))}
            </div>
          ) : (
            <div className="rounded-md border border-border/50">
              <Table>
                <TableHeader className="bg-muted/50">
                  <TableRow>
                    <TableHead>Type</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {members.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={3} className="h-24 text-center">
                        <p className={TYPOGRAPHY.DESCRIPTION_SM}>No members found</p>
                      </TableCell>
                    </TableRow>
                  ) : (
                    members.map(member => (
                      <TableRow key={`${member.entity.entityType}-${member.entity.entityId}`}>
                        <TableCell>
                          <span className="inline-flex items-center rounded-full border bg-muted/50 px-2.5 py-0.5 text-xs font-semibold capitalize">
                            {member.entity.entityType === "human" ? "User" : "Unknown"}
                          </span>
                        </TableCell>
                        <TableCell>
                          {member.entity.entityType === "human" ? (
                            member.loadingUserDetails ? (
                              <Skeleton className="h-4 w-[120px]" />
                            ) : (
                              <span className={TYPOGRAPHY.LABEL}>
                                {member.userDetails?.displayName || "Unknown User"}
                              </span>
                            )
                          ) : (
                            <span className={TYPOGRAPHY.MONO_SM}>{member.entity.entityId}</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {member.entity.entityType === "human" ? (
                            member.loadingUserDetails ? (
                              <Skeleton className="h-4 w-[150px]" />
                            ) : (
                              <span className={TYPOGRAPHY.MONO_SM_MUTED}>
                                {member.userDetails?.email || "Unknown Email"}
                              </span>
                            )
                          ) : (
                            <span className={TYPOGRAPHY.DESCRIPTION_SM}>N/A</span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>

              {pagination && pagination.total > 0 && (
                <PaginationUI
                  total={pagination.total}
                  page={page}
                  rowsPerPage={rowsPerPage}
                  onPageChange={setPage}
                  onRowsPerPageChange={handleChangeRowsPerPage}
                />
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <ManageMembershipDialog
        open={manageMembershipDialogOpen}
        onClose={() => setManageMembershipDialogOpen(false)}
        groupId={group.id}
        groupName={group.name}
        currentMembers={members}
        onMembersUpdated={handleMembersUpdated}
      />
    </div>
  )
}

export default GroupDetailsPage
