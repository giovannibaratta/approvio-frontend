import React, {useEffect, useState} from "react"
import {useParams} from "react-router-dom"
import {Box, Typography, Paper, Alert, CircularProgress, Grid, Tooltip} from "@mui/material"
import SchemaIcon from "@mui/icons-material/Schema"
import {getSpace, getWorkflowTemplate} from "../services/api"
import {useNotification} from "../providers/notification/NotificationContext"
import {handleEither} from "../utils/either"
import type {Space, WorkflowTemplate} from "@approvio/api"
import TemplateDetailsRule from "../components/workflow-templates/TemplateDetailsRule"

const WorkflowTemplateDetailsPage: React.FC = () => {
  const {templateIdentifier} = useParams<{templateIdentifier: string}>()
  const [template, setTemplate] = useState<WorkflowTemplate | null>(null)
  const [spaceName, setSpaceName] = useState<string | null>(null)
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)

  const notification = useNotification()

  useEffect(() => {
    const fetchTemplateDetails = async () => {
      if (!templateIdentifier) return

      setLoading(true)
      setError(null)

      const result = await getWorkflowTemplate(templateIdentifier)

      handleEither(
        result,
        async (templateData: WorkflowTemplate) => {
          setTemplate(templateData)
            const spacesResult = await getSpace(templateData.spaceId)
            handleEither(
              spacesResult,
              (space: Space) => {
                setSpaceName(space.name)
              },
              () => {
                setSpaceName(templateData.spaceId)
              }
            )
        },
        (errorMessage) => {
          setError(errorMessage.message)
          notification.showError(errorMessage.message)
        }
      )

      setLoading(false)
    }

    fetchTemplateDetails()
  }, [templateIdentifier, notification])

  if (loading) {
    return (
      <Box sx={{display: "flex", justifyContent: "center", alignItems: "center", height: "80vh"}}>
        <CircularProgress />
      </Box>
    )
  }

  if (error) {
    return (
      <Alert severity="error" sx={{m: 2}}>
        {error}
      </Alert>
    )
  }

  if (!template) {
    return (
      <Alert severity="warning" sx={{m: 2}}>
        Workflow Template not found.
      </Alert>
    )
  }

  return (
    <Box sx={{p: 3}}>
      {/* Top Section: Overview */}
      <Paper sx={{p: 3, mb: 3}}>
        <Box sx={{display: "flex", alignItems: "center", mb: 2}}>
          <SchemaIcon sx={{mr: 2, fontSize: 40, color: "primary.main"}} />
          <Typography variant="h4" component="h1" sx={{fontWeight: "bold"}}>
            {template.name}
          </Typography>
        </Box>

        <Grid container spacing={2} sx={{mb: 2}}>
          <Grid size={{xs: 12, sm: 6}}>
            <Typography variant="subtitle1" component="div" color="text.secondary" sx={{fontWeight: "bold", mb: 0.5}}>
              <Box sx={{borderBottom: "1px solid rgba(0, 0, 0, 0.12)", pb: 0.5, display: "inline-block"}}>
                Version
              </Box>
            </Typography>
            <Typography variant="body1">{template.version}</Typography>
          </Grid>
          <Grid size={{xs: 12, sm: 6}}>
            <Typography variant="subtitle1" component="div" color="text.secondary" sx={{fontWeight: "bold", mb: 0.5}}>
              <Box sx={{borderBottom: "1px solid rgba(0, 0, 0, 0.12)", pb: 0.5, display: "inline-block"}}>
                Space
              </Box>
            </Typography>
            <Typography variant="body1">{spaceName || "Loading..."}</Typography>
          </Grid>
          <Grid size={{xs: 12, sm: 6}}>
            <Typography variant="subtitle1" component="div" color="text.secondary" sx={{fontWeight: "bold", mb: 0.5}}>
              <Box sx={{borderBottom: "1px solid rgba(0, 0, 0, 0.12)", pb: 0.5, display: "inline-block"}}>
                Created
              </Box>
            </Typography>
            <Tooltip title={new Date(template.createdAt).toLocaleString()} placement="top-start" enterDelay={500}>
              <Typography variant="body1">{new Date(template.createdAt).toLocaleDateString()}</Typography>
            </Tooltip>
          </Grid>
          <Grid size={{xs: 12, sm: 6}}>
            <Typography variant="subtitle1" component="div" color="text.secondary" sx={{fontWeight: "bold", mb: 0.5}}>
              <Box sx={{borderBottom: "1px solid rgba(0, 0, 0, 0.12)", pb: 0.5, display: "inline-block"}}>
                Last Update
              </Box>
            </Typography>
            <Tooltip title={new Date(template.updatedAt).toLocaleString()} placement="top-start" enterDelay={500}>
              <Typography variant="body1">{new Date(template.updatedAt).toLocaleDateString()}</Typography>
            </Tooltip>
          </Grid>
        </Grid>
      </Paper>

      {/* Details Section */}
      <Paper sx={{p: 3}}>
        <Grid container spacing={2} sx={{mb: 3}}>
          <Grid size={{xs: 12}}>
            <Typography variant="subtitle2" color="textSecondary">Description</Typography>
            <Typography variant="body1">{template.description || "No description provided."}</Typography>
          </Grid>
          <Grid size={{xs: 12}}>
            <Typography variant="subtitle2" color="textSecondary">Default Expires In (Hours)</Typography>
            <Typography variant="body1">{template.defaultExpiresInHours ?? "DEFAULT"}</Typography>
          </Grid>
        </Grid>

        <TemplateDetailsRule rule={template.approvalRule} />
      </Paper>
    </Box>
  )
}

export default WorkflowTemplateDetailsPage
