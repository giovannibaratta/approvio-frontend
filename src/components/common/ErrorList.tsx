import React from "react"
import {Box, Typography, Alert} from "@mui/material"

export interface ErrorEntry {
  message: string
  timestamp: string
}

interface ErrorListProps {
  errors: ErrorEntry[]
}

const ErrorList: React.FC<ErrorListProps> = ({errors}) => {
  if (errors.length === 0) return (<></>)

  // Limit to the 3 most recent errors
  const recentErrors = errors.slice(0, 3)

  return (
    <Box sx={{mb: 2}}>
      <Alert severity="error">
        <Typography variant="body2" component="div">
          {" "}
          {/* Use component="div" to allow line breaks */}
          {recentErrors.map((err, index) => (
            <React.Fragment key={index}>
              <strong>[{err.timestamp}]</strong> {err.message}
              {index < recentErrors.length - 1 && <br />} {/* Add a line break after each error except the last */}
            </React.Fragment>
          ))}
        </Typography>
      </Alert>
    </Box>
  )
}

export default ErrorList
