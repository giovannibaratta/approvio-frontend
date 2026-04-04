import React, {useEffect, useState} from "react"
import {Box, Typography, Paper, Grid} from "@mui/material"
import {listSpaces} from "../../services/api"
import {handleEither} from "../../utils/either"

interface TemplateReviewProps {
  name: string
  description: string
  defaultExpiresInHours: number | null
  spaceId: string | null
  ruleJson: string
}

const TemplateReview: React.FC<TemplateReviewProps> = ({
  name,
  description,
  defaultExpiresInHours,
  spaceId,
  ruleJson
}) => {
  const [spaceName, setSpaceName] = useState<string>("Loading...")

  useEffect(() => {
    const fetchSpaces = async () => {
      if (!spaceId) {
        setSpaceName("None")
        return
      }

      const result = await listSpaces(1, 100)
      handleEither(
        result,
        (response) => {
          const space = response.data.find(s => s.id === spaceId)
          setSpaceName(space ? space.name : "Unknown Space")
        },
        () => {
          setSpaceName("Error loading space")
        }
      )
    }
    fetchSpaces()
  }, [spaceId])

  return (
    <Box>
      <Typography variant="h6" sx={{mb: 2}}>Review Details</Typography>
      <Grid container spacing={2}>
        <Grid size={{xs: 12, sm: 6}}>
          <Typography variant="subtitle2" color="textSecondary">Name</Typography>
          <Typography variant="body1">{name}</Typography>
        </Grid>
        <Grid size={{xs: 12, sm: 6}}>
          <Typography variant="subtitle2" color="textSecondary">Space</Typography>
          <Typography variant="body1">{spaceName}</Typography>
        </Grid>
        <Grid size={{xs: 12}}>
          <Typography variant="subtitle2" color="textSecondary">Description</Typography>
          <Typography variant="body1">{description || "No description provided."}</Typography>
        </Grid>
        <Grid size={{xs: 12}}>
          <Typography variant="subtitle2" color="textSecondary">Default Expires In (Hours)</Typography>
          <Typography variant="body1">{defaultExpiresInHours ?? "DEFAULT"}</Typography>
        </Grid>
        <Grid size={{xs: 12}}>
          <Typography variant="subtitle2" color="textSecondary" sx={{mb: 1}}>Approval Rule</Typography>
          <Paper variant="outlined" sx={{p: 2, bgcolor: "grey.100", overflowX: "auto"}}>
            <pre style={{margin: 0}}>
              <code>{ruleJson}</code>
            </pre>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  )
}

export default TemplateReview
