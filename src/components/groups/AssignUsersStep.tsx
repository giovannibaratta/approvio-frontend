import { type FrontendError } from "../../services/api"
import React, {useState, useEffect, useRef, useCallback, useMemo} from "react"
import {listUsers, listGroupEntities} from "../../services/api"
import type { UserSummary, ListUsers200Response } from "@approvio/api"
import {useNotification} from "../../providers/notification/NotificationContext"
import {handleEither} from "../../utils/either"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { CheckCircle2, PlusCircle, Trash2, Loader2, AlertCircle } from "lucide-react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { debounce } from "../../utils/debounce"


interface AssignUsersStepProps {
  groupName: string
  groupSuccessfullyCreated: boolean
  groupId?: string
  loading: boolean
  onSelectedUsersChange: (users: UserSummary[]) => void
}

const AssignUsersStep: React.FC<AssignUsersStepProps> = ({
  groupName,
  groupSuccessfullyCreated,
  groupId,
  onSelectedUsersChange,
  loading
}) => {
  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState<UserSummary[]>([])
  const [selectedUsers, setSelectedUsers] = useState<UserSummary[]>([])
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
          (error: FrontendError) => {
            setAssignedError(error.message)
            setAssignedUserIds([])
            notification.showError(`Failed to load assigned users: ${error.message}`)
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
        (error: FrontendError) => {
          setSearchError(error.message)
          setSearchResults([])
          notification.showError(`Search failed: ${error.message}`)
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
      setSelectedUsers(prevSelected => [...prevSelected, user])
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
            <span key={index} className="rounded-sm bg-emerald-500/20 px-0.5 font-semibold text-emerald-700">
              {part}
            </span>
          ) : (
            part
          )
        )}
      </span>
    )
  }

  useEffect(() => {
    onSelectedUsersChange(selectedUsers)
  }, [selectedUsers, onSelectedUsersChange])

  return (
    <div className="space-y-6 pt-4">
      <div>
        <h3 className="text-lg font-medium">
          {groupSuccessfullyCreated ? `Assign Users to "${groupName}"` : "User Assignment"}
        </h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Search and add users to this group.
        </p>
      </div>

      {!groupSuccessfullyCreated && !loading && (
        <Alert variant="destructive">
          <AlertCircle className="size-4" />
          <AlertDescription>
            Group creation was not successful. Cannot assign users.
          </AlertDescription>
        </Alert>
      )}

      {groupSuccessfullyCreated && (
        <div className="space-y-4">
          <div className="relative">
            <Input
              ref={searchInputRef}
              type="text"
              placeholder="Search users by name or email..."
              value={searchQuery}
              onChange={handleSearchChange}
              disabled={loadingSearch || loadingAssigned || loading}
              className="pr-10"
              autoComplete="off"
            />
            {loadingSearch && (
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
                <Loader2 className="size-4 animate-spin text-muted-foreground" />
              </div>
            )}
          </div>

          {assignedError && (
            <Alert variant="destructive">
              <AlertCircle className="size-4" />
              <AlertDescription>{assignedError}</AlertDescription>
            </Alert>
          )}
          {searchError && (
            <Alert variant="destructive">
              <AlertCircle className="size-4" />
              <AlertDescription>{searchError}</AlertDescription>
            </Alert>
          )}

          {!loadingSearch && searchResults.length > 0 && searchQuery.length > 0 && (
            <div className="overflow-hidden rounded-md border border-border/50 bg-background/50 backdrop-blur-sm">
              <ScrollArea className="max-h-[200px]">
                <div className="p-1">
                  {searchResults.map(user => (
                    <div
                      key={user.id}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault()
                          handleToggleUser(user)
                        }
                      }}
                      onClick={() => handleToggleUser(user)}
                      className={`flex items-center gap-3 rounded-sm p-2 transition-colors ${
                        isUserPermanentlyAssigned(user)
                          ? "cursor-default opacity-60"
                          : "cursor-pointer hover:bg-muted/50"
                      }`}
                    >
                      <div className="flex shrink-0 items-center justify-center">
                        {isUserSelected(user) ? (
                          <CheckCircle2 className="size-5 text-primary" />
                        ) : isUserPermanentlyAssigned(user) ? (
                          <CheckCircle2 className="size-5 text-muted-foreground" />
                        ) : (
                          <PlusCircle className="size-5 text-muted-foreground" />
                        )}
                      </div>
                      <div className="flex flex-col overflow-hidden">
                        <span className="truncate text-sm font-medium">
                          {highlightMatch(user.displayName, searchQuery)}
                        </span>
                        <span className="truncate font-mono text-xs text-muted-foreground">
                          {highlightMatch(user.email, searchQuery)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>
          )}

          {searchQuery.length > 0 && !loadingSearch && searchResults.length === 0 && (
            <p className="py-4 text-center text-sm text-muted-foreground">
              No users found matching &quot;{searchQuery}&quot;
            </p>
          )}

          {selectedUsers.length > 0 && (
            <div className="overflow-hidden rounded-md border border-border/50 bg-background">
              <div className="flex items-center justify-between border-b border-border/50 bg-muted/20 px-4 py-2">
                <span className="text-sm font-medium">Selected Users</span>
                <span className="inline-flex items-center justify-center rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">
                  {selectedUsers.length}
                </span>
              </div>
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead>User</TableHead>
                    <TableHead className="w-[100px] text-center">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {selectedUsers.map(user => (
                    <TableRow key={user.id}>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="text-sm font-medium">{user.displayName}</span>
                          <span className="font-mono text-xs text-muted-foreground">{user.email}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-8 text-destructive hover:bg-destructive/10 hover:text-destructive"
                          onClick={() => handleDeselectUser(user)}
                          title="Remove user"
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          {loadingAssigned && (
            <div className="flex items-center justify-center p-4 text-muted-foreground">
              <Loader2 className="mr-2 size-5 animate-spin" />
              <span className="text-sm">Loading assigned users...</span>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default AssignUsersStep
