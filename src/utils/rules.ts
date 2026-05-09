import type {ApprovalRule, WorkflowVote} from "@approvio/api"

/**
 * Extracts all group IDs required by an approval rule.
 */
export const extractGroupIds = (rule: ApprovalRule): string[] => {
  const groupIds = new Set<string>()

  const extract = (r: ApprovalRule) => {
    if (r.type === "GROUP_REQUIREMENT") groupIds.add(r.groupId)
    else if (r.type === "AND" || r.type === "OR") r.rules.forEach(extract)
  }

  extract(rule)
  return Array.from(groupIds)
}

/**
 * Checks if an approval rule is satisfied by the given votes.
 */
export const isRuleSatisfied = (rule: ApprovalRule, votes: WorkflowVote[]): boolean => {
  if (rule.type === "GROUP_REQUIREMENT") {
    const approveVotesForGroup = votes.filter(v => v.voteType === "APPROVE" && v.votedForGroups?.includes(rule.groupId))
    return approveVotesForGroup.length >= rule.minCount
  }

  if (rule.type === "AND") return rule.rules.length > 0 && rule.rules.every(r => isRuleSatisfied(r, votes))
  if (rule.type === "OR") return rule.rules.length > 0 && rule.rules.some(r => isRuleSatisfied(r, votes))

  return false
}
