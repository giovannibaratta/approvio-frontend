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
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Loader2, ArrowLeft, Users, UserPlus } from "lucide-react"

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
  const [usersToAssign, setUsersToAssign] = useState<UserSummary[]>([])

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

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate("/groups")} disabled={loading} className="shrink-0">
          <ArrowLeft className="size-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Create Group</h1>
          <p className="text-sm text-muted-foreground">Set up a new group for managing access and approvals.</p>
        </div>
      </div>

      {/* Stepper */}
      <div className="relative mb-8 flex items-center justify-between px-8 md:px-16">
        <div className="absolute inset-x-0 top-1/2 -z-10 h-0.5 -translate-y-1/2 bg-muted/50" />
        {stepOrder.map((step) => {
          const isActive = activeStep === step
          const isCompleted = isStepCompleted(activeStep, step)

          return (
            <div key={step} className="flex flex-col items-center gap-2 bg-background px-2">
              <div
                className={`flex size-10 items-center justify-center rounded-full border-2 transition-colors
                  ${isActive
                    ? "border-primary bg-primary text-primary-foreground"
                    : isCompleted
                      ? "border-primary bg-primary/20 text-primary"
                      : "border-muted bg-background text-muted-foreground"
                  }`}
              >
                {step === CreateGroupSteps.CreateGroup ? <Users className="size-5" /> : <UserPlus className="size-5" />}
              </div>
              <span className={`text-xs font-medium uppercase tracking-wider ${isActive || isCompleted ? "text-foreground" : "text-muted-foreground"}`}>
                {stepTitles[step]}
              </span>
            </div>
          )
        })}
      </div>

      <Card className="border-border/50 bg-background/50 backdrop-blur-sm">
        <CardHeader className="border-b border-border/40 bg-muted/20 pb-4">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-md border border-blue-500/20 bg-blue-500/10">
              {activeStep === CreateGroupSteps.CreateGroup ? <Users className="size-5 text-blue-500" /> : <UserPlus className="size-5 text-blue-500" />}
            </div>
            <div>
              <CardTitle className="text-lg">{stepTitles[activeStep]}</CardTitle>
              <CardDescription>
                {activeStep === CreateGroupSteps.CreateGroup
                  ? "Define the group's name and description."
                  : "Add members to the new group."}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          {getStepContent(activeStep)}
          {errors.length > 0 && (
            <div className="mt-6">
              <ErrorList errors={errors} />
            </div>
          )}
        </CardContent>
        <CardFooter className="flex justify-end gap-3 border-t border-border/40 bg-muted/20 py-4">
          {activeStep === CreateGroupSteps.AssignUsers && (
            <Button variant="outline" onClick={handleSkipUserAssignment} disabled={loading}>
              Skip
            </Button>
          )}
          <Button
            onClick={activeStep === CreateGroupSteps.AssignUsers ? handleAssignUsers : handleNext}
            disabled={loading || !canAdvanceToNextStep[activeStep]}
            className="min-w-[120px]"
          >
            {loading && <Loader2 className="mr-2 size-4 animate-spin" />}
            {loading ? "Processing..." : advanceButtonText[activeStep]}
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}

export default CreateGroupPage
