import { type FrontendError } from "../services/api"
import React, {useState} from "react"
import {useNavigate} from "react-router-dom"
import {useNotification} from "../providers/notification/NotificationContext"
import {handleEither} from "../utils/either"
import CreateGroupForm from "../components/groups/GroupDetailsForm"
import AssignUsersStep from "../components/groups/AssignUsersStep"
import ErrorList, {type ErrorEntry} from "../components/common/ErrorList"
import type { GroupCreate, UserSummary } from "@approvio/api"
import {createGroup, addGroupEntities} from "../services/api"
import MultiStepFormLayout, { type StepDefinition } from "@/components/common/MultiStepFormLayout"
import { Users, UserPlus } from "lucide-react"

enum CreateGroupSteps {
  CreateGroup = "CreateGroup",
  AssignUsers = "AssignUsers",
}

const stepOrder: CreateGroupSteps[] = [CreateGroupSteps.CreateGroup, CreateGroupSteps.AssignUsers]

const steps: StepDefinition[] = [
  { id: CreateGroupSteps.CreateGroup, label: "Create Group", icon: Users },
  { id: CreateGroupSteps.AssignUsers, label: "Assign Users (Optional)", icon: UserPlus }
]

function getNextStep(activeStep: CreateGroupSteps): CreateGroupSteps {
  const nextIndex = stepOrder.indexOf(activeStep) + 1
  if (nextIndex < stepOrder.length && stepOrder[nextIndex]) {
    return stepOrder[nextIndex]
  }
  return activeStep
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
  const [usersToAssign, setUsersToAssign] = useState<UserSummary[]>([])

  const navigate = useNavigate()
  const notification = useNotification()

  // Conditions to advance to the next step from the step mentioned in the key
  const canAdvanceToNextStep: Record<CreateGroupSteps, boolean> = {
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
      const result = await createGroup(payload)

      handleEither(
        result,
        (newGroupId: string) => {
          setCreatedGroupId(newGroupId)
          setGroupSuccessfullyCreated(true)
          setActiveStep(getNextStep(activeStep))
          notification.showSuccess("Group created successfully!")
        },
        (error: FrontendError) => {
          addError(error.message)
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
        entity: {entityType: "human", entityId: user.id}
      }))
    }

    const result = await addGroupEntities(createdGroupId, assignmentPayload)

    handleEither(
      result,
      () => {
        notification.showSuccess(`${usersToAssign.length} users assigned successfully!`)
        navigate("/groups")
      },
      (error: FrontendError) => {
        addError(error.message)
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

  const activeStepIndex = stepOrder.indexOf(activeStep)
  const isLastStep = activeStep === CreateGroupSteps.AssignUsers

  return (
    <MultiStepFormLayout
      pageTitle="Create Group"
      pageDescription="Set up a new group for managing access and approvals."
      cardIcon={activeStep === CreateGroupSteps.CreateGroup ? Users : UserPlus}
      cardIconColorClass="text-blue-500"
      cardIconBgClass="border-blue-500/20 bg-blue-500/10"
      cardTitle={steps[activeStepIndex]?.label || ""}
      cardDescription={
        activeStep === CreateGroupSteps.CreateGroup
          ? "Define the group's name and description."
          : "Add members to the new group."
      }
      steps={steps}
      activeStepIndex={activeStepIndex}
      onCancelClick={() => navigate("/groups")}
      showCancelConfirmDialog={false}
      showSkipButton={isLastStep}
      onSkipClick={handleSkipUserAssignment}
      onPrimaryClick={isLastStep ? handleAssignUsers : handleNext}
      primaryButtonText={isLastStep ? "Assign Users" : "Create Group"}
      isPrimaryLoading={loading}
      isPrimaryDisabled={!canAdvanceToNextStep[activeStep]}
    >
      {getStepContent(activeStep)}
      {errors.length > 0 && (
        <div className="mt-6">
          <ErrorList errors={errors} />
        </div>
      )}
    </MultiStepFormLayout>
  )
}

export default CreateGroupPage
