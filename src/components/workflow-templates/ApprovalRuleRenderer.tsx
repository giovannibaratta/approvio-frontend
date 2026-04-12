import React, {useState, useEffect} from "react"
import {Box, Typography, Link as MuiLink} from "@mui/material"
import {Link as RouterLink} from "react-router-dom"
import type {ApprovalRule} from "@approvio/api"
import {getGroup} from "../../services/api"
import {handleEither} from "../../utils/either"

interface Props {
  rule: ApprovalRule
}

/**
 * A pure presentation component that renders the visual tree structure of an Approval Rule.
 * It resolves group IDs to names and handles the hierarchical display of logical operators.
 */
const ApprovalRuleRenderer: React.FC<Props> = ({rule}) => {
  const [groupMap, setGroupMap] = useState<Record<string, string>>({})

  useEffect(() => {
    const fetchGroups = async () => {
      const groupIds = new Set<string>()

      const extractGroupIds = (r: ApprovalRule) => {
        if (r.type === "GROUP_REQUIREMENT") {
          if (r.groupId) groupIds.add(r.groupId)
        } else if (r.type === "AND" || r.type === "OR") {
          r.rules.forEach(extractGroupIds)
        }
      }

      extractGroupIds(rule)

      if (groupIds.size === 0) return

      const map: Record<string, string> = {}

      await Promise.all(
        Array.from(groupIds).map(async id => {
          const result = await getGroup(id)
          handleEither(
            result,
            groupData => {
              map[id] = groupData.name
            },
            err => {
              console.error(`Failed to load group ${id} for name resolution`, err)
            }
          )
        })
      )

      setGroupMap(map)
    }

    fetchGroups()
  }, [rule])

  const renderRule = (r: ApprovalRule): React.ReactNode => {
    if (r.type === "GROUP_REQUIREMENT") {
      const gName = groupMap[r.groupId] || r.groupId
      return (
        <Box sx={{ml: 2, mt: 1, p: 1, border: "1px solid #ddd", borderRadius: 1}}>
          <Typography variant="body2" component="span" sx={{fontWeight: "bold", mr: 1}}>
            Group:
          </Typography>
          <MuiLink component={RouterLink} to={`/groups/${r.groupId}`}>
            {gName}
          </MuiLink>
          <Typography variant="body2" sx={{mt: 0.5}}>
            Min Approvals: {r.minCount}
          </Typography>
        </Box>
      )
    }
    if (r.type === "AND") {
      return (
        <Box sx={{ml: 2, mt: 1, p: 1, border: "1px solid #ddd", borderRadius: 1}}>
          <Typography variant="body2" sx={{fontWeight: "bold"}}>
            ALL of the following (AND):
          </Typography>
          {r.rules.map((sub: any, i: number) => (
            <Box key={i}>{renderRule(sub)}</Box>
          ))}
        </Box>
      )
    }
    if (r.type === "OR") {
      return (
        <Box sx={{ml: 2, mt: 1, p: 1, border: "1px solid #ddd", borderRadius: 1}}>
          <Typography variant="body2" sx={{fontWeight: "bold"}}>
            ANY of the following (OR):
          </Typography>
          {r.rules.map((sub: any, i: number) => (
            <Box key={i}>{renderRule(sub)}</Box>
          ))}
        </Box>
      )
    }
    return <Typography variant="body2">Unknown rule type</Typography>
  }

  return <Box sx={{p: 1}}>{renderRule(rule)}</Box>
}

export default ApprovalRuleRenderer
