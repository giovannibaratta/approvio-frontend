import {type FrontendError} from "../services/api"
import React, {useEffect, useState} from "react"
import {listWorkflows} from "../services/api"
import {useNotification} from "../providers/notification/NotificationContext"
import {handleEither} from "../utils/either"
import type {Workflow, Pagination, ListWorkflows200Response} from "@approvio/api"
import {DataTable, type Column} from "../components/DataTable"
import {Alert, AlertDescription} from "@/components/ui/alert"
import {AlertCircle} from "lucide-react"
import {StatusBadge} from "../components/common/StatusBadge"
import {LAYOUT, TYPOGRAPHY} from "@/lib/styles"
import {Button} from "@/components/ui/button"
import {Plus} from "lucide-react"
import {useNavigate} from "react-router-dom"
import {cn} from "@/lib/utils"

const WorkflowsPage: React.FC = () => {
  const [workflows, setWorkflows] = useState<Workflow[]>([])
  const [pagination, setPagination] = useState<Pagination | null>(null)
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)
  const [page, setPage] = useState<number>(0)
  const [rowsPerPage, setRowsPerPage] = useState<number>(10)

  const notification = useNotification()
  const navigate = useNavigate()

  const columns: Column<Workflow>[] = [
    {
      id: "name",
      label: "Name",
      onCellClick: workflow => navigate(`/workflows/${workflow.id}`),
      render: workflow => (
        <span className={cn(TYPOGRAPHY.LABEL, "font-medium text-primary hover:underline")}>{workflow.name}</span>
      )
    },
    {
      id: "status",
      label: "Status",
      render: workflow => <StatusBadge status={workflow.status as any} />
    },
    {
      id: "description",
      label: "Description",
      render: workflow => <span className={TYPOGRAPHY.DESCRIPTION_SM}>{workflow.description || "No description"}</span>
    },
    {
      id: "createdAt",
      label: "Created At",
      render: workflow => (
        <span className={TYPOGRAPHY.MONO_SM_MUTED}>{new Date(workflow.createdAt).toLocaleDateString()}</span>
      )
    }
  ]

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
        (error: FrontendError) => {
          setError(error.message)
          notification.showError(error.message)
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
      <Alert variant="destructive" className="m-4">
        <AlertCircle className="size-4" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    )
  }

  return (
    <div className={LAYOUT.SECTION_SPACING}>
      <DataTable
        title="Workflows"
        headerAction={
          <Button onClick={() => navigate("/workflows/new")}>
            <Plus className="mr-2 size-4" /> Create Workflow
          </Button>
        }
        columns={columns}
        data={workflows}
        loading={loading}
        total={pagination?.total || 0}
        page={page}
        rowsPerPage={rowsPerPage}
        onPageChange={handleChangePage}
        onRowsPerPageChange={handleChangeRowsPerPage}
      />
    </div>
  )
}

export default WorkflowsPage
