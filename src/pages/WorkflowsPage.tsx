import React, {useEffect, useState} from "react"
import {Box, Alert, Chip} from "@mui/material"
import {listWorkflows} from "../services/api"
import {useNotification} from "../providers/notification/NotificationContext"
import {handleEither} from "../utils/either"
import type {Workflow, Pagination, ListWorkflows200Response} from "@approvio/api"
import {DataTable, type Column} from "../components/DataTable"

const getStatusColor = (status: string) => {
  switch (status) {
    case "APPROVED": return "success"
    case "REJECTED": return "error"
    case "CANCELED": return "default"
    case "EVALUATION_IN_PROGRESS": return "info"
    case "EXPIRED": return "warning"
    default: return "default"
  }
}

const columns: Column<Workflow>[] = [
  {id: "name", label: "Name", render: (workflow) => workflow.name},
  {
    id: "status",
    label: "Status",
    render: (workflow) => (
      <Chip
        label={workflow.status.replace(/_/g, " ")}
        color={getStatusColor(workflow.status) as any}
        size="small"
      />
    )
  },
  {id: "description", label: "Description", render: (workflow) => workflow.description || "No description"},
  {
    id: "createdAt",
    label: "Created At",
    render: (workflow) => new Date(workflow.createdAt).toLocaleDateString()
  },
]

const WorkflowsPage: React.FC = () => {
  const [workflows, setWorkflows] = useState<Workflow[]>([])
  const [pagination, setPagination] = useState<Pagination | null>(null)
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)
  const [page, setPage] = useState<number>(0)
  const [rowsPerPage, setRowsPerPage] = useState<number>(10)

  const notification = useNotification()

  useEffect(() => {
    const fetchWorkflows = async () => {
      setLoading(true)
      setError(null)

      const result = await listWorkflows(page + 1, rowsPerPage)

      handleEither(
        result,
        (response: ListWorkflows200Response) => {
          setWorkflows(response.data)
          setPagination(response.pagination)
        },
        (errorMessage: string) => {
          setError(errorMessage)
          notification.showError(errorMessage)
        }
      )

      setLoading(false)
    }

    fetchWorkflows()
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
        title="Workflows"
        columns={columns}
        data={workflows}
        loading={loading}
        total={pagination?.total || 0}
        page={page}
        rowsPerPage={rowsPerPage}
        onPageChange={handleChangePage}
        onRowsPerPageChange={handleChangeRowsPerPage}
      />
    </Box>
  )
}

export default WorkflowsPage
