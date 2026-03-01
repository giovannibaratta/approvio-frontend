import React, {useState, useEffect, useRef, useCallback, useMemo} from "react"
import {
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
  IconButton,
  List,
  ListItem,
  ListItemText,
  debounce,
  ListItemIcon,
  Select,
  MenuItem,
  FormControl
} from "@mui/material"
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline"
import RemoveCircleOutlineIcon from "@mui/icons-material/RemoveCircleOutline"
import AddCircleOutlineIcon from "@mui/icons-material/AddCircleOutline"

import {listUsers, listGroupEntities} from "../../services/api"
import type { User, UserSummary, ListUsers200Response } from "@approvio/api"
import {useNotification} from "../../providers/notification/NotificationContext"
import {handleEither} from "../../utils/either"

interface UserAssignment extends User {
  role: string
}

interface AssignUsersStepProps {
  groupName: string
  groupSuccessfullyCreated: boolean
  groupId?: string
  loading: boolean
  onSelectedUsersChange: (users: UserAssignment[]) => void
}

const possibleRoles = ["approver", "admin", "owner", "auditor"]

const AssignUsersStep: React.FC<AssignUsersStepProps> = ({
  groupName,
  groupSuccessfullyCreated,
  groupId,
  onSelectedUsersChange,
  loading
}) => {
  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState<UserSummary[]>([])
  const [selectedUsers, setSelectedUsers] = useState<UserAssignment[]>([])
  const [loadingSearch, setLoadingSearch] = useState(false)
  const [searchError, setSearchError] = useState<string | null>(null)
  const [assignedUserIds, setAssignedUserIds] = useState<string[]>([])
  const [loadingAssigned, setLoadingAssigned] = useState(false)
  const [assignedError, setAssignedError] = useState<string | null>(null)

  const searchInputRef = useRef<HTMLInputElement>(null)

  const notification = useNotification()

  useEffect(() => {
    if (groupId) {
      setLoadingAssigned(true)
      setAssignedError(null)

      const fetchAssignedUsers = async () => {
        const result = await listGroupEntities(groupId, 1, 1000)

        handleEither(
          result,
          async (response) => {
            const humanEntities = response.entities.filter(
              entity => entity.entity.entityType === "human"
            ).map(entity => entity.entity.entityId)


            setAssignedUserIds(humanEntities)
          },
          (errorMessage: string) => {
            setAssignedError(errorMessage)
            setAssignedUserIds([])
            notification.showError(`Failed to load assigned users: ${errorMessage}`)
          }
        )

        setLoadingAssigned(false)
      }
      fetchAssignedUsers()
    } else {
      setAssignedUserIds([])
    }
  }, [groupId, notification])

  const performSearch = useCallback(
    async (query: string) => {
      if (!query.trim()) {
        setSearchResults([])
        setLoadingSearch(false)
        return
      }
      setLoadingSearch(true)
      setSearchError(null)

      const result = await listUsers({page: 1, limit: 20, search: query})

      handleEither(
        result,
        (response: ListUsers200Response) => {
          const filteredUsers = response.users.filter(
            (user: UserSummary) =>
              (user.displayName.toLowerCase().includes(query.toLowerCase()) ||
                user.email.toLowerCase().includes(query.toLowerCase())) &&
              !assignedUserIds.some(assignedUser => assignedUser === user.id) &&
              !selectedUsers.some(selectedUser => selectedUser.id === user.id)
          )
          setSearchResults(filteredUsers)
        },
        (errorMessage: string) => {
          setSearchError(errorMessage)
          setSearchResults([])
          notification.showError(`Search failed: ${errorMessage}`)
        }
      )

      setLoadingSearch(false)
    },
    [assignedUserIds, selectedUsers, notification]
  )

  const debouncedSearch = useMemo(
    () => debounce(performSearch, 300),
    [performSearch]
  )

  useEffect(() => {
    if (groupSuccessfullyCreated && searchQuery.length > 0) {
      debouncedSearch(searchQuery)
    } else if (!searchQuery) {
      setSearchResults([])
    }

    if (!groupSuccessfullyCreated) {
      setSearchResults([])
      setSelectedUsers([])
    }

    return () => {
      debouncedSearch.clear()
    }
  }, [searchQuery, groupSuccessfullyCreated, debouncedSearch])

  useEffect(() => {
    if (searchQuery.length > 0 && searchInputRef.current && document.activeElement !== searchInputRef.current) {
      // Force the focus on the search input when page components are refreshed
      setTimeout(() => {
        if (searchInputRef.current) {
          searchInputRef.current.focus()
        }
      }, 0)
    }
  }, [searchResults, searchQuery])

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(event.target.value)
  }

  const handleSelectUser = (user: UserSummary) => {
    if (!selectedUsers.some(selectedUser => selectedUser.id === user.id)) {
      const userForAssignment: User = {
        id: user.id,
        displayName: user.displayName,
        email: user.email,
        createdAt: new Date().toISOString()
      }
      const userWithRole: UserAssignment = {...userForAssignment, role: "approver"}
      setSelectedUsers(prevSelected => [...prevSelected, userWithRole])
      setSearchQuery("")
      setSearchResults([])
    }
  }

  const handleDeselectUser = (user: UserSummary) => {
    setSelectedUsers(prevSelected => prevSelected.filter(u => u.id !== user.id))
  }

  const handleToggleUser = (user: UserSummary) => {
    if (!isUserPermanentlyAssigned(user)) {
      if (isUserSelected(user)) {
        handleDeselectUser(user)
      } else {
        handleSelectUser(user)
      }
    }
  }

  const isUserSelected = (user: UserSummary) => {
    return selectedUsers.some(selectedUser => selectedUser.id === user.id)
  }

  const isUserPermanentlyAssigned = (user: UserSummary) => {
    return assignedUserIds.some(assignedUser => assignedUser === user.id)
  }

  const highlightMatch = (text: string, query: string) => {
    if (!query) return text
    const escapedQuery = query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
    const parts = text.split(new RegExp(`(${escapedQuery})`, "gi"))
    return (
      <span>
        {parts.map((part, index) =>
          part.toLowerCase() === query.toLowerCase() ? (
            <span key={index} style={{fontWeight: "bold", backgroundColor: "lightblue"}}>
              {part}
            </span>
          ) : (
            part
          )
        )}
      </span>
    )
  }

  const handleRoleChange = (userId: string, newRole: string) => {
    setSelectedUsers(prevSelected => prevSelected.map(user => (user.id === userId ? {...user, role: newRole} : user)))
  }

  useEffect(() => {
    onSelectedUsersChange(selectedUsers)
  }, [selectedUsers, onSelectedUsersChange])

  return (
    <Box sx={{mt: 3, p: 2}}>
      <Typography variant="h6" gutterBottom>
        {groupSuccessfullyCreated ? `Assign Users to "${groupName}"` : "User Assignment"}
      </Typography>

      {!groupSuccessfullyCreated && !loading && (
        <Typography color="error.main" sx={{mb: 2}}>
          Group creation was not successful. Cannot assign users.
        </Typography>
      )}

      {groupSuccessfullyCreated && (
        <>
          <TextField
            fullWidth
            label="Search users by name or email"
            variant="outlined"
            value={searchQuery}
            onChange={handleSearchChange}
            sx={{mb: 2}}
            disabled={loadingSearch || loadingAssigned || loading}
            inputRef={searchInputRef}
            InputProps={{
              endAdornment: loadingSearch ? <CircularProgress color="inherit" size={20} /> : null
            }}
          />

          {assignedError && (
            <Alert severity="error" sx={{mb: 2}}>
              {assignedError}
            </Alert>
          )}
          {searchError && (
            <Alert severity="error" sx={{mb: 2}}>
              {searchError}
            </Alert>
          )}

          {!loadingSearch && searchResults.length > 0 && searchQuery.length > 0 && (
            <Paper sx={{maxHeight: 200, overflow: "auto", mb: 2}}>
              <List dense>
                {searchResults.map(user => (
                  <ListItem
                    key={user.id}
                    onClick={() => handleToggleUser(user)}
                    sx={{
                      cursor: isUserPermanentlyAssigned(user) ? "default" : "pointer",
                      opacity: isUserPermanentlyAssigned(user) ? 0.6 : 1
                    }}
                  >
                    <ListItemIcon>
                      {isUserSelected(user) ? (
                        <CheckCircleOutlineIcon color="primary" />
                      ) : isUserPermanentlyAssigned(user) ? (
                        <CheckCircleOutlineIcon color="disabled" />
                      ) : (
                        <AddCircleOutlineIcon />
                      )}
                    </ListItemIcon>
                    <ListItemText
                      primary={highlightMatch(user.displayName, searchQuery)}
                      secondary={highlightMatch(user.email, searchQuery)}
                    />
                  </ListItem>
                ))}
              </List>
            </Paper>
          )}

          {searchQuery.length > 0 && !loadingSearch && searchResults.length === 0 && (
            <Typography color="text.secondary" sx={{mb: 2}}>
              No users found matching &quot;{searchQuery}&quot;
            </Typography>
          )}

          {selectedUsers.length > 0 && (
            <Paper sx={{p: 2, mb: 2}}>
              <Typography variant="subtitle1" gutterBottom>
                Selected Users ({selectedUsers.length})
              </Typography>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>User</TableCell>
                      <TableCell>Role</TableCell>
                      <TableCell align="center">Action</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {selectedUsers.map(user => (
                      <TableRow key={user.id}>
                        <TableCell>
                          <Box>
                            <Typography variant="body2" sx={{fontWeight: "medium"}}>
                              {user.displayName}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {user.email}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <FormControl size="small" sx={{minWidth: 120}}>
                            <Select
                              value={user.role}
                              onChange={e => handleRoleChange(user.id, e.target.value)}
                              variant="outlined"
                            >
                              {possibleRoles.map(role => (
                                <MenuItem key={role} value={role}>
                                  {role.charAt(0).toUpperCase() + role.slice(1)}
                                </MenuItem>
                              ))}
                            </Select>
                          </FormControl>
                        </TableCell>
                        <TableCell align="center">
                          <IconButton
                            onClick={() => handleDeselectUser(user)}
                            size="small"
                            color="error"
                            title="Remove user"
                          >
                            <RemoveCircleOutlineIcon />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>
          )}

          {loadingAssigned && (
            <Box sx={{display: "flex", justifyContent: "center", p: 2}}>
              <CircularProgress size={24} />
              <Typography variant="body2" sx={{ml: 2}}>
                Loading assigned users...
              </Typography>
            </Box>
          )}
        </>
      )}
    </Box>
  )
}

export default AssignUsersStep
