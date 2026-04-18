import { type FrontendError } from "../services/api"
import React, {useEffect, useState} from "react"
import {Link as RouterLink} from "react-router-dom"
import { Plus, AlertCircle } from "lucide-react"
import {listSpaces} from "../services/api"
import {useNotification} from "../providers/notification/NotificationContext"
import {handleEither} from "../utils/either"
import type {Space, Pagination, ListSpaces200Response} from "@approvio/api"
import {DataTable, type Column} from "../components/DataTable"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"

const columns: Column<Space>[] = [
  {id: "name", label: "Name", render: space => <span className="font-medium">{space.name}</span>},
  {id: "description", label: "Description", render: space => <span className="text-muted-foreground">{space.description || "No description"}</span>},
  {
    id: "createdAt",
    label: "Created At",
    render: space => <span className="font-mono text-sm text-muted-foreground">{new Date(space.createdAt).toLocaleDateString()}</span>
  }
]

const SpacesPage: React.FC = () => {
  const [spaces, setSpaces] = useState<Space[]>([])
  const [pagination, setPagination] = useState<Pagination | null>(null)
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)
  const [page, setPage] = useState<number>(0)
  const [rowsPerPage, setRowsPerPage] = useState<number>(10)

  const notification = useNotification()

  useEffect(() => {
    const fetchSpaces = async () => {
      setLoading(true)
      setError(null)

      const result = await listSpaces(page + 1, rowsPerPage)

      handleEither(
        result,
        (response: ListSpaces200Response) => {
          setSpaces(response.data)
          setPagination(response.pagination)
        },
        (error: FrontendError) => {
          setError(error.message)
          notification.showError(error.message)
        }
      )

      setLoading(false)
    }

    fetchSpaces()
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

  const headerAction = (
    <Button asChild>
      <RouterLink to="/spaces/new">
        <Plus className="mr-2 size-4" />
        Create Space
      </RouterLink>
    </Button>
  )

  return (
    <div className="space-y-4">
      <DataTable
        title="Spaces"
        columns={columns}
        data={spaces}
        loading={loading}
        total={pagination?.total || 0}
        page={page}
        rowsPerPage={rowsPerPage}
        onPageChange={handleChangePage}
        onRowsPerPageChange={handleChangeRowsPerPage}
        headerAction={headerAction}
      />
    </div>
  )
}

export default SpacesPage
