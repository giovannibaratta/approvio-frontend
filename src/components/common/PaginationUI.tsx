import React from "react"
import {Button} from "@/components/ui/button"
import {LAYOUT, TYPOGRAPHY} from "@/lib/styles"

export interface PaginationUIProps {
  total?: number
  page: number
  rowsPerPage: number
  onPageChange: (newPage: number) => void
  onRowsPerPageChange: (newRowsPerPage: number) => void
  rowsPerPageOptions?: number[]
  paginationType?: "page" | "cursor"
  hasMore?: boolean
}

export const PaginationUI: React.FC<PaginationUIProps> = ({
  total,
  page,
  rowsPerPage,
  onPageChange,
  onRowsPerPageChange,
  rowsPerPageOptions = [5, 10, 25],
  paginationType = "page",
  hasMore = false
}) => {
  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLSelectElement>) => {
    onRowsPerPageChange(parseInt(event.target.value, 10))
  }

  const isCursor = paginationType === "cursor"

  return (
    <div className={LAYOUT.FLEX_END + " space-x-2 py-4"}>
      {isCursor ? (
        <div className={"flex-1 " + TYPOGRAPHY.DESCRIPTION_SM}>Viewing page {page + 1}</div>
      ) : (
        total !== undefined && (
          <div className={"flex-1 " + TYPOGRAPHY.DESCRIPTION_SM}>Total: {total} items</div>
        )
      )}
      <div className={LAYOUT.FLEX_START + " space-x-2"}>
        <p className={TYPOGRAPHY.LABEL}>Rows per page</p>
        <select
          className="h-8 w-[70px] rounded-md border border-input bg-transparent px-2 py-1 text-sm shadow-sm"
          value={rowsPerPage}
          onChange={handleChangeRowsPerPage}
        >
          {rowsPerPageOptions.map(pageSize => (
            <option key={pageSize} value={pageSize}>
              {pageSize}
            </option>
          ))}
        </select>
      </div>
      <div className={"flex w-[100px] " + LAYOUT.FLEX_CENTER + " text-sm font-medium"}>Page {page + 1}</div>
      <div className={LAYOUT.FLEX_START + " space-x-2"}>
        <Button
          variant="outline"
          className="hidden size-8 p-0 lg:flex"
          onClick={() => onPageChange(0)}
          disabled={page === 0}
        >
          <span className="sr-only">Go to first page</span>
          <span className="text-xs">&lt;&lt;</span>
        </Button>
        <Button variant="outline" className="size-8 p-0" onClick={() => onPageChange(page - 1)} disabled={page === 0}>
          <span className="sr-only">Go to previous page</span>
          <span className="text-xs">&lt;</span>
        </Button>
        <Button
          variant="outline"
          className="size-8 p-0"
          onClick={() => onPageChange(page + 1)}
          disabled={isCursor ? !hasMore : total !== undefined && (page + 1) * rowsPerPage >= total}
        >
          <span className="sr-only">Go to next page</span>
          <span className="text-xs">&gt;</span>
        </Button>
      </div>
    </div>
  )
}
