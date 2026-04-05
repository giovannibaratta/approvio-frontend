import { type FrontendError } from "../services/api"
import React, {useEffect, useState} from "react"
import {Alert} from "@mui/material"
import {listUsers} from "../services/api"
import {useNotification} from "../providers/notification/NotificationContext"
import {handleEither} from "../utils/either"
import type {ListUsers200Response, Pagination, UserSummary} from "@approvio/api"
import {DataTable, type Column} from "../components/DataTable"

const columns: Column<UserSummary>[] = [
  {id: "name", label: "Name", render: (user) => user.displayName},
  {id: "email", label: "Email", render: (user) => user.email},
]

const UsersPage: React.FC = () => {
  const [users, setUsers] = useState<UserSummary[]>([])
  const [pagination, setPagination] = useState<Pagination | null>(null)
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)
  const [page, setPage] = useState<number>(0) // MUI TablePagination is 0-indexed
  const [rowsPerPage, setRowsPerPage] = useState<number>(10)

  const notification = useNotification()

  useEffect(() => {
    const fetchUsers = async () => {
      setLoading(true)
      setError(null)

      const result = await listUsers({
        page: page + 1,
        limit: rowsPerPage,
      })

      handleEither(
        result,
        (response: ListUsers200Response) => {
          setUsers(response.users)
          setPagination(response.pagination)
        },
        (error: FrontendError) => {
          setError(error.message)
          notification.showError(error.message)
        }
      )

      setLoading(false)
    }

    fetchUsers()
  }, [page, rowsPerPage, notification])

  const handleChangePage = (newPage: number) => {
    setPage(newPage)
  }

  const handleChangeRowsPerPage = (newRowsPerPage: number) => {
    setRowsPerPage(newRowsPerPage)
    setPage(0) // Reset to first page
  }

  if (error) {
    return (
      <Alert severity="error" sx={{m: 2}}>
        {error}
      </Alert>
    )
  }

  return (
    <DataTable
      title="Users"
      columns={columns}
      data={users}
      loading={loading}
      total={pagination?.total || 0}
      page={page}
      rowsPerPage={rowsPerPage}
      onPageChange={handleChangePage}
      onRowsPerPageChange={handleChangeRowsPerPage}
    />
  )
}

export default UsersPage
