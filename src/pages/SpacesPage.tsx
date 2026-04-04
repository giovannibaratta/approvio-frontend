import React, {useEffect, useState} from "react"
import {Box, Alert, Button} from "@mui/material"
import {Link as RouterLink} from "react-router-dom"
import AddIcon from "@mui/icons-material/Add"
import {listSpaces} from "../services/api"
import {useNotification} from "../providers/notification/NotificationContext"
import {handleEither} from "../utils/either"
import type {Space, Pagination, ListSpaces200Response} from "@approvio/api"
import {DataTable, type Column} from "../components/DataTable"

const columns: Column<Space>[] = [
  {id: "name", label: "Name", render: space => space.name},
  {id: "description", label: "Description", render: space => space.description || "No description"},
  {
    id: "createdAt",
    label: "Created At",
    render: space => new Date(space.createdAt).toLocaleDateString()
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
        (errorMessage: string) => {
          setError(errorMessage)
          notification.showError(errorMessage)
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
      <Alert severity="error" sx={{m: 2}}>
        {error}
      </Alert>
    )
  }

  return (
    <Box>
      <Box sx={{display: "flex", justifyContent: "flex-end", m: 2, mb: 0}}>
        <Button variant="contained" component={RouterLink} to="/spaces/new" startIcon={<AddIcon />}>
          Create Space
        </Button>
      </Box>
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
      />
    </Box>
  )
}

export default SpacesPage
