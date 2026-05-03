import type {ApprovalRule, WorkflowVote} from "@approvio/api"

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
