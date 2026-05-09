import {type FrontendError} from "../services/api"
import React, {useEffect, useState} from "react"
import {Link as RouterLink, useNavigate} from "react-router-dom"
import {listGroups} from "../services/api"
import {useNotification} from "../providers/notification/NotificationContext"
import {handleEither} from "../utils/either"
import {Plus, AlertCircle} from "lucide-react"
import {Tooltip, TooltipContent, TooltipProvider, TooltipTrigger} from "@/components/ui/tooltip"
import type {Group, ListGroups200Response, Pagination} from "@approvio/api"
import {DataTable, type Column} from "../components/DataTable"
import {Alert, AlertDescription} from "@/components/ui/alert"
import {Button} from "@/components/ui/button"

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
      <Alert variant="destructive" className="m-4">
        <AlertCircle className="size-4" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    )
  }

  const columns: Column<Group>[] = [
    {
      id: "name",
      label: "Name",
      render: group => (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger>
              <button
                className="cursor-pointer text-left font-medium text-primary transition-colors hover:text-primary/80 focus:outline-none"
                onClick={() => navigate(`/groups/${group.id}`)}
              >
                {group.name}
              </button>
            </TooltipTrigger>
            <TooltipContent align="start">
              <p>Click to view details for {group.name}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )
    },
    {
      id: "description",
      label: "Description",
      render: group => <span className="text-sm text-muted-foreground">{group.description || "No description"}</span>
    },
    {
      id: "entitiesCount",
      label: "Entity Count",
      render: group => <span className="text-sm">{group.entitiesCount}</span>
    },
    {
      id: "createdAt",
      label: "Created At",
      render: group => (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger>
              <span className="cursor-default font-mono text-sm text-muted-foreground">
                {new Date(group.createdAt).toLocaleDateString()}
              </span>
            </TooltipTrigger>
            <TooltipContent>
              <p>{new Date(group.createdAt).toLocaleString()}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )
    }
  ]

  const headerAction = (
    <Button asChild>
      <RouterLink to="/groups/new">
        <Plus className="mr-2 size-4" />
        Create Group
      </RouterLink>
    </Button>
  )

  return (
    <div className="space-y-4">
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
        headerAction={headerAction}
      />
    </div>
  )
}

export default GroupsPage
