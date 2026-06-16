import React, {useState} from "react"
import {Table, TableBody, TableCell, TableHead, TableHeader, TableRow} from "@/components/ui/table"
import {Card, CardHeader, CardTitle, CardContent} from "@/components/ui/card"
import {Button} from "@/components/ui/button"
import {ChevronDown, ChevronRight, CornerDownRight, Loader2} from "lucide-react"
import {cn} from "@/lib/utils"
import {LAYOUT, TYPOGRAPHY} from "@/lib/styles"
import {PaginationUI} from "./common/PaginationUI"

export interface Column<T> {
  id: string
  label: string
  render: (row: T) => React.ReactNode
  /** Optional fixed width for the column (e.g., '30%' or 150). Alignment works best when all columns have widths. */
  width?: string | number
  /**
   * If provided, clicking this cell runs this handler and stops propagation,
   * bypassing the table-level onRowClick. Fully handles keyboard and screen reader accessibility.
   */
  onCellClick?: (row: T) => void
  /**
   * If true, clicking this cell will stop propagation and prevent the row-level onRowClick.
   * Useful for cells containing tooltips, badges, or copy buttons where row navigation is undesirable.
   */
  preventRowClick?: boolean
}

export interface DataTableProps<T> {
  title: string
  columns: Column<T>[]
  data: T[]
  loading: boolean
  total?: number
  page: number
  rowsPerPage: number
  onPageChange: (newPage: number) => void
  onRowsPerPageChange: (newRowsPerPage: number) => void
  paginationType?: "page" | "cursor"
  hasMore?: boolean
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
  onRowClick?: (row: T) => void
  /** Optional class name to style or override table elements */
  tableClassName?: string
  /** Optional minimum width for the table (e.g. '800px'). Defaults to '800px' to prevent overlap. */
  minWidth?: string
}

/**
 * Internal component that manages the expansion state and rendering of a single row.
 */
function ExpandableRow<T extends {id: string}>({
  row,
  columns,
  actions,
  expandableRow,
  disableExpansionPadding,
  onRowClick
}: {
  row: T
  columns: Column<T>[]
  actions?: (row: T) => React.ReactNode
  expandableRow?: (row: T) => React.ReactNode
  disableExpansionPadding?: boolean
  onRowClick?: (row: T) => void
}) {
  const [open, setOpen] = useState(false)
  const isExpandable = !!expandableRow

  return (
    <React.Fragment>
      <TableRow
        className={cn(isExpandable ? "border-b-0" : "", onRowClick ? "cursor-pointer hover:bg-muted/50" : "")}
        onClick={() => onRowClick?.(row)}
        role={onRowClick ? "button" : undefined}
        tabIndex={onRowClick ? 0 : undefined}
        onKeyDown={e => {
          if (onRowClick && (e.key === "Enter" || e.key === " ")) {
            // Prevent default page scrolling when pressing Spacebar on interactive rows
            e.preventDefault()
            onRowClick(row)
          }
        }}
      >
        {isExpandable && (
          // Stop propagation to prevent expanding the row from triggering the general onRowClick callback
          <TableCell className="w-[44px] whitespace-nowrap pr-0" onClick={e => e.stopPropagation()}>
            <button
              aria-label="expand row"
              onClick={() => setOpen(!open)}
              type="button"
              className="rounded-md p-1 transition-colors hover:bg-muted"
            >
              {open ? <ChevronDown className="size-4" /> : <ChevronRight className="size-4" />}
            </button>
          </TableCell>
        )}
        {columns.map(column => (
          <TableCell
            key={column.id}
            style={{width: column.width}}
            className={cn(column.onCellClick ? "cursor-pointer" : "")}
            onClick={e => {
              // Stop propagation to prevent cell-specific overrides from bubbling up and triggering the general onRowClick
              if (column.preventRowClick || column.onCellClick) {
                e.stopPropagation()
              }
              column.onCellClick?.(row)
            }}
            role={column.onCellClick ? "button" : undefined}
            tabIndex={column.onCellClick ? 0 : undefined}
            onKeyDown={e => {
              if (column.onCellClick && (e.key === "Enter" || e.key === " ")) {
                // Prevent default scrolling and stop bubbling to the parent TableRow keydown handler
                e.preventDefault()
                e.stopPropagation()
                column.onCellClick(row)
              }
            }}
          >
            {column.render(row)}
          </TableCell>
        ))}
        {actions && (
          // Stop propagation on clicks and keypresses to prevent custom row actions (e.g. edit/delete buttons) from triggering the row click
          <TableCell
            className="whitespace-nowrap text-right"
            onClick={e => e.stopPropagation()}
            onKeyDown={e => e.stopPropagation()}
          >
            {actions(row)}
          </TableCell>
        )}
      </TableRow>
      {isExpandable && open && (
        <TableRow className="bg-muted/30 hover:bg-muted/30">
          <TableCell
            colSpan={columns.length + (actions ? 2 : 1)}
            className={`p-0 ${disableExpansionPadding ? "" : "px-4 pb-4"}`}
          >
            <div className={disableExpansionPadding ? "" : "mt-2"}>{expandableRow!(row)}</div>
          </TableCell>
        </TableRow>
      )}
    </React.Fragment>
  )
}

export function DataTable<T extends {id: string}>({
  title,
  columns,
  data,
  loading,
  total,
  page,
  rowsPerPage,
  onPageChange,
  onRowsPerPageChange,
  paginationType = "page",
  hasMore = false,
  actions,
  headerAction,
  expandableRow,
  disableExpansionPadding,
  onRowClick,
  tableClassName,
  minWidth = "800px"
}: DataTableProps<T>) {
  return (
    <Card className="w-full">
      <CardHeader className={cn(LAYOUT.FLEX_BETWEEN, "flex-row pb-4")}>
        <CardTitle className={TYPOGRAPHY.TITLE}>{title}</CardTitle>
        {headerAction && <div>{headerAction}</div>}
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex justify-center p-8">
            <Loader2 className="size-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="rounded-md border">
            <Table style={{tableLayout: "auto", width: `max(100%, ${minWidth})`, minWidth}} className={tableClassName}>
              <TableHeader>
                <TableRow className="bg-muted/50 hover:bg-muted/50">
                  {expandableRow && <TableHead className="w-[44px] pr-0" />}
                  {columns.map(column => (
                    <TableHead key={column.id} className="font-semibold text-foreground" style={{width: column.width}}>
                      {column.label}
                    </TableHead>
                  ))}
                  {actions && (
                    <TableHead className="whitespace-nowrap text-right font-semibold text-foreground">
                      Actions
                    </TableHead>
                  )}
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.map(row => (
                  <ExpandableRow
                    key={row.id}
                    row={row}
                    columns={columns}
                    actions={actions}
                    expandableRow={expandableRow}
                    disableExpansionPadding={disableExpansionPadding}
                    onRowClick={onRowClick}
                  />
                ))}
                {data.length === 0 && (
                  <TableRow>
                    <TableCell
                      colSpan={columns.length + (actions ? 1 : 0) + (expandableRow ? 1 : 0)}
                      className="h-24 text-center"
                    >
                      <p className={TYPOGRAPHY.DESCRIPTION_SM}>No data available</p>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        )}

        {(paginationType === "cursor" || (total !== undefined && total > 0)) && (
          <PaginationUI
            total={total}
            page={page}
            rowsPerPage={rowsPerPage}
            onPageChange={onPageChange}
            onRowsPerPageChange={onRowsPerPageChange}
            paginationType={paginationType}
            hasMore={hasMore}
          />
        )}
      </CardContent>
    </Card>
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
export function DataSubTable<T extends {id: string}>({
  columns,
  data,
  hasMore,
  loadingMore,
  onShowMore,
  onRowClick,
  noDataMessage = "No other versions found."
}: DataSubTableProps<T>) {
  return (
    <div className="border-t border-border bg-muted/10">
      {data.length === 0 ? (
        <p className="p-4 text-sm text-muted-foreground">{noDataMessage}</p>
      ) : (
        <>
          <Table style={{tableLayout: "fixed"}}>
            <TableBody>
              {data.map(row => (
                <TableRow
                  key={row.id}
                  className={cn("border-b-0", onRowClick ? "cursor-pointer hover:bg-muted/50" : "")}
                  onClick={() => onRowClick?.(row)}
                  role={onRowClick ? "button" : undefined}
                  tabIndex={onRowClick ? 0 : undefined}
                  onKeyDown={e => {
                    if (onRowClick && (e.key === "Enter" || e.key === " ")) {
                      // Prevent default page scrolling when pressing Spacebar on interactive sub-rows
                      e.preventDefault()
                      onRowClick(row)
                    }
                  }}
                >
                  {/* Stop propagation to align spacer area and prevent row-click conflicts */}
                  <TableCell className="w-[44px] pr-0" onClick={e => e.stopPropagation()} />{" "}
                  {/* Toggle spacer for alignment */}
                  {columns.map(column => (
                    <TableCell
                      key={column.id}
                      style={{width: column.width}}
                      className={cn("py-3", column.onCellClick ? "cursor-pointer" : "")}
                      onClick={e => {
                        // Stop propagation to prevent cell-specific overrides from bubbling up and triggering the general onRowClick
                        if (column.preventRowClick || column.onCellClick) {
                          e.stopPropagation()
                        }
                        column.onCellClick?.(row)
                      }}
                      role={column.onCellClick ? "button" : undefined}
                      tabIndex={column.onCellClick ? 0 : undefined}
                      onKeyDown={e => {
                        if (column.onCellClick && (e.key === "Enter" || e.key === " ")) {
                          // Prevent default scrolling and stop bubbling to the parent TableRow keydown handler
                          e.preventDefault()
                          e.stopPropagation()
                          column.onCellClick(row)
                        }
                      }}
                    >
                      <div className="flex items-center">
                        {column.id === columns[0]?.id && (
                          <CornerDownRight className="mr-2 size-4 text-muted-foreground/50" />
                        )}
                        <div className="w-full">{column.render(row)}</div>
                      </div>
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {hasMore && (
            <div className="flex justify-center border-t border-border/50 py-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={e => {
                  // Prevent button click from bubbling up and triggering parent row-click
                  e.stopPropagation()
                  onShowMore()
                }}
                disabled={loadingMore}
                className="text-xs text-muted-foreground hover:text-foreground"
              >
                {loadingMore && <Loader2 className="mr-2 size-3 animate-spin" />}
                {loadingMore ? "Loading..." : "Show more versions"}
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
