import React, {useEffect, useState} from "react"
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  CircularProgress,
  Alert,
  Button
} from "@mui/material"
import {Link as RouterLink, useNavigate} from "react-router-dom"
import {listGroups} from "../services/api"
import {useNotification} from "../providers/notification/NotificationContext"
import {handleEither} from "../utils/either"
import AddIcon from "@mui/icons-material/Add"
import Tooltip from "@mui/material/Tooltip"
import type {Group, ListGroups200Response, Pagination} from "@approvio/api"

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
        (errorMessage: string) => {
          setError(errorMessage)
          notification.showError(errorMessage)
        }
      )

      setLoading(false)
    }

    fetchGroups()
  }, [page, rowsPerPage, notification])

  const handleChangePage = (_event: unknown, newPage: number) => {
    setPage(newPage)
  }

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10))
    setPage(0) // Reset to first page
  }

  if (loading) {
    return (
      <Box sx={{display: "flex", justifyContent: "center", alignItems: "center", height: "80vh"}}>
        <CircularProgress />
      </Box>
    )
  }

  if (error) {
    return (
      <Alert severity="error" sx={{m: 2}}>
        {error}
      </Alert>
    )
  }

  return (
    <Paper sx={{m: 2, p: 2}}>
      <Box sx={{display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2}}>
        <Typography variant="h4" component="h1">
          Groups
        </Typography>
        <Button variant="contained" component={RouterLink} to="/groups/create" startIcon={<AddIcon />}>
          Create Group
        </Button>
      </Box>
      <TableContainer>
        <Table stickyHeader aria-label="groups table">
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Description</TableCell>
              <TableCell align="center">Entity Count</TableCell>
              <TableCell align="center">Created At</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {groups &&
              groups.map(group => (
                <TableRow
                  hover
                  key={group.id}
                  onClick={() => navigate(`/groups/${group.id}`)}
                  sx={{cursor: "pointer"}}
                >
                  <TableCell>
                    <Tooltip title={`Click to view details for ${group.name}`} placement="top-start">
                      <Typography variant="body2" sx={{fontWeight: "medium", color: "primary.main"}}>
                        {group.name}
                      </Typography>
                    </Tooltip>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" color="text.secondary">
                      {group.description || "No description"}
                    </Typography>
                  </TableCell>
                  <TableCell align="center">
                    <Typography variant="body2">{group.entitiesCount}</Typography>
                  </TableCell>
                  <TableCell align="center">
                    <Tooltip title={new Date(group.createdAt).toLocaleString()} placement="top">
                      <Typography variant="body2" color="text.secondary">
                        {new Date(group.createdAt).toLocaleDateString()}
                      </Typography>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}
          </TableBody>
        </Table>
      </TableContainer>
      {pagination && (
        <TablePagination
          rowsPerPageOptions={[5, 10, 25]}
          component="div"
          count={pagination.total}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      )}
    </Paper>
  )
}

export default GroupsPage
