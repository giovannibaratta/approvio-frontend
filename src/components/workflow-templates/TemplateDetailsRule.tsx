import React, {useState, useEffect} from "react"
import {Box, Typography, Paper, Switch, FormControlLabel, Link as MuiLink} from "@mui/material"
import {Link as RouterLink} from "react-router-dom"
import type {ApprovalRule} from "@approvio/api"
import {getGroup} from "../../services/api"
import {handleEither} from "../../utils/either"

interface Props {
  rule: ApprovalRule
}

const TemplateDetailsRule: React.FC<Props> = ({rule}) => {
  const [showRaw, setShowRaw] = useState(false)
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
        Array.from(groupIds).map(async (id) => {
          const result = await getGroup(id)
          handleEither(
            result,
            (groupData) => {
              map[id] = groupData.name
            },
            (err) => {
              console.error(`Failed to load group ${id} for name resolution`, err)
            }
          )
        })
      )

      setGroupMap(map)
    }

    fetchGroups()
  }, [rule])

  /**
   * Recursively parses an ApprovalRule tree and transforms it into visual React components.
   * Resolves group IDs into human-readable group names with links.
   */
  const renderRule = (r: ApprovalRule): React.ReactNode => {
    if (r.type === "GROUP_REQUIREMENT") {
      const gName = groupMap[r.groupId] || r.groupId
      return (
        <Box sx={{ml: 2, mt: 1, p: 1, border: "1px solid #ddd", borderRadius: 1}}>
          <Typography variant="body2" component="span" sx={{fontWeight: "bold", mr: 1}}>Group:</Typography>
          <MuiLink component={RouterLink} to={`/groups/${r.groupId}`}>
            {gName}
          </MuiLink>
          <Typography variant="body2" sx={{mt: 0.5}}>Min Approvals: {r.minCount}</Typography>
        </Box>
      )
    }
    if (r.type === "AND") {
      return (
        <Box sx={{ml: 2, mt: 1, p: 1, border: "1px solid #ddd", borderRadius: 1}}>
          <Typography variant="body2" sx={{fontWeight: "bold"}}>ALL of the following (AND):</Typography>
          {r.rules.map((sub: any, i: number) => <Box key={i}>{renderRule(sub)}</Box>)}
        </Box>
      )
    }
    if (r.type === "OR") {
      return (
        <Box sx={{ml: 2, mt: 1, p: 1, border: "1px solid #ddd", borderRadius: 1}}>
          <Typography variant="body2" sx={{fontWeight: "bold"}}>ANY of the following (OR):</Typography>
          {r.rules.map((sub: any, i: number) => <Box key={i}>{renderRule(sub)}</Box>)}
        </Box>
      )
    }
    return <Typography variant="body2">Unknown rule type</Typography>
  }

  return (
    <Box>
      <Box sx={{display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2}}>
        <Typography variant="h6">Approval Rule</Typography>
        <FormControlLabel
          control={<Switch checked={showRaw} onChange={(e) => setShowRaw(e.target.checked)} />}
          label="Show Raw JSON"
        />
      </Box>

      {showRaw ? (
        <Paper variant="outlined" sx={{p: 2, bgcolor: "grey.100", overflowX: "auto"}}>
          <pre style={{margin: 0}}>
            <code>{JSON.stringify(rule, null, 2)}</code>
          </pre>
        </Paper>
      ) : (
        <Box sx={{p: 1}}>
          {renderRule(rule)}
        </Box>
      )}
    </Box>
  )
}

export default TemplateDetailsRule
