import React from "react"
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Paper,
  CircularProgress,
  Box,
  Typography,
} from "@mui/material"

export interface Column<T> {
  id: string
  label: string
  render: (row: T) => React.ReactNode
}

export interface DataTableProps<T> {
  title: string
  columns: Column<T>[]
  data: T[]
  loading: boolean
  total: number
  page: number
  rowsPerPage: number
  onPageChange: (newPage: number) => void
  onRowsPerPageChange: (newRowsPerPage: number) => void
  actions?: (row: T) => React.ReactNode
}

export function DataTable<T extends { id: string }>({
  title,
  columns,
  data,
  loading,
  total,
  page,
  rowsPerPage,
  onPageChange,
  onRowsPerPageChange,
  actions,
}: DataTableProps<T>) {
  const handleChangePage = (_event: unknown, newPage: number) => {
    onPageChange(newPage)
  }

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    onRowsPerPageChange(parseInt(event.target.value, 10))
  }

  return (
    <Paper sx={{ m: 2, p: 2, borderRadius: 2, boxShadow: 3 }}>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
        <Typography variant="h5" component="h1" fontWeight="bold">
          {title}
        </Typography>
      </Box>

      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", p: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
        <TableContainer>
          <Table stickyHeader aria-label={`${title} table`}>
            <TableHead>
              <TableRow>
                {columns.map((column) => (
                  <TableCell key={column.id} sx={{ fontWeight: "bold", bgcolor: "background.default" }}>
                    {column.label}
                  </TableCell>
                ))}
                {actions && (
                  <TableCell align="right" sx={{ fontWeight: "bold", bgcolor: "background.default" }}>
                    Actions
                  </TableCell>
                )}
              </TableRow>
            </TableHead>
            <TableBody>
              {data.map((row) => (
                <TableRow hover key={row.id} sx={{ "&:last-child td, &:last-child th": { border: 0 } }}>
                  {columns.map((column) => (
                    <TableCell key={column.id}>{column.render(row)}</TableCell>
                  ))}
                  {actions && <TableCell align="right">{actions(row)}</TableCell>}
                </TableRow>
              ))}
              {data.length === 0 && (
                <TableRow>
                  <TableCell colSpan={columns.length + (actions ? 1 : 0)} align="center" sx={{ py: 3 }}>
                    <Typography color="text.secondary">No data available</Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {total > 0 && (
        <TablePagination
          rowsPerPageOptions={[5, 10, 25]}
          component="div"
          count={total}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      )}
    </Paper>
  )
}
