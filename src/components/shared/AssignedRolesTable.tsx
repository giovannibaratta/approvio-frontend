import React, {useEffect, useState} from "react"
import {DataTable, type Column} from "../DataTable"
import {resolveResources} from "../../services/api"
import {isRight} from "fp-ts/Either"
import type {RoleOperationItem, User, ResourceResolveRequest} from "@approvio/api"
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
  const [page, setPage] = useState(0)
  const [rowsPerPage, setRowsPerPage] = useState(10)

  // Resolve scope target names dynamically
  useEffect(() => {
    const resolveNames = async () => {
      if (!roles || roles.length === 0) return

      const initialNames = {...resolvedNames}
      const resourcesToResolve: ResourceResolveRequest["resources"] = []

      roles.forEach(role => {
        const scope = role.scope
        if (scope.type === "group" && scope.groupId && initialNames[scope.groupId] === undefined) {
          resourcesToResolve.push({type: "group", id: scope.groupId})
          // Mark as processing to avoid duplicate requests in the same batch
          initialNames[scope.groupId] = "pending"
        } else if (scope.type === "space" && scope.spaceId && initialNames[scope.spaceId] === undefined) {
          resourcesToResolve.push({type: "space", id: scope.spaceId})
          initialNames[scope.spaceId] = "pending"
        }
      })

      if (resourcesToResolve.length > 0) {
        const res = await resolveResources({resources: resourcesToResolve})
        if (isRight(res)) {
          setResolvedNames(prev => {
            const next = {...prev}
            res.right.resolved.forEach(item => {
              next[item.id] = item.name
            })
            return next
          })
        }
      }
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
    if (scope.type === "workflow_template" && scope.templateName) {
      const templateName = scope.templateName
      return {
        name: templateName,
        link: `/workflow-templates/${templateName}`
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

  const paginatedData = tableData.slice(page * rowsPerPage, (page + 1) * rowsPerPage)

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
      data={paginatedData}
      loading={loading}
      total={roles.length}
      page={page}
      rowsPerPage={rowsPerPage}
      onPageChange={setPage}
      onRowsPerPageChange={(newRowsPerPage) => {
        setRowsPerPage(newRowsPerPage)
        setPage(0)
      }}
      headerAction={headerAction}
    />
  )
}
