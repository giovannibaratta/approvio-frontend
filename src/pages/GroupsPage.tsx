import { type FrontendError } from "../services/api"
import React, {useEffect, useState} from "react"
import {Box, Typography, Alert, Button} from "@mui/material"
import {Link as RouterLink, useNavigate} from "react-router-dom"
import {listGroups} from "../services/api"
import {useNotification} from "../providers/notification/NotificationContext"
import {handleEither} from "../utils/either"
import AddIcon from "@mui/icons-material/Add"
import Tooltip from "@mui/material/Tooltip"
import type {Group, ListGroups200Response, Pagination} from "@approvio/api"
import {DataTable, type Column} from "../components/DataTable"

const GroupsPage: React.FC = () => {
  const [groups, setGroups] = useState<Group[]>([])
  const [pagination, setPagination] = useState<Pagination | null>(null)
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)
  const [page, setPage] = useState<number>(0) // MUI TablePagination is 0-indexed
  const [rowsPerPage, setRowsPerPage] = useState<number>(10)

  const navigate = useNavigate()
  const notification = useNotification()

  useEffect(() => {
    const fetchGroups = async () => {
      setLoading(true)
      setError(null)

      const result = await listGroups(page + 1, rowsPerPage)

      handleEither(
        result,
        (response: ListGroups200Response) => {
          setGroups(response.groups)
          setPagination(response.pagination)
        },
        (error: FrontendError) => {
          setError(error.message)
          notification.showError(error.message)
        }
      )

      setLoading(false)
    }

    fetchGroups()
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

  const columns: Column<Group>[] = [
    {
      id: "name",
      label: "Name",
      render: group => (
        <Tooltip title={`Click to view details for ${group.name}`} placement="top-start">
          <Typography
            variant="body2"
            sx={{fontWeight: "medium", color: "primary.main", cursor: "pointer"}}
            onClick={() => navigate(`/groups/${group.id}`)}
          >
            {group.name}
          </Typography>
        </Tooltip>
      )
    },
    {
      id: "description",
      label: "Description",
      render: group => (
        <Typography variant="body2" color="text.secondary">
          {group.description || "No description"}
        </Typography>
      )
    },
    {
      id: "entitiesCount",
      label: "Entity Count",
      render: group => <Typography variant="body2">{group.entitiesCount}</Typography>
    },
    {
      id: "createdAt",
      label: "Created At",
      render: group => (
        <Tooltip title={new Date(group.createdAt).toLocaleString()} placement="top">
          <Typography variant="body2" color="text.secondary">
            {new Date(group.createdAt).toLocaleDateString()}
          </Typography>
        </Tooltip>
      )
    }
  ]

  return (
    <Box>
      <Box sx={{display: "flex", justifyContent: "flex-end", m: 2, mb: 0}}>
        <Button variant="contained" component={RouterLink} to="/groups/new" startIcon={<AddIcon />}>
          Create Group
        </Button>
      </Box>
      <DataTable
        title="Groups"
        columns={columns}
        data={groups}
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

export default GroupsPage
