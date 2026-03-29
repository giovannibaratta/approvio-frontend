import React, {useCallback, useEffect, useState} from "react"
import {
  Box,
  Typography,
  Paper,
  CircularProgress,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Button,
  Grid,
  Tooltip,
  Skeleton
} from "@mui/material"
import GroupIcon from "@mui/icons-material/Group"
import {useParams} from "react-router-dom"
import {
  getGroup,
  listGroupEntities,
  getUser,
} from "../services/api"
import {handleEither} from "../utils/either"
import ManageMembershipDialog from "../components/groups/ManageMembershipDialog"
import { isRight } from "fp-ts/Either"
import { useNotification } from "../providers/notification/NotificationContext"

import type { Group, ListGroupEntities200Response, Pagination } from "@approvio/api"
import type { User } from "@approvio/api"
import type { GroupMembership } from "@approvio/api"

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
        (errorMessage: string) => {
          setErrorGroup(errorMessage)
          notification.showError(errorMessage)
        }
      )

      setLoadingGroup(false)
    }

    fetchGroupDetails()
  }, [groupIdentifier, notification])

  const fetchGroupMembers = useCallback(
    async () => {
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
      (errorMessage: string) => {
        setErrorMembers(errorMessage)
        notification.showError(errorMessage)
        setMembers([])
        setPagination(null)
      }
    )

    setLoadingMembers(false)
  }, [groupIdentifier, page, rowsPerPage, notification])

  useEffect(() => {
    fetchGroupMembers()
  }, [groupIdentifier, page, rowsPerPage, fetchGroupMembers])

  const handleChangePage = (_event: unknown, newPage: number) => {
    setPage(newPage)
  }

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10))
    setPage(0) // Reset to first page
  }

  const handleMembersUpdated = () => {
    fetchGroupMembers()

    if (groupIdentifier) {
      getGroup(groupIdentifier).then(result => {
        handleEither(
          result,
          (groupData: Group) => setGroup(groupData),
          (errorMessage: string) => notification.showError(`Error refreshing group details: ${errorMessage}`)
        )
      })
    }
  }

  if (loadingGroup) {
    return (
      <Box sx={{display: "flex", justifyContent: "center", alignItems: "center", height: "80vh"}}>
        <CircularProgress />
      </Box>
    )
  }

  if (errorGroup) {
    return (
      <Alert severity="error" sx={{m: 2}}>
        {errorGroup}
      </Alert>
    )
  }

  if (!group) {
    return (
      <Alert severity="warning" sx={{m: 2}}>
        Group not found.
      </Alert>
    )
  }

  return (
    <Box sx={{p: 3}}>
      {/* Top Section: Group Details */}
      <Paper sx={{p: 3, mb: 3}}>
        <Box sx={{display: "flex", alignItems: "center", mb: 2}}>
          <GroupIcon sx={{mr: 2, fontSize: 40, color: "primary.main"}} />
          <Typography variant="h4" component="h1" sx={{fontWeight: "bold"}}>
            {group.name}
          </Typography>
        </Box>

        <Grid container spacing={2} sx={{mb: 2}}>
          <Grid size={{xs: 12}}>
            <Typography variant="subtitle1" component="div" color="text.secondary" sx={{fontWeight: "bold", mb: 0.5}}>
              <Box sx={{borderBottom: "1px solid rgba(0, 0, 0, 0.12)", pb: 0.5, display: "inline-block"}}>
                Description
              </Box>
            </Typography>
            <Typography variant="body1">{group.description || "No description available"}</Typography>
          </Grid>
        </Grid>

        <Grid container spacing={2}>
          <Grid size={{xs: 12, sm: 6}}>
            <Typography variant="subtitle1" component="div" color="text.secondary" sx={{fontWeight: "bold", mb: 0.5}}>
              <Box sx={{borderBottom: "1px solid rgba(0, 0, 0, 0.12)", pb: 0.5, display: "inline-block"}}>
                Entities
              </Box>
            </Typography>
            <Typography variant="body1">{group.entitiesCount}</Typography>
          </Grid>
          <Grid size={{xs: 12, sm: 6}}>
            <Typography variant="subtitle1" component="div" color="text.secondary" sx={{fontWeight: "bold", mb: 0.5}}>
              <Box sx={{borderBottom: "1px solid rgba(0, 0, 0, 0.12)", pb: 0.5, display: "inline-block"}}>
                Created
              </Box>
            </Typography>
            <Tooltip title={new Date(group.createdAt).toLocaleString()} placement="top-start" enterDelay={500}>
              <Typography variant="body1">{new Date(group.createdAt).toLocaleDateString()}</Typography>
            </Tooltip>
          </Grid>
          <Grid size={{xs: 12, sm: 6}}>
            <Typography variant="subtitle1" component="div" color="text.secondary" sx={{fontWeight: "bold", mb: 0.5}}>
              <Box sx={{borderBottom: "1px solid rgba(0, 0, 0, 0.12)", pb: 0.5, display: "inline-block"}}>
                Last Update
              </Box>
            </Typography>
            <Tooltip title={new Date(group.updatedAt).toLocaleString()} placement="top-start" enterDelay={500}>
              <Typography variant="body1">{new Date(group.updatedAt).toLocaleDateString()}</Typography>
            </Tooltip>
          </Grid>
        </Grid>
      </Paper>

      {/* Bottom Section: Members Table */}
      <Paper>
        <Box sx={{display: "flex", justifyContent: "space-between", alignItems: "center", p: 2}}>
          <Typography variant="h6">Members</Typography>
          <Button variant="contained" onClick={() => setManageMembershipDialogOpen(true)}>
            Manage Membership
          </Button>
        </Box>

        {errorMembers && (
          <Alert severity="error" sx={{mb: 2}}>
            {errorMembers}
          </Alert>
        )}

        {loadingMembers ? (
          <Box sx={{p: 2}}>
            {Array.from({length: 3}).map((_, index) => (
              <Skeleton key={index} variant="rectangular" height={40} sx={{mb: 1}} />
            ))}
          </Box>
        ) : (
          <>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Type</TableCell>
                    <TableCell>Name</TableCell>
                    <TableCell>Email</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {members.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} align="center">
                        <Typography color="text.secondary">No members found</Typography>
                      </TableCell>
                    </TableRow>
                  ) : (
                    members.map(member => (
                      <TableRow key={`${member.entity.entityType}-${member.entity.entityId}`}>
                        <TableCell>
                          <Typography variant="body2" sx={{textTransform: "capitalize"}}>
                            {member.entity.entityType === "human" ? "User" : "Unknown"}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          {member.entity.entityType === "human" ? (
                            member.loadingUserDetails ? (
                              <Skeleton variant="text" width={120} />
                            ) : (
                              <Typography variant="body2">
                                {member.userDetails?.displayName || "Unknown User"}
                              </Typography>
                            )
                          ) : (
                            <Typography variant="body2">{member.entity.entityId}</Typography>
                          )}
                        </TableCell>
                        <TableCell>
                          {member.entity.entityType === "human" ? (
                            member.loadingUserDetails ? (
                              <Skeleton variant="text" width={150} />
                            ) : (
                              <Typography variant="body2" color="text.secondary">
                                {member.userDetails?.email || "Unknown Email"}
                              </Typography>
                            )
                          ) : (
                            <Typography variant="body2" color="text.secondary">
                              N/A
                            </Typography>
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
            {pagination && (
              <TablePagination
                rowsPerPageOptions={[5, 10, 25]}
                component="div"
                count={pagination.total}
                rowsPerPage={rowsPerPage}
                page={page}
                onPageChange={handleChangePage}
                onRowsPerPageChange={handleChangeRowsPerPage}
              />
            )}
          </>
        )}
      </Paper>

      <ManageMembershipDialog
        open={manageMembershipDialogOpen}
        onClose={() => setManageMembershipDialogOpen(false)}
        groupId={group.id}
        groupName={group.name}
        currentMembers={members}
        onMembersUpdated={handleMembersUpdated}
      />
    </Box>
  )
}

export default GroupDetailsPage
