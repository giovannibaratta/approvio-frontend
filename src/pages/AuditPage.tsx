import React, {useState, useEffect} from "react"
import {AuditLogsTable} from "../components/shared/AuditLogsTable"
import {handleEither} from "../utils/either"
import {listAuditLogs} from "../services/api"
import type {AuditLog, ListAuditLogsParams} from "@approvio/api"
import {Card, CardContent} from "@/components/ui/card"
import {Alert, AlertDescription} from "@/components/ui/alert"
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from "@/components/ui/select"
import {Input} from "@/components/ui/input"
import {Button} from "@/components/ui/button"
import {FileText, Search} from "lucide-react"
import {toast} from "sonner"
import {TYPOGRAPHY, LAYOUT} from "../lib/styles"

const AuditPage: React.FC = () => {
  const [logs, setLogs] = useState<AuditLog[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [cursorHistory, setCursorHistory] = useState<(string | undefined)[]>([undefined])
  const [currentPageIndex, setCurrentPageIndex] = useState(0)
  const [limit, setLimit] = useState(10)
  const [hasMore, setHasMore] = useState(false)
  const [nextCursor, setNextCursor] = useState<string | undefined>(undefined)

  const [entityTypeFilter, setEntityTypeFilter] = useState<string>("ALL")
  const [entityIdFilter, setEntityIdFilter] = useState<string>("")
  const [actorIdFilter, setActorIdFilter] = useState<string>("")

  const [activeFilters, setActiveFilters] = useState<{
    entityType: string
    entityId: string
    actorId: string
  }>({
    entityType: "ALL",
    entityId: "",
    actorId: ""
  })

  useEffect(() => {
    const fetchLogs = async () => {
      setLoading(true)
      setError(null)

      const params: ListAuditLogsParams = {
        limit,
        cursor: cursorHistory[currentPageIndex]
      }

      if (activeFilters.entityType !== "ALL" && activeFilters.entityId) {
        params.targets = [`${activeFilters.entityType}:${activeFilters.entityId}`]
      }

      if (activeFilters.actorId) {
        params.actors = [activeFilters.actorId]
      }

      const result = await listAuditLogs(params)
      handleEither(
        result,
        data => {
          setLogs(data.auditLogs || [])
          setHasMore(data.pagination?.hasMore || false)
          setNextCursor(data.pagination && "nextCursor" in data.pagination ? data.pagination.nextCursor : undefined)
          setLoading(false)
        },
        errorObj => {
          setError(errorObj.message)
          setLoading(false)
        }
      )
    }

    fetchLogs()
  }, [currentPageIndex, cursorHistory, limit, activeFilters])

  const handlePageChange = (newPageIndex: number) => {
    if (newPageIndex > currentPageIndex) {
      const newHistory = [...cursorHistory]
      if (newPageIndex >= newHistory.length) {
        newHistory.push(nextCursor)
        setCursorHistory(newHistory)
      }
    }
    setCurrentPageIndex(newPageIndex)
  }

  const handleRowsPerPageChange = (newLimit: number) => {
    setLimit(newLimit)
    setCursorHistory([undefined])
    setCurrentPageIndex(0)
    setNextCursor(undefined)
    setHasMore(false)
  }

  const handleSearch = () => {
    const hasType = entityTypeFilter !== "ALL"
    const hasId = entityIdFilter.trim() !== ""

    if ((hasType && !hasId) || (!hasType && hasId)) {
      toast.error("Both Entity Type and Entity ID must be specified together for target filtering.")
      return
    }

    setCursorHistory([undefined])
    setCurrentPageIndex(0)
    setNextCursor(undefined)
    setHasMore(false)
    setActiveFilters({
      entityType: entityTypeFilter,
      entityId: entityIdFilter.trim(),
      actorId: actorIdFilter.trim()
    })
  }

  return (
    <div className="space-y-6">
      <div className={LAYOUT.FLEX_BETWEEN}>
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10">
            <FileText className="size-5 text-primary" />
          </div>
          <div>
            <h1 className={TYPOGRAPHY.TITLE_LG}>Audit Logs</h1>
            <p className={TYPOGRAPHY.DESCRIPTION_BASE}>View and filter system-wide audit events.</p>
          </div>
        </div>
      </div>

      <Card className="border-border/50">
        <CardContent className="p-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
            <div className="space-y-2">
              <label
                htmlFor="entityTypeFilter"
                className="text-xs font-medium uppercase tracking-wider text-muted-foreground"
              >
                Entity Type
              </label>
              <Select value={entityTypeFilter} onValueChange={e => setEntityTypeFilter(e || "ALL")}>
                <SelectTrigger id="entityTypeFilter" className="w-[180px]">
                  <SelectValue placeholder="All types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All types</SelectItem>
                  <SelectItem value="SPACE">Space</SelectItem>
                  <SelectItem value="GROUP">Group</SelectItem>
                  <SelectItem value="USER">User</SelectItem>
                  <SelectItem value="AGENT">Agent</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex-1 space-y-2">
              <label
                htmlFor="entityIdFilter"
                className="text-xs font-medium uppercase tracking-wider text-muted-foreground"
              >
                Entity ID
              </label>
              <Input
                id="entityIdFilter"
                placeholder="Search by UUID..."
                value={entityIdFilter}
                onChange={e => setEntityIdFilter(e.target.value)}
                maxLength={36}
                onKeyDown={e => e.key === "Enter" && handleSearch()}
              />
            </div>
            <div className="flex-1 space-y-2">
              <label
                htmlFor="actorIdFilter"
                className="text-xs font-medium uppercase tracking-wider text-muted-foreground"
              >
                Actor ID
              </label>
              <Input
                id="actorIdFilter"
                placeholder="Search by UUID..."
                value={actorIdFilter}
                onChange={e => setActorIdFilter(e.target.value)}
                maxLength={36}
                onKeyDown={e => e.key === "Enter" && handleSearch()}
              />
            </div>
            <Button onClick={handleSearch} className="shrink-0 gap-2">
              <Search className="size-4" />
              Search
            </Button>
          </div>
        </CardContent>
      </Card>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <AuditLogsTable
        title="Events"
        logs={logs}
        loading={loading}
        page={currentPageIndex}
        rowsPerPage={limit}
        hasMore={hasMore}
        onPageChange={handlePageChange}
        onRowsPerPageChange={handleRowsPerPageChange}
      />
    </div>
  )
}

export default AuditPage
