import React, {useState, useEffect} from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog"
import {Button} from "@/components/ui/button"
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from "@/components/ui/select"
import {Input} from "@/components/ui/input"
import {Label} from "@/components/ui/label"
import {Trash2, Plus, Loader2, Shield} from "lucide-react"
import {useNotification} from "@/providers/notification/NotificationContext"
import {listRoleTemplates, assignUserRoles} from "@/services/api"
import {handleEither} from "@/utils/either"
import type {RoleOperationItem, RoleTemplate, RoleScope, User} from "@approvio/api"

interface ManageUserRolesDialogProps {
  user: User
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

export const ManageUserRolesDialog: React.FC<ManageUserRolesDialogProps> = ({user, open, onOpenChange, onSuccess}) => {
  const [roleTemplates, setRoleTemplates] = useState<RoleTemplate[]>([])
  const [loadingTemplates, setLoadingTemplates] = useState<boolean>(false)
  const [saving, setSaving] = useState<boolean>(false)

  // Local state for the roles being edited, each with a unique local ID to prevent React index key reconciliation bugs
  const [roles, setRoles] = useState<(RoleOperationItem & {localId: string})[]>([])

  const notification = useNotification()

  useEffect(() => {
    if (open) {
      setRoles(
        (user.roles || []).map((r, idx) => ({
          ...r,
          localId: `${r.roleName}-${r.scope.type}-${idx}-${Math.random().toString(36).substr(2, 9)}`
        }))
      )
    }
  }, [open, user.roles])

  useEffect(() => {
    const fetchTemplates = async () => {
      if (!open || roleTemplates.length > 0) return
      setLoadingTemplates(true)
      const result = await listRoleTemplates()
      handleEither(
        result,
        response => {
          setRoleTemplates(response.roles)
        },
        error => {
          notification.showError(`Failed to load role templates: ${error.message}`)
        }
      )
      setLoadingTemplates(false)
    }

    fetchTemplates()
  }, [open, roleTemplates.length, notification])

  const handleAddRole = () => {
    setRoles([
      ...roles,
      {
        roleName: "",
        scope: {type: "org"},
        localId: `new-role-${Math.random().toString(36).substr(2, 9)}`
      } as (RoleOperationItem & {localId: string})
    ])
  }

  const handleRemoveRole = (index: number) => {
    const newRoles = [...roles]
    newRoles.splice(index, 1)
    setRoles(newRoles)
  }

  const handleRoleChange = (index: number, roleName: string) => {
    const newRoles = [...roles]
    newRoles[index] = {
      ...newRoles[index],
      roleName
    } as (RoleOperationItem & {localId: string})
    setRoles(newRoles)
  }

  const handleScopeChange = (index: number, scopeType: string) => {
    let newScope: RoleScope

    // Initialize target IDs to an empty string to:
    // 1. Maintain a React "controlled input" state, preventing uncontrolled-to-controlled console warnings.
    // 2. Safely clear out and reset any previously entered target ID when switching scope types.
    switch (scopeType) {
      case "org":
        newScope = {type: "org"}
        break
      case "space":
        newScope = {type: "space", spaceId: ""}
        break
      case "group":
        newScope = {type: "group", groupId: ""}
        break
      case "workflow_template":
        newScope = {type: "workflow_template", workflowTemplateId: ""}
        break
      default:
        newScope = {type: "org"}
    }
    const newRoles = [...roles]
    newRoles[index] = {...newRoles[index], scope: newScope} as (RoleOperationItem & {localId: string})
    setRoles(newRoles)
  }

  const handleScopeTargetChange = (index: number, targetId: string) => {
    const newRoles = [...roles]
    const currentScope = newRoles[index]?.scope

    if (!currentScope) return

    if (currentScope.type === "space") {
      newRoles[index] = {...newRoles[index], scope: {...currentScope, spaceId: targetId}} as (RoleOperationItem & {localId: string})
    } else if (currentScope.type === "group") {
      newRoles[index] = {...newRoles[index], scope: {...currentScope, groupId: targetId}} as (RoleOperationItem & {localId: string})
    } else if (currentScope.type === "workflow_template") {
      newRoles[index] = {...newRoles[index], scope: {...currentScope, workflowTemplateId: targetId}} as (RoleOperationItem & {localId: string})
    }

    setRoles(newRoles)
  }

  const handleSave = async () => {
    // Validate roles
    const isValid = roles.every(role => {
      if (!role.roleName) return false
      if (role.scope.type === "space" && !role.scope.spaceId) return false
      if (role.scope.type === "group" && !role.scope.groupId) return false
      if (role.scope.type === "workflow_template" && !role.scope.workflowTemplateId) return false
      return true
    })

    if (!isValid) {
      notification.showError("Please fill in all required fields for each role.")
      return
    }

    setSaving(true)

    // Strip localId properties before submitting payloads to the backend
    const request = {
      roles: roles.map(({localId: _localId, ...rest}) => rest) as RoleOperationItem[],
      concurrencyControl: {
        version: user.concurrencyControl.version
      }
    }

    const result = await assignUserRoles(user.id, request)

    handleEither(
      result,
      () => {
        notification.showSuccess("Roles updated successfully")
        onSuccess()
        onOpenChange(false)
      },
      error => {
        notification.showError(`Failed to update roles: ${error.message}`)
      }
    )

    setSaving(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[90vh] w-full max-w-5xl flex-col sm:max-w-5xl">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="flex items-center gap-2">
            <Shield className="size-5" />
            Manage Roles for {user.displayName}
          </DialogTitle>
          <DialogDescription>
            Assign or remove roles and their corresponding scopes for this user.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto py-4 pr-1">
          {loadingTemplates ? (
            <div className="flex justify-center p-8">
              <Loader2 className="size-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="space-y-4">
              {roles.length === 0 ? (
                <div className="rounded-md border border-dashed p-8 text-center text-muted-foreground">
                  <Shield className="mx-auto mb-2 size-8 opacity-20" />
                  <p>No roles assigned to this user.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {roles.map((role, idx) => (
                    <div key={role.localId} className="flex items-start gap-3 rounded-md border p-3">
                      <div className="flex flex-1 gap-3">
                        <div className="flex-1 space-y-2">
                          <Label>Role</Label>
                          <Select
                            value={role.roleName || ""}
                            onValueChange={val => val && handleRoleChange(idx, val)}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select a role" />
                            </SelectTrigger>
                            <SelectContent>
                              {roleTemplates.map(t => {
                                if (!t.name) return null
                                return (
                                  <SelectItem key={t.name} value={t.name}>
                                    {t.name} ({t.scope})
                                  </SelectItem>
                                )
                              })}
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="flex-1 space-y-2">
                          <Label>Scope</Label>
                          <Select
                            value={role.scope.type || ""}
                            onValueChange={val => val && handleScopeChange(idx, val)}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select scope" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="org">Organization</SelectItem>
                              <SelectItem value="space">Space</SelectItem>
                              <SelectItem value="group">Group</SelectItem>
                              <SelectItem value="workflow_template">Workflow Template</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        {role.scope.type !== "org" && (
                          <div className="flex-1 space-y-2">
                            <Label>Target ID</Label>
                            <Input
                              placeholder={`Enter ${role.scope.type} ID`}
                              value={
                                role.scope.type === "space" ? (role.scope.spaceId) :
                                role.scope.type === "group" ? (role.scope.groupId) :
                                role.scope.type === "workflow_template" ? (role.scope.workflowTemplateId) : ""
                              }
                              onChange={e => handleScopeTargetChange(idx, e.target.value)}
                            />
                          </div>
                        )}
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="mt-6 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                        onClick={() => handleRemoveRole(idx)}
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}

              <Button variant="outline" size="sm" onClick={handleAddRole} className="w-full gap-2 border-dashed">
                <Plus className="size-4" />
                Add Role Assignment
              </Button>
            </div>
          )}
        </div>

        <DialogFooter className="flex-shrink-0 border-t pt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving || loadingTemplates}>
            {saving && <Loader2 className="mr-2 size-4 animate-spin" />}
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
