import {type FrontendError} from "../services/api"
import React, {useEffect, useState} from "react"
import {Link as RouterLink, useNavigate} from "react-router-dom"
import {listWorkflowTemplates} from "../services/api"
import {useNotification} from "../providers/notification/NotificationContext"
import {handleEither} from "../utils/either"
import {
  type WorkflowTemplateSummary,
  type Pagination,
  type ListWorkflowTemplates200Response,
  WorkflowTemplateStatus
} from "@approvio/api"
import {DataTable, DataSubTable, type Column} from "../components/DataTable"
import {Button} from "@/components/ui/button"
import {Switch} from "@/components/ui/switch"
import {Label} from "@/components/ui/label"
import {Alert, AlertDescription} from "@/components/ui/alert"
import {Loader2, Plus, AlertCircle} from "lucide-react"
import {Tooltip, TooltipContent, TooltipProvider, TooltipTrigger} from "@/components/ui/tooltip"

/**
 * Shared column configuration used by both the main table and the expanded versions list.
 * Explicit widths are essential to ensure the blended sub-rows align perfectly with the parent headers.
 */
const SHARED_COLUMNS: Column<WorkflowTemplateSummary>[] = [
  {
    id: "name",
    label: "Name",
    width: "30%",
    render: template => (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger>
            <span className="text-left font-medium text-primary hover:underline">
              {template.name}
            </span>
          </TooltipTrigger>
          <TooltipContent align="start">
            <p>Click to view details for {template.name}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    )
  },
  {
    id: "version",
    label: "Version",
    width: "10%",
    render: template => <span className="font-mono text-sm">v{template.version}</span>
  },
  {
    id: "status",
    label: "Status",
    width: "15%",
    render: template => {
      const baseClasses =
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider"
      switch (template.status) {
        case "ACTIVE":
          return (
            <span className={`${baseClasses} border-emerald-500/20 bg-emerald-500/10 text-emerald-600`}>Active</span>
          )
        case "PENDING_DEPRECATION":
          return (
            <span className={`${baseClasses} border-amber-500/20 bg-amber-500/10 text-amber-600`}>Deprecating</span>
          )
        case "DEPRECATED":
          return (
            <span className={`${baseClasses} border-destructive/20 bg-destructive/10 text-destructive`}>
              Deprecated
            </span>
          )
        default:
          return (
            <span className={`${baseClasses} border-border bg-muted/50 text-muted-foreground`}>
              {String(template.status).replace(/_/g, " ")}
            </span>
          )
      }
    }
  },
  {
    id: "description",
    label: "Description",
    width: "30%",
    render: template => (
      <span className="text-sm text-muted-foreground">{template.description || "No description"}</span>
    )
  },
  {
    id: "createdAt",
    label: "Created At",
    width: "20%",
    render: template => (
      <span className="font-mono text-sm text-muted-foreground">
        {new Date(template.createdAt).toLocaleDateString()}
      </span>
    )
  }
]

/**
 * Component rendered when a workflow template row is expanded.
 * Instead of a full DataTable, it renders a minimal Table that blends into the parent
 * to avoid nested headers and borders.
 */
function ExpandedVersionsTable({templateName, currentTemplateId}: {templateName: string; currentTemplateId: string}) {
  const [loading, setLoading] = useState(true)
  const [loadMoreLoading, setLoadMoreLoading] = useState(false)
  const [versions, setVersions] = useState<WorkflowTemplateSummary[]>([])
  const [total, setTotal] = useState(0)
  const [limit, setLimit] = useState(5)
  const [error, setError] = useState<string | null>(null)
  const navigate = useNavigate()

  const fetchVersions = async (currentLimit: number, isInitial: boolean) => {
    if (isInitial) setLoading(true)
    else setLoadMoreLoading(true)

    const result = await listWorkflowTemplates({
      search: templateName,
      searchMode: "EXACT",
      status: ["ACTIVE", "PENDING_DEPRECATION", "DEPRECATED"],
      limit: currentLimit
    })

    handleEither(
      result,
      res => {
        setVersions(res.data.filter(t => t.id !== currentTemplateId))
        setTotal(res.pagination.total)
      },
      err => {
        setError(err.message)
      }
    )

    if (isInitial) setLoading(false)
    else setLoadMoreLoading(false)
  }

  useEffect(() => {
    fetchVersions(limit, true)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [templateName, currentTemplateId])

  const handleShowMore = () => {
    const newLimit = limit + 5
    setLimit(newLimit)
    fetchVersions(newLimit, false)
  }

  if (loading) {
    return (
      <div className="flex justify-center p-4">
        <Loader2 className="size-5 animate-spin text-muted-foreground" />
      </div>
    )
  }
  if (error) {
    return (
      <div className="p-2">
        <Alert variant="destructive" className="px-3 py-2">
          <AlertCircle className="size-4" />
          <AlertDescription className="text-xs">{error}</AlertDescription>
        </Alert>
      </div>
    )
  }

  const hasMore = versions.length < total - 1

  return (
    <DataSubTable
      columns={SHARED_COLUMNS}
      data={versions}
      hasMore={hasMore}
      loadingMore={loadMoreLoading}
      onShowMore={handleShowMore}
      onRowClick={version => navigate(`/workflow-templates/${version.id}`)}
      noDataMessage="No other versions found."
    />
  )
}

const WorkflowTemplatesPage: React.FC = () => {
  const navigate = useNavigate()

  const [templates, setTemplates] = useState<WorkflowTemplateSummary[]>([])
  const [pagination, setPagination] = useState<Pagination | null>(null)
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)
  const [page, setPage] = useState<number>(0)
  const [rowsPerPage, setRowsPerPage] = useState<number>(10)
  const [showAllVersions, setShowAllVersions] = useState<boolean>(false)

  const notification = useNotification()

  useEffect(() => {
    const fetchTemplates = async () => {
      setLoading(true)
      setError(null)

      const statusFilter = showAllVersions ? undefined : [WorkflowTemplateStatus.Active]
      const result = await listWorkflowTemplates({
        page: page + 1,
        limit: rowsPerPage,
        status: statusFilter
      })

      handleEither(
        result,
        (response: ListWorkflowTemplates200Response) => {
          setTemplates(response.data)
          setPagination(response.pagination)
        },
        (error: FrontendError) => {
          setError(error.message)
          notification.showError(error.message)
        }
      )

      setLoading(false)
    }

    fetchTemplates()
  }, [page, rowsPerPage, showAllVersions, notification])

  const handleChangePage = (newPage: number) => {
    setPage(newPage)
  }

  const handleChangeRowsPerPage = (newRowsPerPage: number) => {
    setRowsPerPage(newRowsPerPage)
    setPage(0)
  }

  if (error) {
    return (
      <Alert variant="destructive" className="m-4">
        <AlertCircle className="size-4" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    )
  }

  const headerAction = (
    <div className="flex items-center gap-6">
      <div className="flex items-center space-x-2">
        <Switch
          id="show-all"
          checked={showAllVersions}
          onCheckedChange={checked => {
            setShowAllVersions(checked)
            setPage(0)
          }}
        />
        <Label
          htmlFor="show-all"
          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
        >
          Show all latest
        </Label>
      </div>
      <Button asChild>
        <RouterLink to="/workflow-templates/new">
          <Plus className="mr-2 size-4" />
          Create Template
        </RouterLink>
      </Button>
    </div>
  )

  return (
    <div className="space-y-4">
      <DataTable
        title="Workflow Templates"
        columns={SHARED_COLUMNS}
        expandableRow={template => (
          <ExpandedVersionsTable templateName={template.name} currentTemplateId={template.id} />
        )}
        disableExpansionPadding
        data={templates}
        loading={loading}
        total={pagination?.total || 0}
        page={page}
        rowsPerPage={rowsPerPage}
        onPageChange={handleChangePage}
        onRowsPerPageChange={handleChangeRowsPerPage}
        headerAction={headerAction}
        onRowClick={template => navigate(`/workflow-templates/${template.id}`)}
      />
    </div>
  )
}

export default WorkflowTemplatesPage
