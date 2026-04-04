import React, {useState} from "react"
import {Box, Stepper, Step, StepLabel, Button, Paper, Container, CircularProgress} from "@mui/material"
import {useNavigate} from "react-router-dom"
import {useNotification} from "../providers/notification/NotificationContext"
import {handleEither} from "../utils/either"
import SpaceDetailsForm from "../components/spaces/SpaceDetailsForm"
import ErrorList, {type ErrorEntry} from "../components/common/ErrorList"
import type {SpaceCreate} from "@approvio/api"
import {createSpace} from "../services/api"

enum CreateSpaceSteps {
  CreateSpace = "CreateSpace",
}

const stepOrder: CreateSpaceSteps[] = [CreateSpaceSteps.CreateSpace]

const stepTitles: Record<CreateSpaceSteps, string> = {
  [CreateSpaceSteps.CreateSpace]: "Create Space",
}

const CreateSpacePage: React.FC = () => {
  const [activeStep] = useState<CreateSpaceSteps>(CreateSpaceSteps.CreateSpace)
  const [spaceName, setSpaceName] = useState("")
  const [spaceDescription, setSpaceDescription] = useState("")
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<ErrorEntry[]>([])
  const [spaceNameError, setSpaceNameError] = useState<string | null>(null)

  const navigate = useNavigate()
  const notification = useNotification()

  const canCreateSpace = spaceNameError === null && spaceName.trim() !== ""

  const addError = (message: string) => {
    const now = new Date()
    const timestamp = `${now.getHours()}:${String(now.getMinutes()).padStart(2, "0")}`
    setErrors(prevErrors => [{message, timestamp}, ...prevErrors])
  }

  const clearApiErrors = () => {
    setErrors([])
  }

  const clearValidationErrors = () => {
    setSpaceNameError(null)
  }

  const handleCreate = async () => {
    if (!spaceName.trim()) {
      setSpaceNameError("Space name is required.")
      return
    }
    setLoading(true)

    clearValidationErrors()
    clearApiErrors()

    const payload: SpaceCreate = {name: spaceName, description: spaceDescription}
    const result = await createSpace(payload)

    handleEither(
      result,
      () => {
        notification.showSuccess("Space created successfully!")
        navigate("/spaces")
      },
      (errorMessage: string) => {
        addError(errorMessage)
      }
    )

    setLoading(false)
  }

  const handleCancel = () => {
    navigate("/spaces")
  }

  return (
    <Container maxWidth="md">
      <Paper sx={{p: {xs: 2, md: 3}, mt: 3}}>
        <Stepper activeStep={stepOrder.indexOf(activeStep)} sx={{pt: 3, pb: 5}}>
          {Object.values(CreateSpaceSteps).map(step => (
            <Step key={step}>
              <StepLabel>{stepTitles[step]}</StepLabel>
            </Step>
          ))}
        </Stepper>

        <React.Fragment>
          <SpaceDetailsForm
            spaceName={spaceName}
            setSpaceName={setSpaceName}
            spaceDescription={spaceDescription}
            setSpaceDescription={setSpaceDescription}
            disableComponents={loading}
            spaceNameError={spaceNameError}
            setSpaceNameError={setSpaceNameError}
          />
          <Box sx={{mt: 3}}>
            <ErrorList errors={errors} />
          </Box>
          <Box sx={{display: "flex", justifyContent: "flex-end", mt: 3}}>
            <Button onClick={handleCancel} sx={{mr: 1}} disabled={loading}>
              Cancel
            </Button>
            <Button variant="contained" onClick={handleCreate} disabled={loading || !canCreateSpace}>
              {loading ? <CircularProgress size={24} color="inherit" /> : "Create Space"}
            </Button>
          </Box>
        </React.Fragment>
      </Paper>
    </Container>
  )
}

export default CreateSpacePage
