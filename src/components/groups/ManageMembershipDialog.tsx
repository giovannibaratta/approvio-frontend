import React, {useState, useEffect, useRef, useCallback, useMemo} from "react"
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  TextField,
  Paper,
  TableContainer,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  CircularProgress,
  Alert,
  List,
  ListItem,
  ListItemText,
  debounce,
  Chip,
  ButtonGroup
} from "@mui/material"

import {
  listUsers,
  addGroupEntities,
  removeGroupEntities,
} from "../../services/api"
import type {
  AddGroupEntitiesRequest,
  RemoveGroupEntitiesRequest,
  UserSummary,
  ListUsers200Response
} from "@approvio/api"
import {useNotification} from "../../providers/notification/NotificationContext"
import {handleEither} from "../../utils/either"

import type { MemberDetails } from "@/models/group-details"

interface UserAssignment extends UserSummary {
  isNew?: boolean
  isRemoved?: boolean
}

interface ManageMembershipDialogProps {
  open: boolean
  onClose: () => void
  groupId: string
  groupName: string
  currentMembers: MemberDetails[]
  onMembersUpdated: () => void
}

const ManageMembershipDialog: React.FC<ManageMembershipDialogProps> = ({
  open,
  onClose,
  groupId,
  groupName,
  currentMembers,
  onMembersUpdated
}) => {
  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState<UserSummary[]>([])
  const [draftMembers, setDraftMembers] = useState<UserAssignment[]>([])
  const [loadingSearch, setLoadingSearch] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const searchInputRef = useRef<HTMLInputElement>(null)

  const notification = useNotification()

  useEffect(() => {
    if (open) {
      setDraftMembers([])
      setSearchQuery("")
      setSearchResults([])
      setError(null)
    }
  }, [open])

  const performSearch = useCallback(
    async (query: string) => {
      if (!query.trim()) {
        setSearchResults([])
        setLoadingSearch(false)
        return
      }

      setLoadingSearch(true)
      const result = await listUsers({page: 1, limit: 20, search: query})

      handleEither(
        result,
        (response: ListUsers200Response) => {
          const currentDraftIds = new Set(draftMembers.map(dm => dm.id))

          const filteredUsers = response.users.filter(
            (user: UserSummary) => !currentDraftIds.has(user.id)
          )
          setSearchResults([...filteredUsers])
        },
        (errorMessage: string) => {
          notification.showError(`Search failed: ${errorMessage}`)
          setSearchResults([])
        }
      )

      setLoadingSearch(false)
    },
    [draftMembers, notification]
  )

  const debouncedSearch = useMemo(
    () => debounce(performSearch, 300),
    [performSearch]
  )

  useEffect(() => {
    if (searchQuery.trim()) {
      debouncedSearch(searchQuery)
    } else {
      setSearchResults([])
    }

    return () => {
      debouncedSearch.clear()
    }
  }, [searchQuery, debouncedSearch])

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(event.target.value)
  }

  const handleAddUser = (user: UserSummary) => {
    const isAlreadyInDraft = draftMembers.some(
      (member) => member.id === user.id && !member.isRemoved
    )

    if (!isAlreadyInDraft) {
      const newMember: UserAssignment = {
        id: user.id,
        displayName: user.displayName,
        email: user.email,
        isNew: true,
        isRemoved: false
      }
      setDraftMembers(prev => [...prev, newMember])
    }
  }

  const handleRemoveMember = (userSummary: UserSummary) => {
    const existingDraft = draftMembers.find(member => member.id === userSummary.id)

    if (!existingDraft) {
      const memberToRemove: UserAssignment = {
        id: userSummary.id,
        displayName: userSummary.displayName,
        email: userSummary.email,
        isNew: false,
        isRemoved: true,
      }
      setDraftMembers(prev => [...prev, memberToRemove])
    }
  }

  const handleUndoRemove = (memberId: string) => {
    setDraftMembers(prev =>
      prev.filter(member => !(member.id === memberId && member.isRemoved))
    )
  }

  const handleSaveChanges = async () => {
    setLoading(true)
    setError(null)

    const usersToAdd = draftMembers.filter(m => m.isNew && !m.isRemoved)
    const usersToRemove = draftMembers.filter(m => !m.isNew && m.isRemoved)

    let success = true

    if (usersToRemove.length > 0) {
      const payload: RemoveGroupEntitiesRequest = {
        entities: usersToRemove.map(member => ({
          entity: {entityType: "human", entityId: member.id}
        }))
      }

      const removeResult = await removeGroupEntities(groupId, payload)
      handleEither(
        removeResult,
        () => { /* Do nothing on success */ },
        (errorMessage: string) => {
          setError(errorMessage)
          notification.showError(`Failed to remove users: ${errorMessage}`)
          success = false
        }
      )
    }

    if (!success) {
      setLoading(false)
      return
    }

    if (usersToAdd.length > 0) {
      const payload: AddGroupEntitiesRequest = {
        entities: usersToAdd.map(member => ({
          entity: {entityType: "human", entityId: member.id}
        }))
      }

      const addResult = await addGroupEntities(groupId, payload)
      handleEither(
        addResult,
        () => { /* Do nothing on success */ },
        (errorMessage: string) => {
          setError(errorMessage)
          notification.showError(`Failed to add users: ${errorMessage}`)
          success = false
        }
      )
    }

    if (!success) {
      setLoading(false)
      return
    }

    notification.showSuccess("Membership changes saved successfully!")
    onMembersUpdated()
    onClose()
    setLoading(false)
  }

  const handleClose = () => {
    onClose()
  }

  const pendingChanges = draftMembers.filter(
    member => member.isNew || member.isRemoved
  )

  const highlightMatch = (text: string, query: string) => {
    if (!query) return text
    const escapedQuery = query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
    const parts = text.split(new RegExp(`(${escapedQuery})`, "gi"))
    return (
      <span>
        {parts.map((part, index) =>
          part.toLowerCase() === query.toLowerCase() ? (
            <Chip key={index} label={part} color="primary" size="small" />
          ) : (
            part
          )
        )}
      </span>
    )
  }

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle>Manage Membership - {groupName}</DialogTitle>
      <DialogContent sx={{overflow: "visible"}}>
        {error && (
          <Alert severity="error" sx={{mb: 2}}>
            {error}
          </Alert>
        )}

        {/* Search Section */}
        <Box sx={{mb: 3}}>
          <TextField
            fullWidth
            label="Search users by name or email"
            variant="outlined"
            value={searchQuery}
            onChange={handleSearchChange}
            disabled={loading}
            inputRef={searchInputRef}
            autoComplete="off"
            slotProps={{
              input: {
                endAdornment: loadingSearch ? <CircularProgress size={20} /> : null
              }
            }}
          />

          {searchResults.length > 0 && (
            <Paper sx={{mt: 1, maxHeight: 200, overflow: "auto"}}>
              <List dense>
                {searchResults.map(user => {
                  const isUserCurrentlyMember = currentMembers.some(
                    (member) => member.entity.entityId === user.id && member.entity.entityType === "human"
                  )
                  const isPendingAdd = draftMembers.some(member => member.id === user.id && member.isNew && !member.isRemoved)
                  const isPendingRemove = draftMembers.some(member => member.id === user.id && !member.isNew && member.isRemoved)

                  return (
                    <ListItem key={user.id} component="div" sx={{display: "flex", justifyContent: "space-between", alignItems: "center"}}>
                      <ListItemText primary={highlightMatch(user.displayName, searchQuery)} secondary={highlightMatch(user.email, searchQuery)} />
                      {(isUserCurrentlyMember && !isPendingRemove) ? (
                        <Button
                          variant="outlined"
                          color="error"
                          size="small"
                          onClick={() => handleRemoveMember(user)}
                        >
                          Remove Member
                        </Button>
                      ) : isPendingRemove ? (
                        <Button
                          variant="outlined"
                          size="small"
                          onClick={() => handleUndoRemove(user.id)}
                        >
                          Undo Remove
                        </Button>
                      ) : isPendingAdd ? (
                        <Button
                          variant="outlined"
                          size="small"
                          onClick={() => handleRemoveMember(user)}
                        >
                          Undo Add
                        </Button>
                      ) : (
                        <Button
                          variant="outlined"
                          color="primary"
                          size="small"
                          onClick={() => handleAddUser(user)}
                        >
                          Add Member
                        </Button>
                      )}
                    </ListItem>
                  )
                })}
              </List>
            </Paper>
          )}
        </Box>

        {/* Pending Changes Section */}
        <Typography variant="h6" gutterBottom>
          Pending Changes
        </Typography>

        {pendingChanges.length === 0 ? (
          <Typography color="text.secondary">No pending changes.</Typography>
        ) : (
          <TableContainer component={Paper} variant="outlined">
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Name</TableCell>
                  <TableCell>Email</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell align="center">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {pendingChanges.map(member => (
                  <TableRow
                    key={member.id}
                    sx={{
                      opacity: member.isRemoved ? 0.5 : 1,
                      backgroundColor: member.isNew && !member.isRemoved ? "action.hover" : "inherit"
                    }}
                  >
                    <TableCell>
                      <Typography variant="body2" sx={{textDecoration: member.isRemoved ? "line-through" : "none"}}>
                        {member.displayName}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{textDecoration: member.isRemoved ? "line-through" : "none"}}
                      >
                        {member.email}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      {member.isNew && !member.isRemoved && (
                        <Chip label="To Be Added" size="small" color="success" variant="outlined" />
                      )}
                      {member.isRemoved && (
                        <Chip label="To Be Removed" size="small" color="error" variant="outlined" />
                      )}
                    </TableCell>
                    <TableCell align="center">
                      <ButtonGroup size="small">
                        <Button
                            variant="outlined"
                            onClick={() => handleUndoRemove(member.id)}
                            disabled={loading}
                            size="small"
                          >
                            Undo
                          </Button>
                      </ButtonGroup>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} disabled={loading}>
          Cancel
        </Button>
        <Button
          onClick={handleSaveChanges}
          variant="contained"
          disabled={loading || pendingChanges.length === 0}
        >
          {loading ? <CircularProgress size={20} /> : `Save Changes (${pendingChanges.length})`}
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default ManageMembershipDialog
