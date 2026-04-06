import {type FrontendError} from "../services/api"
import React, {useEffect, useState} from "react"
import {Box, Alert, Button, Tooltip, Typography, FormControlLabel, Switch, CircularProgress, Chip} from "@mui/material"
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
      <Tooltip title={`Click to view details for ${template.name}`} placement="top-start">
        <Typography variant="body2" sx={{fontWeight: "medium", color: "primary.main", cursor: "pointer"}}>
          {template.name}
        </Typography>
      </Tooltip>
    )
  },
  {id: "version", label: "Version", width: "10%", render: template => template.version},
  {
    id: "status",
    label: "Status",
    width: "15%",
    render: template => {
      const colorMap: Record<string, "success" | "warning" | "error" | "default"> = {
        ACTIVE: "success",
        PENDING_DEPRECATION: "warning",
        DEPRECATED: "error"
      }
      return (
        <Chip
          label={template.status.replace(/_/g, " ")}
          size="small"
          color={colorMap[template.status] || "default"}
          variant="outlined"
        />
      )
    }
  },
  {id: "description", label: "Description", width: "30%", render: template => template.description || "No description"},
  {
    id: "createdAt",
    label: "Created At",
    width: "20%",
    render: template => new Date(template.createdAt).toLocaleDateString()
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
      <Box sx={{display: "flex", justifyContent: "center", p: 2}}>
        <CircularProgress size={24} />
      </Box>
    )
  }
  if (error) {
    return (
      <Alert severity="error" sx={{m: 1}}>
        {error}
      </Alert>
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
      <Alert severity="error" sx={{m: 2}}>
        {error}
      </Alert>
    )
  }

  return (
    <Box>
      <Box sx={{display: "flex", justifyContent: "flex-end", mr: 2, mt: 2}}>
        <FormControlLabel
          control={
            <Switch
              checked={showAllVersions}
              onChange={e => {
                setShowAllVersions(e.target.checked)
                setPage(0)
              }}
            />
          }
          label="Show all latest templates"
        />
      </Box>
      <DataTable
        title="Workflow Templates"
        columns={SHARED_COLUMNS.map(col =>
          col.id === "name"
            ? {
                ...col,
                render: (template: WorkflowTemplateSummary) => (
                  <Box onClick={() => navigate(`/workflow-templates/${template.id}`)} sx={{cursor: "pointer"}}>
                    {col.render(template)}
                  </Box>
                )
              }
            : col
        )}
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
        headerAction={
          <Button variant="contained" component={RouterLink} to="/workflow-templates/new">
            Create Template
          </Button>
        }
      />
    </Box>
  )
}

export default WorkflowTemplatesPage
