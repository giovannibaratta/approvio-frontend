import React, {useEffect, useState} from "react"
import {Box, Alert, Button} from "@mui/material"
import {Link as RouterLink} from "react-router-dom"
import {listWorkflowTemplates} from "../services/api"
import {useNotification} from "../providers/notification/NotificationContext"
import {handleEither} from "../utils/either"
import type {WorkflowTemplateSummary, Pagination, ListWorkflowTemplates200Response} from "@approvio/api"
import {DataTable, type Column} from "../components/DataTable"

const columns: Column<WorkflowTemplateSummary>[] = [
  {id: "name", label: "Name", render: (template) => template.name},
  {id: "version", label: "Version", render: (template) => template.version},
  {id: "description", label: "Description", render: (template) => template.description || "No description"},
  {
    id: "createdAt",
    label: "Created At",
    render: (template) => new Date(template.createdAt).toLocaleDateString()
  },
]

const WorkflowTemplatesPage: React.FC = () => {
  const [templates, setTemplates] = useState<WorkflowTemplateSummary[]>([])
  const [pagination, setPagination] = useState<Pagination | null>(null)
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)
  const [page, setPage] = useState<number>(0)
  const [rowsPerPage, setRowsPerPage] = useState<number>(10)

  const notification = useNotification()

  useEffect(() => {
    const fetchTemplates = async () => {
      setLoading(true)
      setError(null)

      const result = await listWorkflowTemplates(page + 1, rowsPerPage)

      handleEither(
        result,
        (response: ListWorkflowTemplates200Response) => {
          setTemplates(response.data)
          setPagination(response.pagination)
        },
        (errorMessage: string) => {
          setError(errorMessage)
          notification.showError(errorMessage)
        }
      )

      setLoading(false)
    }

    fetchTemplates()
  }, [page, rowsPerPage, notification])

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
      <DataTable
        title="Workflow Templates"
        columns={columns}
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
