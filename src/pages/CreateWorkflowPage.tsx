import React, {useState} from "react"
import {useNavigate} from "react-router-dom"
import {useNotification} from "@/providers/notification/NotificationContext"
import {handleEither} from "@/utils/either"
import ErrorList, {type ErrorEntry} from "@/components/common/ErrorList"
import {createWorkflow, type FrontendError} from "@/services/api"
import type {WorkflowCreate, WorkflowTemplateSummary} from "@approvio/api"

import WorkflowDetailsForm from "@/components/workflows/WorkflowDetailsForm"
import WorkflowReview from "@/components/workflows/WorkflowReview"
import MultiStepFormLayout, {type StepDefinition} from "@/components/common/MultiStepFormLayout"
import {GitBranch, Settings2, CheckCircle2} from "lucide-react"

enum CreateWorkflowSteps {
  Details = 0,
  Review = 1
}

const steps: StepDefinition[] = [
  {id: CreateWorkflowSteps.Details, label: "Details", icon: Settings2},
  {id: CreateWorkflowSteps.Review, label: "Review", icon: CheckCircle2}
]

const CreateWorkflowPage: React.FC = () => {
  const [activeStep, setActiveStep] = useState<CreateWorkflowSteps>(CreateWorkflowSteps.Details)

  // Form State
  const [templateId, setTemplateId] = useState<string | null>(null)
  const [template, setTemplate] = useState<WorkflowTemplateSummary | null>(null)
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [metadata] = useState<Record<string, string>>({}) // Metadata is not implemented in UI yet per requirements

  // Validation State
  const [nameError, setNameError] = useState<string | null>(null)
  const [templateError, setTemplateError] = useState<string | null>(null)

  // Execution State
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<ErrorEntry[]>([])

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
    if (activeStep === CreateWorkflowSteps.Details) {
      let hasError = false
      if (!templateId) {
        setTemplateError("Please select a workflow template.")
        hasError = true
      }
      if (!name.trim()) {
        setNameError("Name is required.")
        hasError = true
      }
      if (hasError) return

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

    if (!templateId) {
      addError("Template ID is missing.")
      setLoading(false)
      return
    }

    const payload: WorkflowCreate = {
      name,
      description,
      workflowTemplateId: templateId,
      metadata: Object.keys(metadata).length > 0 ? metadata : undefined
    }

    const result = await createWorkflow(payload)

    handleEither(
      result,
      () => {
        notification.showSuccess("Workflow created successfully!")
        navigate("/workflows")
      },
      (error: FrontendError) => {
        addError(error.message)
      }
    )

    setLoading(false)
  }

  const handleCancelConfirm = () => {
    navigate("/workflows")
  }

  const isNextDisabled = () => {
    if (activeStep === CreateWorkflowSteps.Details) {
      return !name.trim() || !templateId || loading
    }
    return loading
  }

  const getStepContent = (step: number) => {
    switch (step) {
      case CreateWorkflowSteps.Details:
        return (
          <WorkflowDetailsForm
            name={name}
            setName={setName}
            description={description}
            setDescription={setDescription}
            templateId={templateId}
            setTemplateId={setTemplateId}
            setTemplate={setTemplate}
            disabled={loading}
            nameError={nameError}
            setNameError={setNameError}
            templateError={templateError}
            setTemplateError={setTemplateError}
          />
        )
      case CreateWorkflowSteps.Review:
        return <WorkflowReview name={name} description={description} template={template} />
    }
  }

  return (
    <MultiStepFormLayout
      pageTitle="Create Workflow"
      pageDescription="Start a new approval workflow from a template."
      cardIcon={GitBranch}
      cardIconColorClass="text-emerald-500"
      cardIconBgClass="border-emerald-500/20 bg-emerald-500/10"
      cardTitle={steps[activeStep]?.label || ""}
      cardDescription={
        activeStep === CreateWorkflowSteps.Details
          ? "Select a template and configure basic information."
          : "Verify workflow configuration before creation."
      }
      steps={steps}
      activeStepIndex={activeStep}
      onCancelConfirm={handleCancelConfirm}
      showCancelConfirmDialog={true}
      showBackButton={activeStep > 0}
      onBackClick={handleBack}
      onPrimaryClick={activeStep === steps.length - 1 ? handleCreate : handleNext}
      primaryButtonText={activeStep === steps.length - 1 ? "Create Workflow" : "Next Step"}
      isPrimaryLoading={loading}
      isPrimaryDisabled={isNextDisabled()}
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

export default CreateWorkflowPage
