import React, {useState} from "react"
import {Box, Stepper, Step, StepLabel, Button, Paper, Container, CircularProgress} from "@mui/material"
import {useNavigate} from "react-router-dom"
import {useNotification} from "../providers/notification/NotificationContext"
import {handleEither} from "../utils/either"
import CreateGroupForm from "../components/groups/GroupDetailsForm"
import AssignUsersStep from "../components/groups/AssignUsersStep"
import ErrorList, {type ErrorEntry} from "../components/common/ErrorList"
import type { GroupCreate } from "@approvio/api"
import {useAuthToken} from "../hooks/useAuthToken"
import {createGroup, addGroupEntities} from "../services/api"

interface UserAssignment {
  id: string
  role: string
}

enum CreateGroupSteps {
  CreateGroup = "CreateGroup",
  AssignUsers = "AssignUsers",
}

const stepOrder : CreateGroupSteps[] = [CreateGroupSteps.CreateGroup, CreateGroupSteps.AssignUsers]

const stepTitles : Record<CreateGroupSteps, string> = {
  [CreateGroupSteps.CreateGroup]: "Create Group",
  [CreateGroupSteps.AssignUsers]: "Assign Users (Optional)",
}

const advanceButtonText : Record<CreateGroupSteps, string> = {
  [CreateGroupSteps.CreateGroup]: "Create Group",
  [CreateGroupSteps.AssignUsers]: "Assign Users",
}

function getNextStep(activeStep: CreateGroupSteps) : CreateGroupSteps {
  const nextIndex = stepOrder.indexOf(activeStep) + 1
  if (nextIndex < stepOrder.length && stepOrder[nextIndex]) {
    return stepOrder[nextIndex]
  }
  return activeStep
}

function isStepCompleted(activeStep: CreateGroupSteps, stepToValidate: CreateGroupSteps) : boolean {
  return stepOrder.indexOf(activeStep) > stepOrder.indexOf(stepToValidate)
}

const CreateGroupPage: React.FC = () => {
  const [activeStep, setActiveStep] = useState<CreateGroupSteps>(CreateGroupSteps.CreateGroup)
  const [groupName, setGroupName] = useState("")
  const [groupDescription, setGroupDescription] = useState("")
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<ErrorEntry[]>([])
  const [groupSuccessfullyCreated, setGroupSuccessfullyCreated] = useState(false)
  const [createdGroupId, setCreatedGroupId] = useState<string | undefined>(undefined)
  const [groupNameError, setGroupNameError] = useState<string | null>(null)
  const [usersToAssign, setUsersToAssign] = useState<UserAssignment[]>([])

  const authToken = useAuthToken()
  const navigate = useNavigate()
  const notification = useNotification()

  // Conditions to advance to the next step from the step mentioned in the key
  const canAdvanceToNextStep : Record<CreateGroupSteps, boolean> = {
    [CreateGroupSteps.CreateGroup]: groupNameError === null && groupName.trim() !== "",
    [CreateGroupSteps.AssignUsers]: true,
  }

  const addError = (message: string) => {
    const now = new Date()
    const timestamp = `${now.getHours()}:${String(now.getMinutes()).padStart(2, "0")}`
    setErrors(prevErrors => [{message, timestamp}, ...prevErrors])
  }

  const clearApiErrors = () => {
    setErrors([])
  }

  const clearValidationErrors = () => {
    setGroupNameError(null)
  }

  const handleNext = async () => {
    if (activeStep === CreateGroupSteps.CreateGroup) {
      if (!groupName.trim()) {
        setGroupNameError("Group name is required.")
        return
      }
      setLoading(true)

      clearValidationErrors()
      clearApiErrors()

      const payload: GroupCreate = {name: groupName, description: groupDescription}
      const result = await createGroup(payload, authToken)

      handleEither(
        result,
        (newGroupId: string) => {
          setCreatedGroupId(newGroupId)
          setGroupSuccessfullyCreated(true)
          setActiveStep(getNextStep(activeStep))
          notification.showSuccess("Group created successfully!")
        },
        (errorMessage: string) => {
          addError(errorMessage)
          setGroupSuccessfullyCreated(false)
          setCreatedGroupId(undefined)
        }
      )

      setLoading(false)
    }
  }

  const handleSkipUserAssignment = () => {
    navigate("/groups")
  }

  const handleAssignUsers = async () => {
    if (!createdGroupId) {
      addError("Group ID is missing for assignment.")
      return
    }
    if (usersToAssign.length === 0) {
      addError("No users selected to assign.")
      return
    }
    setLoading(true)
    clearApiErrors()

    const assignmentPayload = {
      entities: usersToAssign.map(user => ({
        entity: {entityType: "human", entityId: user.id},
        role: user.role
      }))
    }

    const result = await addGroupEntities(createdGroupId, assignmentPayload, authToken)

    handleEither(
      result,
      () => {
        notification.showSuccess(`${usersToAssign.length} users assigned successfully!`)
        navigate("/groups")
      },
      (errorMessage: string) => {
        addError(errorMessage)
      }
    )

    setLoading(false)
  }

  const getStepContent = (step: CreateGroupSteps) => {
    switch (step) {
      case CreateGroupSteps.CreateGroup:
        return (
          <CreateGroupForm
            groupName={groupName}
            setGroupName={setGroupName}
            groupDescription={groupDescription}
            setGroupDescription={setGroupDescription}
            disableComponents={loading || activeStep !== CreateGroupSteps.CreateGroup}
            groupNameError={groupNameError}
            setGroupNameError={setGroupNameError}
          />
        )
      case CreateGroupSteps.AssignUsers:
        return (
          <AssignUsersStep
            groupName={groupName}
            groupSuccessfullyCreated={groupSuccessfullyCreated}
            groupId={createdGroupId}
            loading={loading}
            onSelectedUsersChange={setUsersToAssign}
          />
        )
    }
  }

  return (
    <Container maxWidth="md">
      <Paper sx={{p: {xs: 2, md: 3}, mt: 3}}>
        <Stepper activeStep={stepOrder.indexOf(activeStep)} sx={{pt: 3, pb: 5}}>
          {
            Object.values(CreateGroupSteps).map(step => (
              <Step
                key={step}
                completed={isStepCompleted(activeStep, step)}
              >
                <StepLabel>{stepTitles[step]}</StepLabel>
              </Step>
            ))
          }
        </Stepper>

        <React.Fragment>
          {getStepContent(activeStep)}
          <Box sx={{mt: 3}}>
            <ErrorList errors={errors} />
          </Box>
          <Box sx={{display: "flex", justifyContent: "flex-end", mt: 3}}>
            {activeStep === CreateGroupSteps.AssignUsers && (
              <Button onClick={handleSkipUserAssignment} sx={{mr: 1}} disabled={loading}>
                Skip
              </Button>
            )}
            <Button
              variant="contained"
              onClick={activeStep === CreateGroupSteps.AssignUsers ? handleAssignUsers : handleNext}
              disabled={
                loading ||
                !canAdvanceToNextStep[activeStep]
              }
            >
              {loading ? (
                <CircularProgress size={24} color="inherit" />
              ) : advanceButtonText[activeStep]}
            </Button>
          </Box>
        </React.Fragment>
      </Paper>
    </Container>
  )
}

export default CreateGroupPage
