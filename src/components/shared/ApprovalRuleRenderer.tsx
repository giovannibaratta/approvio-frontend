import React from "react"
import {Link as RouterLink} from "react-router-dom"
import type {ApprovalRule, WorkflowVote} from "@approvio/api"
import {Users, Layers, CheckCircle2} from "lucide-react"
import {useApprovalRuleGroups} from "../../hooks/useApprovalRuleGroups"
import {isRuleSatisfied} from "../../utils/rules"

interface Props {
  rule: ApprovalRule
  votes?: WorkflowVote[]
}

/**
 * A unified component that renders the visual tree structure of an Approval Rule.
 * If votes are provided, it also shows the satisfaction status of each rule.
 */
const ApprovalRuleRenderer: React.FC<Props> = ({rule, votes}) => {
  const groupMap = useApprovalRuleGroups(rule)

  const renderRule = (r: ApprovalRule, depth: number = 0): React.ReactNode => {
    const isRoot = depth === 0
    const paddingLeft = isRoot ? "" : "pl-6"

    const satisfied = votes ? isRuleSatisfied(r, votes) : false
    const showStatus = !!votes

    if (r.type === "GROUP_REQUIREMENT") {
      const gName = groupMap[r.groupId] || r.groupId

      // Dynamic colors based on satisfaction (if votes provided)
      const borderColor = showStatus ? (satisfied ? "border-emerald-500/50" : "border-border/50") : "border-border/50"

      const bgColor = showStatus ? (satisfied ? "bg-emerald-500/5" : "bg-background/50") : "bg-background/50"

      return (
        <div className={`mt-3 ${paddingLeft} relative`}>
          {!isRoot && <div className="absolute left-1.5 top-3 h-px w-4 bg-border/60" />}
          {!isRoot && <div className="absolute -top-4 bottom-auto left-1.5 h-7 w-px bg-border/60" />}

          <div
            className={`flex items-center justify-between rounded-md border ${borderColor} ${bgColor} p-3 shadow-sm transition-colors hover:bg-muted/30`}
          >
            <div className="flex items-center gap-3">
              <div
                className={`flex size-8 shrink-0 items-center justify-center rounded-md border ${
                  showStatus && satisfied
                    ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-500"
                    : "border-blue-500/20 bg-blue-500/10 text-blue-500"
                }`}
              >
                {showStatus && satisfied ? <CheckCircle2 className="size-4" /> : <Users className="size-4" />}
              </div>
              <div className="flex flex-col">
                <span className="mb-0.5 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Required Group
                </span>
                <RouterLink to={`/groups/${r.groupId}`} className="text-sm font-semibold text-primary hover:underline">
                  {gName}
                </RouterLink>
              </div>
            </div>
            <div className="flex flex-col items-end">
              <span className="mb-0.5 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Min Approvals
              </span>
              <span
                className={`inline-flex items-center justify-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${
                  showStatus && satisfied
                    ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-600"
                    : "border-blue-500/20 bg-blue-500/10 text-blue-600"
                }`}
              >
                {r.minCount}
              </span>
            </div>
          </div>
        </div>
      )
    }

    if (r.type === "AND" || r.type === "OR") {
      const isAnd = r.type === "AND"
      const label = isAnd ? "ALL of the following (AND)" : "ANY of the following (OR)"

      const badgeClass = isAnd
        ? "bg-purple-500/10 text-purple-600 border-purple-500/20"
        : "bg-amber-500/10 text-amber-600 border-amber-500/20"

      const borderClass = showStatus && satisfied ? "border-emerald-500/40" : "border-border/50"

      return (
        <div className={`mt-3 ${paddingLeft} relative`}>
          {!isRoot && <div className="absolute left-1.5 top-3 h-px w-4 bg-border/60" />}
          {!isRoot && <div className="absolute -top-4 bottom-auto left-1.5 h-7 w-px bg-border/60" />}

          <div className={`relative rounded-md border ${borderClass} bg-muted/10 p-4 shadow-sm`}>
            {/* Vertical connector line for children */}
            <div className="absolute bottom-6 left-[21px] top-[50px] size-px h-auto bg-border/60" />

            <div className="mb-2 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Layers className="size-4 text-muted-foreground" />
                <span
                  className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-semibold uppercase tracking-wider ${badgeClass}`}
                >
                  {label}
                </span>
              </div>

              {showStatus && satisfied && (
                <div className="flex items-center gap-1 text-xs font-medium text-emerald-600">
                  <CheckCircle2 className="size-3.5" />
                  <span>Satisfied</span>
                </div>
              )}
            </div>

            <div className="flex flex-col">
              {r.rules.map((sub: any, i: number) => (
                <React.Fragment key={i}>{renderRule(sub, depth + 1)}</React.Fragment>
              ))}
            </div>
          </div>
        </div>
      )
    }

    return (
      <div className={`mt-3 ${paddingLeft}`}>
        <p className="text-sm text-destructive">Unknown rule type</p>
      </div>
    )
  }

  return <div className="p-1">{renderRule(rule)}</div>
}

export default ApprovalRuleRenderer
