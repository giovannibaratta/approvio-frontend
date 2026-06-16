import React from "react"
import {Link as RouterLink} from "react-router-dom"
import {DataTable, type Column} from "../DataTable"
import type {
  AuditLog,
  UserRolesAssignedAuditLog,
  UserRolesRemovedAuditLog,
  AgentRolesAssignedAuditLog,
  AgentRolesRemovedAuditLog
} from "@approvio/api"
import {Badge} from "@/components/ui/badge"
import {Button} from "@/components/ui/button"
import {Copy} from "lucide-react"
import {toast} from "sonner"
import {TYPOGRAPHY} from "../../lib/styles"

export interface AuditLogsTableProps {
  title: string
  logs: AuditLog[]
  loading: boolean
  page: number
  rowsPerPage: number
  hasMore: boolean
  onPageChange: (newPage: number) => void
  onRowsPerPageChange: (newRowsPerPage: number) => void
  paginationType?: "page" | "cursor"
}

export const AuditLogsTable: React.FC<AuditLogsTableProps> = ({
  title,
  logs,
  loading,
  page,
  rowsPerPage,
  hasMore,
  onPageChange,
  onRowsPerPageChange,
  paginationType = "cursor"
}) => {
  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text)
    toast.success(`${label} copied to clipboard`)
  }

  const getTarget = (log: AuditLog) => log.target
  const getActor = (log: AuditLog) => log.actor

  const getEntityLink = (type: string, id: string) => {
    switch (type.toLowerCase()) {
      case "user":
        return `/users/${id}`
      case "group":
        return `/groups/${id}`
      case "space":
        return "/spaces"
      case "workflow_template":
        return `/workflow-templates/${id}`
      default:
        return null
    }
  }

  const formatAuditType = (type: string) => {
    return type
      .split("_")
      .map(word => word.charAt(0) + word.slice(1).toLowerCase())
      .join(" ")
  }

  const isRolesAuditLog = (
    log: AuditLog
  ): log is
    | UserRolesAssignedAuditLog
    | UserRolesRemovedAuditLog
    | AgentRolesAssignedAuditLog
    | AgentRolesRemovedAuditLog => {
    return ["USER_ROLES_ASSIGNED", "USER_ROLES_REMOVED", "AGENT_ROLES_ASSIGNED", "AGENT_ROLES_REMOVED"].includes(
      log.auditType
    )
  }

  const renderPayloadDetails = (row: AuditLog) => {
    if (!row.payload) return <p className="p-2 text-sm text-muted-foreground">No additional payload data.</p>

    const hasRoles = isRolesAuditLog(row)

    return (
      <div className="space-y-4 rounded-lg border border-border/40 bg-muted/20 p-4">
        <h4 className="text-sm font-semibold tracking-tight text-foreground">Event Payload Details</h4>

        {hasRoles && (
          <div className="space-y-2">
            <h5 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Affected Roles</h5>
            <div className="overflow-hidden rounded-md border border-border bg-background">
              <table className="w-full border-collapse text-left">
                <thead>
                  <tr className="border-b bg-muted/40 text-xs font-medium text-muted-foreground">
                    <th className="p-2 pl-4">Role Name</th>
                    <th className="p-2">Scope Type</th>
                    <th className="p-2 pr-4">Scope Target</th>
                  </tr>
                </thead>
                <tbody className="divide-y text-sm">
                  {row.payload.roles.map((role, idx: number) => {
                    const scopeType = role.scope.type
                    let targetVal = "-"
                    if (role.scope) {
                      switch (role.scope.type) {
                        case "group":
                          targetVal = role.scope.groupId
                          break
                        case "space":
                          targetVal = role.scope.spaceId
                          break
                        case "workflow_template":
                          targetVal = role.scope.templateName
                          break
                      }
                    }

                    return (
                      <tr key={idx} className="hover:bg-muted/20">
                        <td className="p-2 pl-4 font-medium">{role.roleName}</td>
                        <td className="p-2 capitalize">{scopeType.replace("_", " ")}</td>
                        <td className="p-2 pr-4 font-mono text-xs text-muted-foreground">{targetVal}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        <div className="space-y-2">
          <h5 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Raw Data</h5>
          <pre className="max-h-[300px] select-all overflow-y-auto rounded-lg border border-border/60 bg-muted/60 p-3 font-mono text-xs leading-relaxed text-muted-foreground">
            {JSON.stringify(row.payload, null, 2)}
          </pre>
        </div>
      </div>
    )
  }

  const columns: Column<AuditLog>[] = [
    {
      id: "date",
      label: "Date",
      render: row => (
        <span className={TYPOGRAPHY.MONO_SM_MUTED} title={new Date(row.createdAt).toLocaleString()}>
          {new Date(row.createdAt).toLocaleString()}
        </span>
      ),
      width: "180px"
    },
    {
      id: "auditType",
      label: "Audit Type",
      render: row => (
        <Badge variant="outline" className="font-medium">
          {formatAuditType(row.auditType)}
        </Badge>
      ),
      width: "200px"
    },
    {
      id: "entityType",
      label: "Entity Type",
      render: row => {
        const target = getTarget(row)
        return <span className="capitalize">{target.type.toLowerCase()}</span>
      },
      width: "120px"
    },
    {
      id: "entityId",
      label: "Entity ID",
      render: row => {
        const target = getTarget(row)
        const link = getEntityLink(target.type, target.id)
        return (
          <div className="flex items-center gap-2">
            {link ? (
              <RouterLink
                to={link}
                className="max-w-[120px] truncate font-mono text-sm text-primary hover:underline"
                title={target.id}
              >
                {target.id}
              </RouterLink>
            ) : (
              <span className="max-w-[120px] truncate font-mono text-sm text-muted-foreground" title={target.id}>
                {target.id}
              </span>
            )}
            <Button
              variant="ghost"
              size="icon"
              className="size-6 shrink-0"
              onClick={e => {
                e.stopPropagation()
                handleCopy(target.id, "Entity ID")
              }}
            >
              <Copy className="size-3" />
            </Button>
          </div>
        )
      },
      preventRowClick: true,
      width: "180px"
    },
    {
      id: "actor",
      label: "Actor",
      render: row => {
        const actor = getActor(row)
        const link = getEntityLink(actor.type, actor.id)
        return (
          <div className="flex flex-col gap-1">
            <span className="text-xs uppercase text-muted-foreground">{actor.type}</span>
            <div className="flex items-center gap-2">
              {link ? (
                <RouterLink
                  to={link}
                  className="max-w-[100px] truncate font-mono text-xs text-primary hover:underline"
                  title={actor.id}
                >
                  {actor.id}
                </RouterLink>
              ) : (
                <span className="max-w-[100px] truncate font-mono text-xs text-muted-foreground" title={actor.id}>
                  {actor.id}
                </span>
              )}
              <Button
                variant="ghost"
                size="icon"
                className="size-5 shrink-0"
                onClick={e => {
                  e.stopPropagation()
                  handleCopy(actor.id, "Actor ID")
                }}
              >
                <Copy className="size-3" />
              </Button>
            </div>
          </div>
        )
      },
      preventRowClick: true,
      width: "180px"
    }
  ]

  return (
    <DataTable
      title={title}
      columns={columns}
      data={logs}
      loading={loading}
      page={page}
      rowsPerPage={rowsPerPage}
      paginationType={paginationType}
      hasMore={hasMore}
      onPageChange={onPageChange}
      onRowsPerPageChange={onRowsPerPageChange}
      expandableRow={renderPayloadDetails}
    />
  )
}
