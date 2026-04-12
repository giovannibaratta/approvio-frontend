import React, { useState } from "react"
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
  IconButton,
  Collapse,
  Button
} from "@mui/material"
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown"
import KeyboardArrowRightIcon from "@mui/icons-material/KeyboardArrowRight"
import SubdirectoryArrowRightIcon from "@mui/icons-material/SubdirectoryArrowRight"

export interface Column<T> {
  id: string
  label: string
  render: (row: T) => React.ReactNode
  /** Optional fixed width for the column (e.g., '30%' or 150). Alignment works best when all columns have widths. */
  width?: string | number
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
  headerAction?: React.ReactNode
  /**
   * Function to render the content of an expanded row.
   * If provided, an expansion toggle will appear for each row.
   */
  expandableRow?: (row: T) => React.ReactNode
  /**
   * If true, removes the margin and padding from the expanded row container.
   * Useful for creating a "blended" look where the expanded content appears as a seamless extension of the parent row.
   */
  disableExpansionPadding?: boolean
}

/**
 * Internal component that manages the expansion state and rendering of a single row.
 */
function ExpandableRow<T extends { id: string }>({
  row,
  columns,
  actions,
  expandableRow,
  disableExpansionPadding,
}: {
  row: T
  columns: Column<T>[]
  actions?: (row: T) => React.ReactNode
  expandableRow?: (row: T) => React.ReactNode
  disableExpansionPadding?: boolean
}) {
  const [open, setOpen] = useState(false)
  const isExpandable = !!expandableRow

  return (
    <React.Fragment>
      <TableRow hover sx={isExpandable ? { "& > *": { borderBottom: "unset" } } : { "&:last-child td, &:last-child th": { border: 0 } }}>
        {isExpandable && (
          <TableCell sx={{width: 44, whiteSpace: "nowrap", pr: 0}}>
            <IconButton aria-label="expand row" size="small" onClick={() => setOpen(!open)} type="button">
              {open ? <KeyboardArrowDownIcon /> : <KeyboardArrowRightIcon />}
            </IconButton>
          </TableCell>
        )}
        {columns.map((column) => (
          <TableCell key={column.id} sx={{width: column.width}}>{column.render(row)}</TableCell>
        ))}
        {actions && <TableCell align="right" sx={{width: 0, whiteSpace: "nowrap"}}>{actions(row)}</TableCell>}
      </TableRow>
      {isExpandable && (
        <TableRow sx={{bgcolor: disableExpansionPadding ? "inherit" : "inherit"}}>
          <TableCell
            style={{ paddingBottom: 0, paddingTop: 0, borderBottom: disableExpansionPadding ? "unset" : undefined }}
            colSpan={columns.length + (actions ? 2 : 1)}
            sx={{px: disableExpansionPadding ? 0 : 2}}
          >
            <Collapse in={open} timeout="auto" unmountOnExit>
              <Box sx={{ margin: disableExpansionPadding ? 0 : 1 }}>
                {expandableRow!(row)}
              </Box>
            </Collapse>
          </TableCell>
        </TableRow>
      )}
    </React.Fragment>
  )
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
  headerAction,
  expandableRow,
  disableExpansionPadding,
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
        {headerAction && <Box>{headerAction}</Box>}
      </Box>

      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", p: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
        <TableContainer>
          <Table stickyHeader aria-label={`${title} table`} sx={{tableLayout: "fixed"}}>
            <TableHead>
              <TableRow>
                {expandableRow && <TableCell sx={{bgcolor: "background.default", width: 44, pr: 0}} />}
                {columns.map((column) => (
                  <TableCell
                    key={column.id}
                    sx={{ fontWeight: "bold", bgcolor: "background.default", width: column.width }}
                  >
                    {column.label}
                  </TableCell>
                ))}
                {actions && (
                  <TableCell align="right" sx={{ fontWeight: "bold", bgcolor: "background.default", width: 0, whiteSpace: "nowrap" }}>
                    Actions
                  </TableCell>
                )}
              </TableRow>
            </TableHead>
            <TableBody>
              {data.map((row) => (
                <ExpandableRow
                  key={row.id}
                  row={row}
                  columns={columns}
                  actions={actions}
                  expandableRow={expandableRow}
                  disableExpansionPadding={disableExpansionPadding}
                />
              ))}
              {data.length === 0 && (
                <TableRow>
                  <TableCell colSpan={columns.length + (actions ? 1 : 0) + (expandableRow ? 1 : 0)} align="center" sx={{ py: 3 }}>
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

export interface DataSubTableProps<T> {
  columns: Column<T>[]
  data: T[]
  hasMore: boolean
  loadingMore: boolean
  onShowMore: () => void
  onRowClick?: (row: T) => void
  noDataMessage?: string
}

/**
 * A specialized sub-table designed to be rendered within ExpandableRow.
 * It renders rows that perfectly align with the parent table's columns and
 * includes visual indentation.
 */
export function DataSubTable<T extends { id: string }>({
  columns,
  data,
  hasMore,
  loadingMore,
  onShowMore,
  onRowClick,
  noDataMessage = "No other versions found."
}: DataSubTableProps<T>) {
  return (
    <Box sx={{backgroundColor: "action.hover", borderTop: "1px solid", borderColor: "divider"}}>
      {data.length === 0 ? (
        <Typography variant="body2" sx={{p: 2, color: "text.secondary"}}>
          {noDataMessage}
        </Typography>
      ) : (
        <>
          <Table size="small" sx={{tableLayout: "fixed"}}>
            <TableBody>
              {data.map((row) => (
                <TableRow key={row.id} hover sx={{ "& > *": { borderBottom: "unset" } }}>
                  <TableCell sx={{width: 44, pr: 0}} /> {/* Toggle spacer for alignment */}
                  {columns.map((column) => (
                    <TableCell key={column.id} sx={{width: column.width, py: 1.5}}>
                      <Box sx={{display: "flex", alignItems: "center"}}>
                        {column.id === columns[0]?.id && (
                          <SubdirectoryArrowRightIcon sx={{fontSize: 18, mr: 1, color: "text.disabled"}} />
                        )}
                        <Box
                          onClick={() => onRowClick?.(row)}
                          sx={{cursor: onRowClick ? "pointer" : "default", width: "100%"}}
                        >
                          {column.render(row)}
                        </Box>
                      </Box>
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {hasMore && (
            <Box sx={{display: "flex", justifyContent: "center", py: 1}}>
              <Button
                size="small"
                variant="text"
                onClick={onShowMore}
                disabled={loadingMore}
                startIcon={loadingMore ? <CircularProgress size={14} /> : null}
                sx={{fontSize: "0.75rem", textTransform: "none"}}
              >
                {loadingMore ? "Loading..." : "Show more versions"}
              </Button>
            </Box>
          )}
        </>
      )}
    </Box>
  )
}
