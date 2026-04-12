import React, {useEffect, useState} from "react"
import {useParams} from "react-router-dom"
import {
  Box,
  Typography,
  Paper,
  Alert,
  CircularProgress,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Grid
} from "@mui/material"
import {getWorkflowTemplate, listWorkflowTemplates} from "../services/api"
import {useNotification} from "../providers/notification/NotificationContext"
import {handleEither} from "../utils/either"
import type {WorkflowTemplate, WorkflowTemplateSummary} from "@approvio/api"
import ApprovalRuleViewer from "../components/workflow-templates/ApprovalRuleViewer"

/**
 * A page component that allows users to compare different versions of a workflow template.
 *
 * Features:
 * - Displays the current version of a template alongside a selected version for comparison.
 * - Fetches and displays metadata (description, expiry) and the approval rule for both versions.
 * - Provides a dropdown to select and compare against other available versions of the same template.
 * - Handles loading states and errors gracefully.
 */
const CompareWorkflowTemplatePage: React.FC = () => {
  const {templateIdentifier} = useParams<{templateIdentifier: string}>()
  const [currentTemplate, setCurrentTemplate] = useState<WorkflowTemplate | null>(null)
  const [otherVersions, setOtherVersions] = useState<WorkflowTemplateSummary[]>([])

  const [selectedVersionId, setSelectedVersionId] = useState<string>("")
  const [selectedTemplate, setSelectedTemplate] = useState<WorkflowTemplate | null>(null)

  const [loadingInitial, setLoadingInitial] = useState<boolean>(true)
  const [loadingCompare, setLoadingCompare] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)

  const notification = useNotification()

  // Initial load
  useEffect(() => {
    const fetchInitialData = async () => {
      if (!templateIdentifier) return
      setLoadingInitial(true)
      setError(null)

      const result = await getWorkflowTemplate(templateIdentifier)
      await handleEither(
        result,
        async (templateData: WorkflowTemplate) => {
          setCurrentTemplate(templateData)

          // Fetch other versions
          const versionsResult = await listWorkflowTemplates({
            search: templateData.name,
            searchMode: "EXACT",
            status: ["ACTIVE", "PENDING_DEPRECATION", "DEPRECATED"],
            limit: 100
          })

          handleEither(
            versionsResult,
            res => {
              setOtherVersions(res.data.filter(t => t.id !== templateData.id))
            },
            err => {
              notification.showError(`Failed to load other versions: ${err.message}`)
            }
          )
        },
        err => {
          setError(err.message)
          notification.showError(err.message)
        }
      )

      setLoadingInitial(false)
    }

    fetchInitialData()
  }, [templateIdentifier, notification])

  // Fetch selected template
  useEffect(() => {
    const fetchSelectedTemplate = async () => {
      if (!selectedVersionId) {
        setSelectedTemplate(null)
        return
      }
      setLoadingCompare(true)
      const result = await getWorkflowTemplate(selectedVersionId)
      handleEither(
        result,
        data => setSelectedTemplate(data),
        err => notification.showError(`Failed to load selected template: ${err.message}`)
      )
      setLoadingCompare(false)
    }
    fetchSelectedTemplate()
  }, [selectedVersionId, notification])

  if (loadingInitial) {
    return (
      <Box sx={{display: "flex", justifyContent: "center", alignItems: "center", height: "80vh"}}>
        <CircularProgress />
      </Box>
    )
  }

  if (error || !currentTemplate) {
    return (
      <Alert severity="error" sx={{m: 2}}>
        {error || "Template not found"}
      </Alert>
    )
  }

  return (
    <Box sx={{p: 3}}>
      <Typography variant="h4" component="h1" sx={{fontWeight: "bold", mb: 3}}>
        Compare Versions: {currentTemplate.name}
      </Typography>

      <Box sx={{mb: 4, display: "flex", gap: 2, alignItems: "center"}}>
        <Typography variant="body1" sx={{fontWeight: "medium"}}>
          Comparing Version: <b>{currentTemplate.version}</b> with
        </Typography>
        <FormControl sx={{minWidth: 200}} size="small">
          <InputLabel>Select Version</InputLabel>
          <Select value={selectedVersionId} label="Select Version" onChange={e => setSelectedVersionId(e.target.value)}>
            <MenuItem value="">
              <em>None</em>
            </MenuItem>
            {otherVersions.map(v => (
              <MenuItem key={v.id} value={v.id}>
                Version {v.version} ({new Date(v.createdAt).toLocaleDateString()})
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>

      <Grid container spacing={3}>
        {/* Current Version */}
        <Grid size={{xs: 12, md: selectedTemplate ? 6 : 12}}>
          <Paper sx={{p: 3, height: "100%"}}>
            <Typography variant="h6" sx={{mb: 2, pb: 1, borderBottom: "1px solid", borderColor: "divider"}}>
              Current ({currentTemplate.version})
            </Typography>
            <Box sx={{mb: 3}}>
              <Typography variant="subtitle2" color="textSecondary">
                Description
              </Typography>
              <Typography variant="body2" sx={{mb: 1}}>
                {currentTemplate.description || "N/A"}
              </Typography>
              <Typography variant="subtitle2" color="textSecondary">
                Default Expires In
              </Typography>
              <Typography variant="body2">
                {currentTemplate.defaultExpiresInHours ? `${currentTemplate.defaultExpiresInHours} Hours` : "DEFAULT"}
              </Typography>
            </Box>
            <ApprovalRuleViewer rule={currentTemplate.approvalRule} />
          </Paper>
        </Grid>

        {/* Selected Version */}
        {selectedTemplate && (
          <Grid size={{xs: 12, md: 6}}>
            <Paper sx={{p: 3, height: "100%", opacity: loadingCompare ? 0.5 : 1, transition: "opacity 0.2s"}}>
              {loadingCompare ? (
                <Box sx={{display: "flex", justifyContent: "center", p: 4}}>
                  <CircularProgress />
                </Box>
              ) : (
                <>
                  <Typography variant="h6" sx={{mb: 2, pb: 1, borderBottom: "1px solid", borderColor: "divider"}}>
                    Compared ({selectedTemplate.version})
                  </Typography>
                  <Box sx={{mb: 3}}>
                    <Typography variant="subtitle2" color="textSecondary">
                      Description
                    </Typography>
                    <Typography variant="body2" sx={{mb: 1}}>
                      {selectedTemplate.description || "N/A"}
                    </Typography>
                    <Typography variant="subtitle2" color="textSecondary">
                      Default Expires In
                    </Typography>
                    <Typography variant="body2">
                      {selectedTemplate.defaultExpiresInHours
                        ? `${selectedTemplate.defaultExpiresInHours} Hours`
                        : "DEFAULT"}
                    </Typography>
                  </Box>
                  <ApprovalRuleViewer rule={selectedTemplate.approvalRule} />
                </>
              )}
            </Paper>
          </Grid>
        )}
      </Grid>
    </Box>
  )
}

export default CompareWorkflowTemplatePage
