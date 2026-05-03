import React, { useEffect, useState } from "react"
import { useParams } from "react-router-dom"
import { getWorkflow, getWorkflowTemplate, listWorkflowVotes, getUser, getAgent } from "../services/api"
import { useNotification } from "../providers/notification/NotificationContext"
import { handleEither } from "../utils/either"
import type { Workflow, WorkflowTemplate, WorkflowVote } from "@approvio/api"
import ApprovalRuleRenderer from "../components/shared/ApprovalRuleRenderer"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, Activity, GitCommit, Clock, Calendar, FileText, Info } from "lucide-react"
import { StatusBadge } from "../components/common/StatusBadge"
import { DataTable, type Column } from "../components/DataTable"
import { TYPOGRAPHY } from "@/lib/styles"

// We must assign an id to each vote for the DataTable
type VoteTableRow = WorkflowVote & { id: string; voterName?: string }

const voteColumns: Column<VoteTableRow>[] = [
  {
    id: "voterId",
    label: "Voter Entity",
    width: "250px",
    render: (vote) => (
      <div className="flex flex-col truncate">
        <span className={`${TYPOGRAPHY.LABEL} truncate`} title={vote.voterName || vote.voterId}>
          {vote.voterName || vote.voterId}
        </span>
        <span className="text-[10px] uppercase text-muted-foreground">{vote.voterType}</span>
      </div>
    )
  },
  {
    id: "voteType",
    label: "Decision",
    width: "120px",
    render: (vote) => {
      let badgeColor = "bg-muted text-muted-foreground"
      if (vote.voteType === "APPROVE") badgeColor = "bg-emerald-500/10 text-emerald-600 border-emerald-500/20 border"
      if (vote.voteType === "VETO" || vote.voteType === "REJECT") badgeColor = "bg-destructive/10 text-destructive border-destructive/20 border"
      if (vote.voteType === "WITHDRAW") badgeColor = "bg-amber-500/10 text-amber-600 border-amber-500/20 border"

      return (
        <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${badgeColor}`}>
          {vote.voteType}
        </span>
      )
    }
  },
  {
    id: "reason",
    label: "Reason / Comment",
    width: "300px",
    render: (vote) => <span className={TYPOGRAPHY.DESCRIPTION_SM}>{vote.reason || "—"}</span>
  },
  {
    id: "timestamp",
    label: "Timestamp",
    width: "180px",
    render: (vote) => <span className={TYPOGRAPHY.MONO_SM_MUTED}>{new Date(vote.timestamp).toLocaleString()}</span>
  }
]

const WorkflowDetailsPage: React.FC = () => {
  const { workflowId } = useParams<{ workflowId: string }>()
  const [workflow, setWorkflow] = useState<Workflow | null>(null)
  const [template, setTemplate] = useState<WorkflowTemplate | null>(null)
  const [votes, setVotes] = useState<VoteTableRow[]>([])

  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)

  const notification = useNotification()

  useEffect(() => {
    const fetchAll = async () => {
      if (!workflowId) return

      setLoading(true)
      setError(null)

      const wfResult = await getWorkflow(workflowId)

      await handleEither(
        wfResult,
        async (wfData: Workflow) => {
          setWorkflow(wfData)

          // Fetch template
          if (wfData.workflowTemplateId) {
            const tplResult = await getWorkflowTemplate(wfData.workflowTemplateId)
            handleEither(
              tplResult,
              (tpl) => setTemplate(tpl),
              (err) => console.error("Failed to fetch template", err)
            )
          }

          // Fetch votes
          const votesResult = await listWorkflowVotes(workflowId)
          await handleEither(
            votesResult,
            async (vRes) => {
              const rawVotes = vRes.votes
              const votesWithId = rawVotes.map((v, i) => ({ ...v, id: `vote-${i}` }))

              // Resolve names
              const resolvedVotes = await Promise.all(votesWithId.map(async (vote) => {
                let name = vote.voterId
                if (vote.voterType === "human") {
                  const userRes = await getUser(vote.voterId)
                  handleEither(userRes, (u) => { name = u.displayName }, (err) => console.error(`Failed to resolve user ${vote.voterId}`, err))
                } else if (vote.voterType === "agent") {
                  const agentRes = await getAgent(vote.voterId)
                  handleEither(agentRes, (a) => { name = a.agentName }, (err) => console.error(`Failed to resolve agent ${vote.voterId}`, err))
                }
                return { ...vote, voterName: name }
              }))

              setVotes(resolvedVotes)
            },
            (err) => console.error("Failed to fetch votes", err)
          )
        },
        (err) => {
          setError(err.message)
          notification.showError(err.message)
        }
      )

      setLoading(false)
    }

    fetchAll()
  }, [workflowId, notification])

  if (loading) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <Loader2 className="size-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (error) {
    return (
      <Alert variant="destructive" className="m-4">
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    )
  }

  if (!workflow) {
    return (
      <Alert className="m-4 border-amber-500/50 bg-amber-500/10">
        <AlertDescription className="text-amber-600">Workflow not found.</AlertDescription>
      </Alert>
    )
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      {/* Top Section: Overview */}
      <Card className="border-border/50 bg-background/50 backdrop-blur-sm">
        <CardHeader className="flex flex-col items-start justify-between gap-4 pb-6 sm:flex-row sm:items-center">
          <div className="flex items-center gap-4">
            <div className="flex size-12 items-center justify-center rounded-xl border border-blue-500/20 bg-blue-500/10">
              <Activity className="size-6 text-blue-500" />
            </div>
            <div>
              <CardTitle className="text-2xl font-semibold tracking-tight">{workflow.name}</CardTitle>
              <CardDescription className="mt-1 flex items-center gap-2 text-base">
                <StatusBadge status={workflow.status as any} />
                <span className="ml-2 font-mono text-sm text-muted-foreground">ID: {workflow.id}</span>
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="rounded-md border border-border/40 bg-muted/30 p-4">
              <div className="mb-2 flex items-center gap-2">
                <FileText className="size-4 text-muted-foreground" />
                <p className="text-sm font-medium text-muted-foreground">Template</p>
              </div>
              <p className="truncate text-base font-medium">{template?.name || workflow.workflowTemplateId}</p>
            </div>

            <div className="rounded-md border border-border/40 bg-muted/30 p-4">
              <div className="mb-2 flex items-center gap-2">
                <Calendar className="size-4 text-muted-foreground" />
                <p className="text-sm font-medium text-muted-foreground">Created</p>
              </div>
              <p className="text-base font-medium">{new Date(workflow.createdAt).toLocaleString()}</p>
            </div>

            <div className="rounded-md border border-border/40 bg-muted/30 p-4">
              <div className="mb-2 flex items-center gap-2">
                <Clock className="size-4 text-muted-foreground" />
                <p className="text-sm font-medium text-muted-foreground">Last Update</p>
              </div>
              <p className="text-base font-medium">{new Date(workflow.updatedAt).toLocaleString()}</p>
            </div>
          </div>

          {workflow.description && (
             <div className="mt-4 rounded-md border border-border/40 bg-muted/20 p-4">
              <div className="mb-2 flex items-center gap-2">
                <Info className="size-4 text-muted-foreground" />
                <p className="text-sm font-medium text-muted-foreground">Description</p>
              </div>
              <p className="text-sm leading-relaxed text-foreground/80">{workflow.description}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Approval Rule Evaluation Section */}
      <Card className="border-border/50 bg-background/50 backdrop-blur-sm">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="flex size-8 items-center justify-center rounded-md border border-purple-500/20 bg-purple-500/10">
              <GitCommit className="size-4 text-purple-500" />
            </div>
            <div>
              <CardTitle className="text-lg">Approval Rule Evaluation</CardTitle>
              <CardDescription>Visualizing requirement fulfillment against submitted votes</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
           {template?.approvalRule ? (
             <ApprovalRuleRenderer rule={template.approvalRule} votes={votes} />
           ) : (
             <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
               <Loader2 className="mb-4 size-8 animate-spin opacity-50" />
               <p>Loading template rules...</p>
             </div>
           )}
        </CardContent>
      </Card>

      {/* Votes Table Section */}
      <div className="pt-2">
        <DataTable<VoteTableRow>
          title="Submitted Votes"
          columns={voteColumns}
          data={votes}
          loading={loading}
          total={votes.length}
          page={0}
          rowsPerPage={Math.max(10, votes.length)}
          onPageChange={() => undefined}
          onRowsPerPageChange={() => undefined}
        />
      </div>
    </div>
  )
}

export default WorkflowDetailsPage
