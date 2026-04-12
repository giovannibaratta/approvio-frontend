import React, {useState} from "react"
import {Box, Typography, Switch, FormControlLabel, Paper} from "@mui/material"
import type {ApprovalRule} from "@approvio/api"
import ApprovalRuleRenderer from "./ApprovalRuleRenderer"

interface Props {
  rule: ApprovalRule
  title?: string
  /**
   * Additional content to be rendered in the header, next to the title.
   * Useful for badges, chips, or small status indicators.
   */
  extraHeaderContent?: React.ReactNode
}

/**
 * A viewer component that combines visual rendering and raw JSON preview.
 * It is suitable for pages that only need to display the rule without management capabilities.
 */
const ApprovalRuleViewer: React.FC<Props> = ({rule, title = "Approval Rule", extraHeaderContent}) => {
  const [showRaw, setShowRaw] = useState(false)

  return (
    <Box>
      <Box sx={{display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2}}>
        <Box sx={{display: "flex", alignItems: "center", gap: 1}}>
          <Typography variant="h6">{title}</Typography>
          {extraHeaderContent}
        </Box>
        <Box sx={{display: "flex", alignItems: "center"}}>
          <FormControlLabel
            control={<Switch checked={showRaw} onChange={e => setShowRaw(e.target.checked)} />}
            label="Show Raw JSON"
            sx={{mr: 1}}
          />
        </Box>
      </Box>

      {showRaw ? (
        <Paper variant="outlined" sx={{p: 2, bgcolor: "grey.100", overflowX: "auto"}}>
          <pre style={{margin: 0}}>
            <code>{JSON.stringify(rule, null, 2)}</code>
          </pre>
        </Paper>
      ) : (
        <ApprovalRuleRenderer rule={rule} />
      )}
    </Box>
  )
}

export default ApprovalRuleViewer
