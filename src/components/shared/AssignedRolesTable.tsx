import React, {useEffect, useState} from "react"
import {DataTable, type Column} from "../DataTable"
import {getGroup, getSpace, getWorkflowTemplate} from "../../services/api"
import {isRight} from "fp-ts/Either"
import type {RoleOperationItem, User} from "@approvio/api"
import {TYPOGRAPHY} from "@/lib/styles"
import {Link} from "react-router-dom"
import {ManageUserRolesDialog} from "../users/ManageUserRolesDialog"
import {Tooltip, TooltipContent, TooltipProvider, TooltipTrigger} from "@/components/ui/tooltip"

export interface AssignedRolesTableProps {
  roles: RoleOperationItem[]
  loading?: boolean
  user?: User // Optional user prop. If provided, role management editing is enabled.
  onRolesChange?: () => void
}

export const AssignedRolesTable: React.FC<AssignedRolesTableProps> = ({
  roles,
  loading = false,
  user,
  onRolesChange
}) => {
  const [dialogOpen, setDialogOpen] = useState(false)
  const [resolvedNames, setResolvedNames] = useState<Record<string, string>>({})

  // Resolve scope target names dynamically
  useEffect(() => {
    const resolveNames = async () => {
      if (!roles || roles.length === 0) return

      const initialNames = {...resolvedNames}
      const promises = roles.map(async role => {
        const scope = role.scope
        if (scope.type === "group" && scope.groupId) {
          const gid = scope.groupId
          if (!initialNames[gid]) {
            const res = await getGroup(gid)
            if (isRight(res)) {
              return {id: gid, name: res.right.name}
            }
          }
        } else if (scope.type === "space" && scope.spaceId) {
          const sid = scope.spaceId
          if (!initialNames[sid]) {
            const res = await getSpace(sid)
            if (isRight(res)) {
              return {id: sid, name: res.right.name}
            }
          }
        } else if (scope.type === "workflow_template" && scope.workflowTemplateId) {
          const wtid = scope.workflowTemplateId
          if (!initialNames[wtid]) {
            const res = await getWorkflowTemplate(wtid)
            if (isRight(res)) {
              return {id: wtid, name: res.right.name}
            }
          }
        }
        return null
      })

      const fetched = await Promise.all(promises)
      setResolvedNames(prev => {
        const next = {...prev}
        fetched.forEach(item => {
          if (item) {
            next[item.id] = item.name
          }
        })
        return next
      })
    }

    resolveNames()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roles])

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
      const wtid = scope.workflowTemplateId
      return {
        name: resolvedNames[wtid] || wtid,
        link: `/workflow-templates/${wtid}`
      }
    }
    return null
  }

  const columns: Column<RoleOperationItem & {id: string}>[] = [
    {
      id: "roleName",
      label: "Role",
      width: "30%",
      render: row => <span className={TYPOGRAPHY.LABEL}>{row.roleName}</span>
    },
    {
      id: "scopeType",
      label: "Scope Type",
      width: "35%",
      render: row => (
        <span className="inline-flex items-center rounded-full border border-border bg-muted/50 px-2.5 py-0.5 text-xs font-semibold capitalize text-muted-foreground">
          {row.scope.type.replace(/_/g, " ")}
        </span>
      )
    },
    {
      id: "scopeTarget",
      label: "Scope Target",
      width: "35%",
      render: row => {
        const targetInfo = getTargetInfo(row)
        if (!targetInfo) {
          return <span className={TYPOGRAPHY.DESCRIPTION_SM}>Global</span>
        }

        return (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger>
                {targetInfo.link ? (
                  <Link to={targetInfo.link} className="font-mono text-xs font-medium text-primary hover:underline">
                    {targetInfo.name}
                  </Link>
                ) : (
                  <span className="font-mono text-xs text-muted-foreground">{targetInfo.name}</span>
                )}
              </TooltipTrigger>
              <TooltipContent align="start">
                <p>View details for {targetInfo.name}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )
      }
    }
  ]

  const tableData = roles.map((r, i) => ({
    ...r,
    id: `${r.roleName}-${r.scope.type}-${i}`
  }))

  const headerAction = user ? (
    <>
      <button
        onClick={() => setDialogOpen(true)}
        className="rounded-md border border-border/50 bg-background px-3 py-1.5 text-sm font-medium text-foreground transition-colors hover:bg-muted/50"
      >
        Manage Roles
      </button>
      <ManageUserRolesDialog
        user={user}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSuccess={() => onRolesChange?.()}
      />
    </>
  ) : undefined

  return (
    <DataTable
      title="Assigned Roles"
      columns={columns}
      data={tableData}
      loading={loading}
      total={roles.length}
      page={0}
      rowsPerPage={100}
      onPageChange={() => {
        /* no-op */
      }}
      onRowsPerPageChange={() => {
        /* no-op */
      }}
      headerAction={headerAction}
    />
  )
}
