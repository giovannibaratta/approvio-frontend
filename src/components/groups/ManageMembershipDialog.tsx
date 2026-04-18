import { type FrontendError } from "../../services/api"
import React, {useState, useEffect, useRef, useCallback, useMemo} from "react"
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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, AlertCircle, Plus, Minus, Undo2, Users } from "lucide-react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { debounce } from "../../utils/debounce"


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
        (error: FrontendError) => {
          notification.showError(`Search failed: ${error.message}`)
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
        (error: FrontendError) => {
          setError(error.message)
          notification.showError(`Failed to remove users: ${error.message}`)
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
        (error: FrontendError) => {
          setError(error.message)
          notification.showError(`Failed to add users: ${error.message}`)
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

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && handleClose()}>
      <DialogContent className="flex max-h-[90vh] flex-col overflow-hidden sm:max-w-[700px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="size-5 text-muted-foreground" />
            Manage Membership
          </DialogTitle>
          <DialogDescription>
            Add or remove users from the <span className="font-semibold text-foreground">{groupName}</span> group.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 space-y-6 overflow-y-auto pr-2">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="size-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Search Section */}
          <div className="space-y-4">
            <div className="relative">
              <Input
                ref={searchInputRef}
                placeholder="Search users by name or email..."
                value={searchQuery}
                onChange={handleSearchChange}
                disabled={loading}
                autoComplete="off"
                className="pr-10"
              />
              {loadingSearch && (
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
                  <Loader2 className="size-4 animate-spin text-muted-foreground" />
                </div>
              )}
            </div>

            {searchResults.length > 0 && (
              <div className="overflow-hidden rounded-md border border-border/50 bg-background/50 backdrop-blur-sm">
                <ScrollArea className="max-h-[250px]">
                  <div className="p-1">
                    {searchResults.map(user => {
                      const isUserCurrentlyMember = currentMembers.some(
                        (member) => member.entity.entityId === user.id && member.entity.entityType === "human"
                      )
                      const isPendingAdd = draftMembers.some(member => member.id === user.id && member.isNew && !member.isRemoved)
                      const isPendingRemove = draftMembers.some(member => member.id === user.id && !member.isNew && member.isRemoved)

                      return (
                        <div key={user.id} className="flex items-center justify-between rounded-sm border-b border-border/40 p-3 transition-colors last:border-0 hover:bg-muted/50">
                          <div className="flex flex-col overflow-hidden">
                            <span className="truncate text-sm font-medium">
                              {highlightMatch(user.displayName, searchQuery)}
                            </span>
                            <span className="truncate font-mono text-xs text-muted-foreground">
                              {highlightMatch(user.email, searchQuery)}
                            </span>
                          </div>
                          <div className="ml-4 shrink-0">
                            {(isUserCurrentlyMember && !isPendingRemove) ? (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleRemoveMember(user)}
                                className="h-8 border-destructive/20 text-destructive hover:bg-destructive/10"
                              >
                                <Minus className="mr-1.5 size-3.5" />
                                Remove
                              </Button>
                            ) : isPendingRemove ? (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleUndoRemove(user.id)}
                                className="h-8"
                              >
                                <Undo2 className="mr-1.5 size-3.5" />
                                Undo
                              </Button>
                            ) : isPendingAdd ? (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleRemoveMember(user)}
                                className="h-8"
                              >
                                <Undo2 className="mr-1.5 size-3.5" />
                                Undo Add
                              </Button>
                            ) : (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleAddUser(user)}
                                className="h-8 border-primary/20 text-primary hover:bg-primary/10"
                              >
                                <Plus className="mr-1.5 size-3.5" />
                                Add
                              </Button>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </ScrollArea>
              </div>
            )}
          </div>

          {/* Pending Changes Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-semibold tracking-tight">Pending Changes</h4>
              {pendingChanges.length > 0 && (
                <Badge variant="secondary" className="font-mono text-xs">{pendingChanges.length}</Badge>
              )}
            </div>

            {pendingChanges.length === 0 ? (
              <div className="flex items-center justify-center rounded-md border border-dashed border-border/60 p-6">
                <p className="text-center text-sm text-muted-foreground">No pending changes.</p>
              </div>
            ) : (
              <div className="overflow-hidden rounded-md border border-border/50">
                <Table>
                  <TableHeader className="bg-muted/30">
                    <TableRow>
                      <TableHead>User</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pendingChanges.map(member => (
                      <TableRow
                        key={member.id}
                        className={member.isNew && !member.isRemoved ? "bg-emerald-500/5 hover:bg-emerald-500/10" : member.isRemoved ? "bg-destructive/5 hover:bg-destructive/10" : ""}
                      >
                        <TableCell className={member.isRemoved ? "opacity-50" : ""}>
                          <div className="flex flex-col">
                            <span className={`text-sm font-medium ${member.isRemoved ? "line-through" : ""}`}>
                              {member.displayName}
                            </span>
                            <span className={`font-mono text-xs text-muted-foreground ${member.isRemoved ? "line-through" : ""}`}>
                              {member.email}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          {member.isNew && !member.isRemoved && (
                            <Badge variant="outline" className="border-emerald-500/20 bg-emerald-500/10 text-emerald-600">To Be Added</Badge>
                          )}
                          {member.isRemoved && (
                            <Badge variant="outline" className="border-destructive/20 bg-destructive/10 text-destructive">To Be Removed</Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleUndoRemove(member.id)}
                            disabled={loading}
                            className="h-8 text-muted-foreground hover:text-foreground"
                          >
                            <Undo2 className="mr-2 size-4" />
                            Undo
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>
        </div>

        <DialogFooter className="mt-4 border-t border-border/40 pt-4">
          <Button variant="outline" onClick={handleClose} disabled={loading}>
            Cancel
          </Button>
          <Button
            onClick={handleSaveChanges}
            disabled={loading || pendingChanges.length === 0}
            className="min-w-[140px]"
          >
            {loading && <Loader2 className="mr-2 size-4 animate-spin" />}
            {loading ? "Saving..." : `Save Changes (${pendingChanges.length})`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default ManageMembershipDialog
