import React, {useState} from "react"
import {Box, Stepper, Step, StepLabel, Button, Paper, Container, CircularProgress, Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions} from "@mui/material"
import {useNavigate} from "react-router-dom"
import {useNotification} from "../providers/notification/NotificationContext"
import {handleEither} from "../utils/either"
import ErrorList, {type ErrorEntry} from "../components/common/ErrorList"
import {createWorkflowTemplate} from "../services/api"
import type {WorkflowTemplateCreate} from "@approvio/api"

import TemplateDetailsForm from "../components/workflow-templates/TemplateDetailsForm"
import TemplateRuleForm from "../components/workflow-templates/TemplateRuleForm"
import TemplateReview from "../components/workflow-templates/TemplateReview"

enum CreateTemplateSteps {
  Details = 0,
  ApprovalRule = 1,
  Review = 2,
}

const steps = ["Details", "Approval Rule", "Review"]

const CreateWorkflowTemplatePage: React.FC = () => {
  const [activeStep, setActiveStep] = useState<CreateTemplateSteps>(CreateTemplateSteps.Details)

  // Form State
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [defaultExpiresInHours, setDefaultExpiresInHours] = useState<number | null>(null)
  const [spaceId, setSpaceId] = useState<string | null>(null)
  const [ruleJson, setRuleJson] = useState("{\n  \n}")

  // Validation State
  const [nameError, setNameError] = useState<string | null>(null)
  const [isValidJson, setIsValidJson] = useState(false)
  const [defaultExpireError, setDefaultExpireError] = useState<string | null>(null)

  // Execution State
  const [loading, setLoading] = useState(false)
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

  const handleNext = () => {
    if (activeStep === CreateTemplateSteps.Details) {
      if (!name.trim()) {
        setNameError("Name is required.")
        return
      }
      if (!spaceId) {
        // Validation for spaceId is already handled partially by the UI but just in case
        addError("Space is required.")
        return
      }
      clearApiErrors()
    }

    if (activeStep === CreateTemplateSteps.ApprovalRule) {
      if (!isValidJson) {
        addError("Invalid Approval Rule JSON.")
        return
      }
      clearApiErrors()
    }

    setActiveStep(prev => prev + 1)
  }

  const handleBack = () => {
    setActiveStep(prev => prev - 1)
  }

  const handleCreate = async () => {
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

    if (!spaceId) {
       addError("Space ID is missing.")
       setLoading(false)
       return
    }

    const payload: WorkflowTemplateCreate = {
      name,
      description,
      spaceId,
      defaultExpiresInHours: defaultExpiresInHours ?? undefined,
      approvalRule: parsedRule,
    }

    const result = await createWorkflowTemplate(payload)

    handleEither(
      result,
      () => {
        notification.showSuccess("Workflow Template created successfully!")
        navigate("/workflow-templates")
      },
      (errorMessage: string) => {
        addError(errorMessage)
      }
    )

    setLoading(false)
  }

  const handleCancelClick = () => {
    setCancelDialogOpen(true)
  }

  const handleCancelConfirm = () => {
    setCancelDialogOpen(false)
    navigate("/workflow-templates")
  }

  const handleCancelClose = () => {
    setCancelDialogOpen(false)
  }

  const isNextDisabled = () => {
    if (activeStep === CreateTemplateSteps.Details) {
      return !name.trim() || !spaceId || loading
    }
    if (activeStep === CreateTemplateSteps.ApprovalRule) {
      return !isValidJson || loading
    }
    return loading
  }

  const getStepContent = (step: number) => {
    switch (step) {
      case CreateTemplateSteps.Details:
        return (
          <TemplateDetailsForm
            name={name}
            setName={setName}
            description={description}
            setDescription={setDescription}
            defaultExpiresInHours={defaultExpiresInHours}
            setDefaultExpiresInHours={setDefaultExpiresInHours}
            spaceId={spaceId}
            setSpaceId={setSpaceId}
            disableComponents={loading}
            nameError={nameError}
            setNameError={setNameError}
            defaultExpireError={defaultExpireError}
            setDefaultExpireError={setDefaultExpireError}
          />
        )
      case CreateTemplateSteps.ApprovalRule:
        return (
          <TemplateRuleForm
            ruleJson={ruleJson}
            setRuleJson={setRuleJson}
            disableComponents={loading}
            setIsValidJson={setIsValidJson}
          />
        )
      case CreateTemplateSteps.Review:
        return (
          <TemplateReview
            name={name}
            description={description}
            defaultExpiresInHours={defaultExpiresInHours}
            spaceId={spaceId}
            ruleJson={ruleJson}
          />
        )
    }
  }

  return (
    <Container maxWidth="md">
      <Paper sx={{p: {xs: 2, md: 3}, mt: 3}}>
        <Stepper activeStep={activeStep} sx={{pt: 3, pb: 5}}>
          {steps.map(label => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>

        <React.Fragment>
          {getStepContent(activeStep)}
          <Box sx={{mt: 3}}>
            <ErrorList errors={errors} />
          </Box>
          <Box sx={{display: "flex", justifyContent: "space-between", mt: 3}}>
            <Button variant="contained" color="error" onClick={handleCancelClick} disabled={loading}>
              Cancel
            </Button>
            <Box>
              {activeStep !== 0 && (
                <Button onClick={handleBack} sx={{mr: 1}} disabled={loading}>
                  Back
                </Button>
              )}
              {activeStep === steps.length - 1 ? (
                <Button variant="contained" onClick={handleCreate} disabled={loading}>
                  {loading ? <CircularProgress size={24} color="inherit" /> : "Create Template"}
                </Button>
              ) : (
                <Button variant="contained" onClick={handleNext} disabled={isNextDisabled()}>
                  Next
                </Button>
              )}
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

export default CreateWorkflowTemplatePage
