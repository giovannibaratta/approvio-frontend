import React, {useState, useEffect} from "react"

import {Button} from "@/components/ui/button"
import {Popover, PopoverContent, PopoverTrigger} from "@/components/ui/popover"
import {Tooltip, TooltipContent, TooltipProvider, TooltipTrigger} from "@/components/ui/tooltip"
import {Checkbox} from "@/components/ui/checkbox"
import {Textarea} from "@/components/ui/textarea"
import {Label} from "@/components/ui/label"
import {useNotification} from "@/providers/notification/NotificationContext"

import {canVoteOnWorkflow, voteOnWorkflow, getEntityInfo} from "@/services/api"
import {handleEither} from "@/utils/either"
import {extractGroupIds} from "@/utils/rules"
import type {WorkflowTemplate, GetEntityInfoUserResponse, CanVoteResponse} from "@approvio/api"
import {CantVoteReason} from "@approvio/api"


interface WorkflowVotePanelProps {
  workflowId: string
  template: WorkflowTemplate | null
  onVoteSuccess: () => void
}

export const WorkflowVotePanel: React.FC<WorkflowVotePanelProps> = ({workflowId, template, onVoteSuccess}) => {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const hasInitializedRef = React.useRef(false)

  const [canVoteInfo, setCanVoteInfo] = useState<CanVoteResponse | null>(null)
  const [entityGroups, setEntityGroups] = useState<GetEntityInfoUserResponse["groups"]>([])

  // Form State
  const [voteType, setVoteType] = useState<"APPROVE" | "VETO" | "WITHDRAW">("APPROVE")
  const [reason, setReason] = useState("")
  const [selectedGroups, setSelectedGroups] = useState<string[]>([])

  const notification = useNotification()

  const loadVotingData = React.useCallback(async () => {
    setLoading(true)

    const canVoteRes = await canVoteOnWorkflow(workflowId)
    handleEither(
      canVoteRes,
      (res: any) => {
        setCanVoteInfo(res)
      },
      (err: any) => {
        console.error("Failed to fetch canVote info", err)
      }
    )

    const entityInfoRes = await getEntityInfo()
    handleEither(
      entityInfoRes,
      info => {
        setEntityGroups(info.groups)
      },
      err => {
        console.error("Failed to fetch entity info", err)
      }
    )

    setLoading(false)
  }, [workflowId])

  useEffect(() => {
    loadVotingData()
  }, [loadVotingData])

  // Extract relevant groups from the template's approval rule
  const templateGroupIds = React.useMemo(
    () => (template?.approvalRule ? extractGroupIds(template.approvalRule) : []),
    [template?.approvalRule]
  )

  // A user can vote on behalf of a group if they are a member of that group AND the group is in the template rules
  const eligibleGroups = React.useMemo(
    () => entityGroups.filter(g => templateGroupIds.includes(g.groupId)),
    [entityGroups, templateGroupIds]
  )

  // Initialize selected groups when eligibleGroups is loaded and voteType is APPROVE
  useEffect(() => {
    if (voteType === "APPROVE" && eligibleGroups.length > 0 && !hasInitializedRef.current) {
      setSelectedGroups(eligibleGroups.map(g => g.groupId))
      hasInitializedRef.current = true
    }
  }, [voteType, eligibleGroups])

  const handleSubmit = async () => {
    setSubmitting(true)

    const payload: any = {
      type: voteType
    }

    if (reason) {
      payload.reason = reason
    }

    if (voteType === "APPROVE") {
      payload.votedForGroups = selectedGroups
    }

    const res = await voteOnWorkflow(workflowId, {
      voteType: payload,
      reason: reason || undefined
    } as any)

    handleEither(
      res,
      () => {
        notification.showSuccess("Vote cast successfully")
        setOpen(false)
        setVoteType("APPROVE")
        setReason("")
        onVoteSuccess()
      },
      (err: any) => {
        notification.showError(`Failed to cast vote: ${err.message}`)
      }
    )

    setSubmitting(false)
  }

  const toggleGroup = (groupId: string) => {
    setSelectedGroups(prev => (prev.includes(groupId) ? prev.filter(id => id !== groupId) : [...prev, groupId]))
  }

  const hasVoted = canVoteInfo?.voteStatus === "ALREADY_VOTED"
  const cannotVote = !!(canVoteInfo && !canVoteInfo.canVote)

  const getCantVoteMessage = (reason?: CantVoteReason) => {
    switch (reason) {
      case CantVoteReason.WorkflowExpired:
        return "This workflow has expired."
      case CantVoteReason.WorkflowApproved:
        return "This workflow has already been approved."
      case CantVoteReason.WorkflowCanceled:
        return "This workflow has been canceled."
      case CantVoteReason.EntityNotInGroup:
        return "You are not a member of any required approval groups for this workflow."
      case CantVoteReason.WorkflowTemplateNotActive:
        return "The template for this workflow is not active."
      case CantVoteReason.NoPermissions:
        return "You do not have permission to vote on this workflow."
      default:
        return "You cannot vote on this workflow at this time."
    }
  }

  const voteButton = (
    <Button variant={hasVoted ? "outline" : "default"} disabled={cannotVote}>
      {hasVoted ? "Vote again" : "Cast Vote"}
    </Button>
  )

  if (cannotVote) {
    return (
      <TooltipProvider delay={300}>
        <Tooltip>
          <TooltipTrigger>
            <div className="inline-block cursor-not-allowed">
              {voteButton}
            </div>
          </TooltipTrigger>
          <TooltipContent>
            {getCantVoteMessage(canVoteInfo.cantVoteReason)}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    )
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        {voteButton}
      </PopoverTrigger>
      <PopoverContent className="w-80" align="end">
        <div className="flex flex-col space-y-4">
          <div className="space-y-1">
            <h4 className="font-medium leading-none">Cast your vote</h4>
            <p className="text-sm text-muted-foreground">Select your decision for this workflow.</p>
          </div>

          {loading ? (
            <div className="py-4 text-center text-sm text-muted-foreground">Loading...</div>
          ) : (
            <div className="flex flex-col space-y-4">
              <div className="flex gap-2">
                <Button
                  variant={voteType === "APPROVE" ? "default" : "outline"}
                  className={voteType === "APPROVE" ? "bg-emerald-600 text-white hover:bg-emerald-700" : ""}
                  onClick={() => setVoteType("APPROVE")}
                  size="sm"
                >
                  Approve
                </Button>
                <Button
                  variant={voteType === "VETO" ? "default" : "outline"}
                  className={
                    voteType === "VETO" ? "bg-destructive text-destructive-foreground hover:bg-destructive/90" : ""
                  }
                  onClick={() => setVoteType("VETO")}
                  size="sm"
                >
                  Veto
                </Button>
                <Button
                  variant={voteType === "WITHDRAW" ? "default" : "outline"}
                  className={voteType === "WITHDRAW" ? "bg-amber-600 text-white hover:bg-amber-700" : ""}
                  onClick={() => setVoteType("WITHDRAW")}
                  size="sm"
                >
                  Withdraw
                </Button>
              </div>

              {voteType === "APPROVE" && eligibleGroups.length > 0 && (
                <div className="space-y-2">
                  <Label>Voting on behalf of groups</Label>
                  <div className="max-h-32 space-y-2 overflow-y-auto rounded-md border p-2">
                    {eligibleGroups.map(group => (
                      <div key={group.groupId} className="flex items-center space-x-2">
                        <Checkbox
                          id={`group-${group.groupId}`}
                          checked={selectedGroups.includes(group.groupId)}
                          onCheckedChange={() => toggleGroup(group.groupId)}
                        />
                        <label
                          htmlFor={`group-${group.groupId}`}
                          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                        >
                          {group.groupName}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {voteType === "APPROVE" && eligibleGroups.length === 0 && (
                <div className="rounded border border-amber-200 bg-amber-50 p-2 text-sm text-amber-600">
                  You are not a member of any required approval groups for this workflow.
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="reason">Reason (Optional)</Label>
                <Textarea
                  id="reason"
                  placeholder="Add a comment or reason for your vote..."
                  value={reason}
                  onChange={e => setReason(e.target.value)}
                />
              </div>

              <Button
                className="w-full"
                onClick={handleSubmit}
                disabled={submitting || (voteType === "APPROVE" && selectedGroups.length === 0)}
              >
                {submitting ? "Submitting..." : "Submit Vote"}
              </Button>
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}
