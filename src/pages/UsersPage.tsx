import {type FrontendError} from "../services/api"
import React, {useEffect, useState} from "react"
import {useNavigate} from "react-router-dom"
import {Alert, AlertDescription} from "@/components/ui/alert"
import {AlertCircle} from "lucide-react"
import {listUsers} from "../services/api"
import {useNotification} from "../providers/notification/NotificationContext"
import {handleEither} from "../utils/either"
import type {ListUsers200Response, Pagination, UserSummary} from "@approvio/api"
import {DataTable, type Column} from "../components/DataTable"
import {LAYOUT, TYPOGRAPHY} from "@/lib/styles"

const columns: Column<UserSummary>[] = [
  {id: "name", label: "Name", render: user => <span className={TYPOGRAPHY.LABEL}>{user.displayName}</span>},
  {id: "email", label: "Email", render: user => <span className={TYPOGRAPHY.MONO_SM_MUTED}>{user.email}</span>}
]

const UsersPage: React.FC = () => {
  const [users, setUsers] = useState<UserSummary[]>([])
  const [pagination, setPagination] = useState<Pagination | null>(null)
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)
  const [page, setPage] = useState<number>(0) // MUI TablePagination is 0-indexed
  const [rowsPerPage, setRowsPerPage] = useState<number>(10)
  const navigate = useNavigate()

  const notification = useNotification()

  useEffect(() => {
    const fetchUsers = async () => {
      setLoading(true)
      setError(null)

      const result = await listUsers({
        page: page + 1,
        limit: rowsPerPage
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
      <Alert variant="destructive" className="m-4">
        <AlertCircle className="size-4" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    )
  }

  return (
    <div className={LAYOUT.SECTION_SPACING}>
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
        onRowClick={row => navigate(`/users/${row.id}`)}
      />
    </div>
  )
}

export default UsersPage
