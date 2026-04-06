import React, {useState, useEffect} from "react"
import {
  Box,
  Button,
  Paper,
  Container,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Typography
} from "@mui/material"
import {useParams, useNavigate} from "react-router-dom"
import {useNotification} from "../providers/notification/NotificationContext"
import {handleEither} from "../utils/either"
import ErrorList, {type ErrorEntry} from "../components/common/ErrorList"
import {getWorkflowTemplate, updateWorkflowTemplate, type FrontendError} from "../services/api"
import type {WorkflowTemplateUpdate, WorkflowTemplate} from "@approvio/api"

import TemplateRuleForm from "../components/workflow-templates/TemplateRuleForm"

const WorkflowTemplateEditRulePage: React.FC = () => {
  const {templateIdentifier} = useParams<{templateIdentifier: string}>()
  const [template, setTemplate] = useState<WorkflowTemplate | null>(null)

  // Form State
  const [ruleJson, setRuleJson] = useState("{\n  \n}")

  // Validation State
  const [isValidJson, setIsValidJson] = useState(false)

  // Execution State
  const [loading, setLoading] = useState(true)
  const [errors, setErrors] = useState<ErrorEntry[]>([])
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false)

  const navigate = useNavigate()
  const notification = useNotification()

  const addError = (message: string) => {
    const now = new Date()
    const timestamp = `${now.getHours()}:${String(now.getMinutes()).padStart(2, "0")}`
    setErrors(prevErrors => [{message, timestamp}, ...prevErrors])
  }

  const clearApiErrors = () => {
    setErrors([])
  }

  useEffect(() => {
    const fetchTemplateDetails = async () => {
      if (!templateIdentifier) return

      setLoading(true)
      clearApiErrors()

      const result = await getWorkflowTemplate(templateIdentifier)

      handleEither(
        result,
        (templateData: WorkflowTemplate) => {
          setTemplate(templateData)
          setRuleJson(JSON.stringify(templateData.approvalRule, null, 2))
          setIsValidJson(true)
        },
        (errorMessage: FrontendError) => {
          addError(errorMessage.message)
          notification.showError(errorMessage.message)
        }
      )

      setLoading(false)
    }

    fetchTemplateDetails()
  }, [templateIdentifier, notification])

  const handleUpdate = async () => {
    setLoading(true)
    clearApiErrors()

    let parsedRule
    try {
      parsedRule = JSON.parse(ruleJson)
    } catch {
      addError("Invalid Approval Rule JSON.")
      setLoading(false)
      return
    }

    if (!templateIdentifier || !template) {
      addError("Template identifier or template details are missing.")
      setLoading(false)
      return
    }

    const payload: WorkflowTemplateUpdate = {
      approvalRule: parsedRule,
      concurrencyControl: template.concurrencyControl,
      cancelWorkflows: false
    }

    const result = await updateWorkflowTemplate(template.name, payload)

    handleEither(
      result,
      () => {
        notification.showSuccess("Workflow Template Approval Rule updated successfully!")
        navigate(`/workflow-templates/${template.id}`)
      },
      (error: FrontendError) => {
        addError(error.message)
      }
    )

    setLoading(false)
  }

  const handleCancelClick = () => {
    setCancelDialogOpen(true)
  }

  const handleCancelConfirm = () => {
    setCancelDialogOpen(false)
    navigate(`/workflow-templates/${template?.id || templateIdentifier}`)
  }

  const handleCancelClose = () => {
    setCancelDialogOpen(false)
  }

  const isNextDisabled = () => {
    return !isValidJson || loading
  }

  if (loading && !template) {
    return (
      <Box sx={{display: "flex", justifyContent: "center", alignItems: "center", height: "80vh"}}>
        <CircularProgress />
      </Box>
    )
  }

  return (
    <Container maxWidth="md">
      <Paper sx={{p: {xs: 2, md: 3}, mt: 3}}>
        <Typography variant="h5" sx={{mb: 3}} data-testid="edit-rule-header">
          Edit Approval Rule - {template?.name}
        </Typography>

        <React.Fragment>
          <TemplateRuleForm
            ruleJson={ruleJson}
            setRuleJson={setRuleJson}
            disableComponents={loading}
            setIsValidJson={setIsValidJson}
          />
          <Box sx={{mt: 3}}>
            <ErrorList errors={errors} />
          </Box>
          <Box sx={{display: "flex", justifyContent: "space-between", mt: 3}}>
            <Button variant="contained" color="error" onClick={handleCancelClick} disabled={loading}>
              Cancel
            </Button>
            <Box>
              <Button variant="contained" onClick={handleUpdate} disabled={isNextDisabled()}>
                {loading ? <CircularProgress size={24} color="inherit" /> : "Update Rule"}
              </Button>
            </Box>
          </Box>
        </React.Fragment>
      </Paper>

      <Dialog
        open={cancelDialogOpen}
        onClose={handleCancelClose}
        aria-labelledby="cancel-dialog-title"
        aria-describedby="cancel-dialog-description"
      >
        <DialogTitle id="cancel-dialog-title">Discard unsaved changes?</DialogTitle>
        <DialogContent>
          <DialogContentText id="cancel-dialog-description">
            Are you sure you want to cancel? Any unsaved changes you have made will be lost.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCancelClose} color="primary">
            Keep Editing
          </Button>
          <Button onClick={handleCancelConfirm} color="error">
            Discard Changes
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  )
}

export default WorkflowTemplateEditRulePage
